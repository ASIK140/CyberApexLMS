import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/crypto';
import jwt from 'jsonwebtoken';

export async function createTenant(overrides = {}) {
  return prisma.tenant.create({
    data: {
      name: 'Test Corp ' + Date.now(),
      slug: `test-corp-${Date.now()}`,
      status: 'active',
      maxUsers: -1,
      subscriptionPlan: 'professional',
      ...overrides,
    },
  });
}

export async function createSuperAdmin(overrides = {}) {
  return prisma.user.create({
    data: {
      email: `super-${Date.now()}@test.com`,
      passwordHash: await hashPassword('Test1234!'),
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super_admin',
      status: 'active',
      ...overrides,
    },
  });
}

export async function createTenantAdmin(tenantId: string, overrides = {}) {
  return prisma.user.create({
    data: {
      email: `admin-${Date.now()}@test.com`,
      passwordHash: await hashPassword('Test1234!'),
      firstName: 'Tenant',
      lastName: 'Admin',
      role: 'tenant_admin',
      status: 'active',
      tenantId,
      ...overrides,
    },
  });
}

export async function createStudent(tenantId: string, overrides = {}) {
  return prisma.user.create({
    data: {
      email: `student-${Date.now()}@test.com`,
      passwordHash: await hashPassword('Test1234!'),
      firstName: 'Test',
      lastName: 'Student',
      role: 'student',
      status: 'active',
      tenantId,
      ...overrides,
    },
  });
}

export function loginAndGetToken(user: any) {
  const privateKey = (process.env.JWT_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  return jwt.sign(
    { email: user.email, role: user.role, tenantId: user.tenantId },
    privateKey,
    { algorithm: 'RS256', expiresIn: '15m', subject: user.id }
  );
}
