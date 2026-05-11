import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { Prisma } from '@prisma/client';
import { hashPassword, verifyPassword, encryptSecret, decryptSecret } from '../lib/crypto';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { AppError, ErrorCodes } from '../lib/app-error';
import { logger } from '../lib/logger';
import speakeasy from 'speakeasy';

export interface RequestUser {
  id: string;
  email: string;
  role: string;
  tenantId: string | null;
}

// ─── Environment Validation ───────────────────────────────────────────────────

export function validateAuthEnvironment(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const missingVars: string[] = [];

  // JWT signing keys (for access token)
  if (!process.env.JWT_PRIVATE_KEY_PATH && !process.env.JWT_PRIVATE_KEY) {
    missingVars.push('JWT_PRIVATE_KEY or JWT_PRIVATE_KEY_PATH');
  }
  if (!process.env.JWT_PUBLIC_KEY_PATH && !process.env.JWT_PUBLIC_KEY) {
    missingVars.push('JWT_PUBLIC_KEY or JWT_PUBLIC_KEY_PATH');
  }

  // Refresh token secret
  if (!process.env.JWT_REFRESH_SECRET) {
    missingVars.push('JWT_REFRESH_SECRET');
  }

  if (missingVars.length > 0) {
    if (isProduction) {
      const error = new Error(
        `Missing required environment variables in production: ${missingVars.join(', ')}`
      );
      logger.fatal({ missingVars }, 'Auth environment validation failed');
      throw error;
    } else {
      logger.warn({ missingVars }, 'Auth environment missing variables (ignored in dev)');
    }
  } else {
    logger.info('Auth environment validation passed');
  }
}

// ─── Key loading ──────────────────────────────────────────────────────────────

function getPrivateKey(): string {
  if (process.env.JWT_PRIVATE_KEY) {
    return process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
  }
  if (process.env.JWT_PRIVATE_KEY_PATH) {
    return fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH, 'utf8');
  }
  throw new Error('JWT_PRIVATE_KEY or JWT_PRIVATE_KEY_PATH must be defined');
}

function getPublicKey(): string {
  if (process.env.JWT_PUBLIC_KEY) {
    return process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
  }
  if (process.env.JWT_PUBLIC_KEY_PATH) {
    return fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, 'utf8');
  }
  throw new Error('JWT_PUBLIC_KEY or JWT_PUBLIC_KEY_PATH must be defined');
}

// ─── RLS bypass for auth operations ──────────────────────────────────────────
// Auth endpoints run before we know the user's role/tenant, so we use
// super_admin context to bypass RLS for credential lookups.
async function withAuthContext<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // set_config with is_local=true is transaction-scoped (equivalent to SET LOCAL)
    // 'current_role' is a PostgreSQL reserved keyword so SET LOCAL syntax fails;
    // set_config() accepts it as a plain string safely.
    await tx.$executeRaw`SELECT set_config('app.current_role', 'super_admin', true)`;
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', '00000000-0000-0000-0000-000000000000', true)`;
    return fn(tx);
  });
}

// ─── Token helpers ────────────────────────────────────────────────────────────

