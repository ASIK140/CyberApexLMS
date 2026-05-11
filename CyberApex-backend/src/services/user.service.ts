import { prisma } from '../lib/prisma';
import { UserRepository } from '../repositories/user.repository';
import { AppError, ErrorCodes } from '../lib/app-error';
import { hashPassword } from '../lib/crypto';

const userRepo = new UserRepository();
const SA_TENANT = '00000000-0000-0000-0000-000000000000';

// Input sanitization helpers
function sanitizeString(input: string | undefined, maxLength = 100): string {
  if (!input) return '';
  return input.trim().slice(0, maxLength);
}

function sanitizeEmail(input: string): string {
  return input.toLowerCase().trim();
}

async function withSAContext<T>(fn: (tx: any) => Promise<T>): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_role', 'super_admin', true)`;
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${SA_TENANT}, true)`;
    return fn(tx);
  });
}

export class UserService {
  async list(tenantId: string, params: any) {
    return userRepo.findByTenant(tenantId, params);
  }

  async getById(tenantId: string, id: string) {
    const user = await userRepo.findById(id);
    if (!user || user.tenantId !== tenantId) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'User not found', 404);
    }
    return user;
  }

  async create(tenantId: string, actor: any, data: any, ipAddress: string) {
    const passwordHash = await hashPassword(data.password);

    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(data.email);
    const sanitizedFirstName = sanitizeString(data.firstName, 100);
    const sanitizedLastName = sanitizeString(data.lastName, 100);
    const sanitizedDepartment = sanitizeString(data.department, 150);
    const sanitizedEmployeeId = data.employeeId ? sanitizeString(data.employeeId, 100).toLowerCase() : null;

    try {
      // Use transaction for atomicity - catches unique constraint violations directly
      const user = await prisma.$transaction(async (tx) => {
        // Set RLS bypass context
        await tx.$executeRaw`SELECT set_config('app.current_role', 'super_admin', true)`;
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${SA_TENANT}, true)`;

        const newUser = await tx.user.create({
          data: {
            tenantId,
            email:        sanitizedEmail,
            passwordHash,
            firstName:    sanitizedFirstName,
            lastName:     sanitizedLastName,
            role:         data.role,
            jobRoleCategory: data.jobRoleCategory || 'general',
            status:       data.status || 'active',
            emailVerified: true,
            department:   sanitizedDepartment || null,
            employeeId:   sanitizedEmployeeId,
          },
        });

        await tx.auditLog.create({
          data: {
            actorId:    actor.id,
            actorEmail: actor.email,
            actorRole:  actor.role,
            tenantId,
            action:     'USER_CREATED',
            entityType: 'user',
            entityId:   newUser.id,
            afterState: { email: newUser.email, role: newUser.role },
            ipAddress,
          },
        });

        return newUser;
      });

      return user;
    } catch (err: any) {
      // Handle unique constraint violation (P2002 in Prisma)
      if (err.code === 'P2002') {
        throw new AppError(ErrorCodes.ALREADY_EXISTS, 'User with this email already exists', 409);
      }
      throw err;
    }
  }
}

export const userService = new UserService();