function issueAccessToken(user: { id: string; email: string; role: string; tenantId: string | null }): string {
  // Cast options because @types/jsonwebtoken uses branded StringValue for expiresIn
  const opts = { algorithm: 'RS256', expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m', subject: user.id } as jwt.SignOptions;
  return jwt.sign(
    { email: user.email, role: user.role, tenantId: user.tenantId },
    getPrivateKey(),
    opts,
  );
}

async function issueRefreshToken(userId: string): Promise<string> {
  const jti = randomUUID();
  const opts = { expiresIn: process.env.JWT_REFRESH_EXPIRES ?? '7d', subject: userId } as jwt.SignOptions;
  const refreshToken = jwt.sign(
    { jti },
    process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
    opts,
  );
  const ttl = 7 * 24 * 3600;
  await redis.setex(`refresh:${jti}`, ttl, userId);
  return refreshToken;
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export class AuthService {
  async handleSSOCallback(tenantSlug: string, ssoProfile: any, ipAddress: string) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new AppError(ErrorCodes.NOT_FOUND, 'Tenant not found', 404);
    if (!tenant.ssoEnabled) throw new AppError(ErrorCodes.FORBIDDEN, 'SSO not enabled for this tenant', 403);

    const email = ssoProfile.email?.toLowerCase().trim();
    if (!email) throw new AppError(ErrorCodes.VALIDATION_ERROR, 'SSO profile missing email', 400);

    const user = await withAuthContext(async (tx) => {
      let u = await tx.user.findFirst({ where: { email, tenantId: tenant.id, deletedAt: null } });

      if (!u) {
        u = await tx.user.create({
          data: {
            tenantId: tenant.id,
            email,
            firstName: ssoProfile.firstName || 'SSO',
            lastName: ssoProfile.lastName || 'User',
            role: 'student',
            status: 'active',
            ssoSubject: ssoProfile.nameID || ssoProfile.sub || email,
          },
        });
        await tx.auditLog.create({
          data: {
            actorId: u.id, actorEmail: u.email, actorRole: u.role, tenantId: tenant.id,
            action: 'USER_CREATED_VIA_SSO', entityType: 'user', entityId: u.id,
            afterState: { email: u.email, ssoProvider: tenant.ssoProvider }, ipAddress,
          },
        });
      } else {
        if (u.status !== 'active' && u.status !== 'sso_only') {
          throw new AppError(ErrorCodes.FORBIDDEN, 'Account is not active', 403);
        }
        await tx.user.update({
          where: { id: u.id },
          data: { lastLoginAt: new Date(), ssoSubject: ssoProfile.nameID || ssoProfile.sub || email },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: u.id, actorEmail: u.email, actorRole: u.role, tenantId: tenant.id,
          action: 'LOGIN_SSO', entityType: 'user', entityId: u.id, ipAddress,
        },
      });

      return u;
    });

    const accessToken  = issueAccessToken(user);
    const refreshToken = await issueRefreshToken(user.id);
    return { accessToken, refreshToken, user: toUserDTO(user) };
  }

  async login(emailOrLoginId: string, password: string, ipAddress: string) {
    const normalizedInput = (emailOrLoginId ?? '').toLowerCase().trim();
    const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$dummydummydummy$dummydummydummy';

    // Step 1: Try Prisma User table first (new v1 users)
    let user = await withAuthContext((tx) =>
      tx.user.findFirst({
        where: {
          OR: [
            { email: normalizedInput, deletedAt: null },
            { employeeId: normalizedInput, deletedAt: null },
          ],
        },
      })
    );

    // Step 1b: If not found in Prisma, check Sequelize IndividualStudent (legacy users)
    let legacyStudent: any = null;
    if (!user) {
      try {
        const { IndividualStudent } = require('../models');
        legacyStudent = await IndividualStudent.findOne({
          where: {
            [require('sequelize').Op.or]: [
              { email: normalizedInput },
              { login_id: normalizedInput },
            ],
          },
        });
        if (legacyStudent) {
          console.debug('[AUTH] Found user in legacy IndividualStudent table');
        }
      } catch (e: any) {
        console.debug('[AUTH] Legacy student lookup failed:', e.message);
      }
    }

    // If found in legacy table, verify password with bcrypt
    if (legacyStudent) {
      const bcrypt = require('bcryptjs');
      const isValid = await bcrypt.compare(password, legacyStudent.password_hash);
      if (!isValid) {
        throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password', 401);
      }

      // Check service status
      if (legacyStudent.service_status === 'stopped') {
        throw new AppError(ErrorCodes.FORBIDDEN, 'Your LMS access has been stopped. Please contact your administrator.', 403);
      }

      // Update last login
      await legacyStudent.update({ last_login: new Date() });

      // Issue tokens for legacy user using the same JWT system
      const userObj = {
        id: legacyStudent.student_id,
        email: legacyStudent.email,
        role: 'student',
        tenantId: null,
      };
      const accessToken = issueAccessToken(userObj);
      const refreshToken = await issueRefreshToken(legacyStudent.student_id);

      return {
        mfaRequired: false,
        accessToken,
        refreshToken,
        user: {
          id: legacyStudent.student_id,
          email: legacyStudent.email,
          firstName: legacyStudent.name?.split(' ')[0] || 'User',
          lastName: legacyStudent.name?.split(' ').slice(1).join(' ') || '',
          role: 'student',
          tenantId: null,
        },
      };
    }

    console.debug('[AUTH] login lookup:', { normalizedInput, found: !!user, userId: user?.id, loginBy: user?.email === normalizedInput ? 'email' : 'employeeId' });

    if (user?.lockedUntil && new Date() < user.lockedUntil) {
      const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60_000);
      throw new AppError(ErrorCodes.ACCOUNT_LOCKED, `Account locked for ${remaining} more minute(s)`, 423);
    }

    // Step 2: Verify password (CPU-bound — done outside any DB transaction)
    let isValid = false;
    if (user) {
      try {
        if (user.passwordHash) {
          isValid = await verifyPassword(user.passwordHash, password);
        }
      } catch (e) {
        // argon2 verify threw — fall through to bcrypt fallback
      }

      if (!isValid && (user as any).password) {
        const bcrypt = require('bcryptjs');
        isValid = await bcrypt.compare(password, (user as any).password);
      }

      logger.info({ userId: user.id, hasPasswordHash: !!user.passwordHash, hasLegacyPassword: !!(user as any).password }, 'Auth lookup');
    } else {
      try { await verifyPassword(dummyHash, password); } catch {} // timing equalization
    }

    // Step 3: Handle failed login — increment counter with RLS bypass
    if (!user || !isValid) {
      if (user) {
        const attempts = user.loginAttempts + 1;
        await withAuthContext((tx) =>
          tx.user.update({
            where: { id: user.id },
            data: { loginAttempts: attempts, lockedUntil: attempts >= 5 ? new Date(Date.now() + 15 * 60_000) : null },
          })
        );
      }
      throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password', 401);
    }

    if (user.status === 'inactive' || user.status === 'sso_only') {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Account is not active', 403);
    }

    // Step 4: Record successful login — update user + audit log atomically
    await withAuthContext(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
      });
      await tx.auditLog.create({
        data: {
          actorId: user.id, actorEmail: user.email, actorRole: user.role, tenantId: user.tenantId,
          action: user.mfaEnabled ? 'LOGIN_MFA_REQUIRED' : 'LOGIN',
          entityType: 'user', entityId: user.id, ipAddress,
        },
      });
    });

    if (user.mfaEnabled) {
      const mfaTempToken = jwt.sign(
        { sub: user.id, type: 'mfa_temp' },
        process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret',
        { expiresIn: '5m' },
      );
      return { mfaRequired: true, mfaTempToken };
    }

    const accessToken  = issueAccessToken(user);
    const refreshToken = await issueRefreshToken(user.id);
    return { mfaRequired: false, accessToken, refreshToken, user: toUserDTO(user) };
  }

  async register(email: string, password: string, firstName: string, lastName: string, tenantSlug?: string, ipAddress?: string) {
    const normalizedEmail = (email ?? '').toLowerCase().trim();

    // Determine tenant context
    let tenantId: string | null = null;
    if (tenantSlug) {
      const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
      if (!tenant) throw new AppError(ErrorCodes.NOT_FOUND, 'Tenant not found', 404);
      if (tenant.status !== 'active') throw new AppError(ErrorCodes.FORBIDDEN, 'Tenant is not active', 403);
      tenantId = tenant.id;
    }

    // Check if user already exists
    const existing = await withAuthContext((tx) =>
      tx.user.findFirst({ where: { email: normalizedEmail, deletedAt: null } })
    );
    if (existing) {
      throw new AppError(ErrorCodes.ALREADY_EXISTS, 'User with this email already exists', 409);
    }

    const passwordHash = await hashPassword(password);

    // Create user with RLS bypass
    const user = await withAuthContext(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          tenantId,
          email: normalizedEmail,
          passwordHash,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role: tenantId ? 'student' : 'tenant_admin', // Default role based on context
          status: 'active',
          emailVerified: true,
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorId: newUser.id,
          actorEmail: newUser.email,
          actorRole: newUser.role,
          tenantId: newUser.tenantId,
          action: 'USER_REGISTERED',
          entityType: 'user',
          entityId: newUser.id,
          ipAddress: ipAddress ?? 'unknown',
          afterState: { email: newUser.email, role: newUser.role, tenantId: newUser.tenantId },
        },
      });

      return newUser;
    });

    const accessToken  = issueAccessToken(user);
    const refreshToken = await issueRefreshToken(user.id);
    return { accessToken, refreshToken, user: toUserDTO(user) };
  }

  async verifyMFA(mfaTempToken: string, totpCode: string) {
    let payload: { sub: string; type: string };
    try {
      payload = jwt.verify(mfaTempToken, process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret') as any;
    } catch {
      throw new AppError(ErrorCodes.TOKEN_INVALID, 'Invalid or expired MFA token', 401);
    }
    if (payload.type !== 'mfa_temp') {
      throw new AppError(ErrorCodes.TOKEN_INVALID, 'Invalid token type', 401);
    }

    const user = await withAuthContext((tx) => tx.user.findUniqueOrThrow({ where: { id: payload.sub } }));
    if (!user.mfaSecret) throw new AppError(ErrorCodes.MFA_INVALID, 'MFA not configured', 422);

    const decrypted = decryptSecret(user.mfaSecret);
    const valid     = speakeasy.totp.verify({ secret: decrypted, encoding: 'base32', token: totpCode, window: 1 });
    if (!valid) throw new AppError(ErrorCodes.MFA_INVALID, 'Invalid TOTP code', 401);

    const accessToken  = issueAccessToken(user);
    const refreshToken = await issueRefreshToken(user.id);
    return { accessToken, refreshToken, user: toUserDTO(user) };
  }

  async refresh(incomingRefreshToken: string) {
    let payload: { sub: string; jti: string };
    try {
      payload = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret') as any;
    } catch {
      throw new AppError(ErrorCodes.TOKEN_INVALID, 'Invalid refresh token', 401);
    }

    const storedUserId = await redis.get(`refresh:${payload.jti}`);
    if (!storedUserId) throw new AppError(ErrorCodes.TOKEN_INVALID, 'Refresh token revoked or expired', 401);

    await redis.del(`refresh:${payload.jti}`);

    const user = await withAuthContext((tx) =>
      tx.user.findFirst({ where: { id: payload.sub, deletedAt: null } })
    );
    if (!user || user.status !== 'active') throw new AppError(ErrorCodes.FORBIDDEN, 'User not active', 403);

    const accessToken  = issueAccessToken(user);
    const refreshToken = await issueRefreshToken(user.id);
    return { accessToken, refreshToken };
  }

  async logout(refreshToken: string) {
    try {
      const payload = jwt.decode(refreshToken) as { jti?: string };
      if (payload?.jti) await redis.del(`refresh:${payload.jti}`);
    } catch {
      // Best-effort logout — ignore decode errors
    }
  }

  async setupMFA(userId: string) {
    const user = await withAuthContext((tx) => tx.user.findUniqueOrThrow({ where: { id: userId } }));
    const generated = speakeasy.generateSecret({
      name:   `CyberApex LMS (${user.email})`,
      issuer: 'CyberApex LMS',
    });

    const encrypted = encryptSecret(generated.base32);
    await withAuthContext((tx) => tx.user.update({ where: { id: userId }, data: { mfaSecret: encrypted } }));

    return { otpauthUrl: generated.otpauth_url, secret: generated.base32 };
  }

  async confirmMFA(userId: string, totpCode: string) {
    const user = await withAuthContext((tx) => tx.user.findUniqueOrThrow({ where: { id: userId } }));
    if (!user.mfaSecret) throw new AppError(ErrorCodes.MFA_INVALID, 'MFA not set up', 422);

    const secret = decryptSecret(user.mfaSecret);
    const valid  = speakeasy.totp.verify({ secret, encoding: 'base32', token: totpCode, window: 1 });
    if (!valid) throw new AppError(ErrorCodes.MFA_INVALID, 'Invalid code', 401);

    await withAuthContext((tx) => tx.user.update({ where: { id: userId }, data: { mfaEnabled: true } }));
    return { mfaEnabled: true };
  }

  async requestPasswordReset(email: string) {
    const user = await withAuthContext((tx) =>
      tx.user.findFirst({ where: { email, deletedAt: null } })
    );
    if (!user) return; // Silent — don't reveal whether email exists

    const rawToken  = randomUUID();
    const tokenHash = require('crypto').createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3600_000);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    const resetUrl = `${process.env.FRONTEND_URL ?? ''}/reset-password?token=${rawToken}`;
    logger.info({ email, resetUrl }, 'Password reset requested');
    return { resetUrl };
  }

  async resetPassword(rawToken: string, newPassword: string) {
    const tokenHash = require('crypto').createHash('sha256').update(rawToken).digest('hex');
    const record    = await prisma.passwordResetToken.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!record) throw new AppError(ErrorCodes.TOKEN_INVALID, 'Invalid or expired reset token', 401);

    const newHash = await hashPassword(newPassword);
    await withAuthContext(async (tx) => {
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash: newHash, passwordChangedAt: new Date() },
      });
    });
    await prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });

    const keys = await redis.keys(`refresh:*`);
    for (const key of keys) {
      const uid = await redis.get(key);
      if (uid === record.userId) await redis.del(key);
    }
  }

  verifyAccessToken(token: string): RequestUser {
    try {
      const payload = jwt.verify(token, getPublicKey(), { algorithms: ['RS256'] }) as any;
      return { id: payload.sub, email: payload.email, role: payload.role, tenantId: payload.tenantId };
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError(ErrorCodes.TOKEN_EXPIRED, 'Token has expired', 401);
      }
      throw new AppError(ErrorCodes.TOKEN_INVALID, 'Invalid token', 401);
    }
  }
}

function toUserDTO(user: any) {
  return {
    id:        user.id,
    email:     user.email,
    firstName: user.firstName,
    lastName:  user.lastName,
    role:      user.role,
    tenantId:  user.tenantId,
  };
}

export const authService = new AuthService();
