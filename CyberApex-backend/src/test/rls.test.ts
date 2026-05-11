import request from 'supertest';
import app from '../index';
import { createTenant, createTenantAdmin, createStudent, loginAndGetToken } from './factories';
import { prisma } from '../lib/prisma';
import './setup'; // Run setup/teardown

describe('Row-Level Security (RLS) & Multi-Tenancy', () => {
  it('tenant admin cannot access another tenants users', async () => {
    // 1. Create two separate tenants
    const tenantA = await createTenant({ name: 'Tenant A', slug: `tenant-a-${Date.now()}` });
    const tenantB = await createTenant({ name: 'Tenant B', slug: `tenant-b-${Date.now()}` });

    // 2. Create users in each tenant
    const adminA = await createTenantAdmin(tenantA.id);
    const studentB = await createStudent(tenantB.id);

    // 3. Login as Admin A
    const tokenA = loginAndGetToken(adminA);

    // 4. Try to access Tenant B's users directly
    const response1 = await request(app)
      .get(`/api/v1/tenants/${tenantB.id}/users`)
      .set('Authorization', `Bearer ${tokenA}`);

    // Application level check (Cross-tenant access denied)
    expect(response1.status).toBe(403);
    
    // 5. Raw DB level check via base repository logic mimicking what a service might do
    // To prove RLS works, let's execute a direct raw query setting RLS context as adminA
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL app.current_tenant_id = ${tenantA.id}::uuid`;
      await tx.$executeRaw`SET LOCAL app.current_role = 'tenant_admin'`;

      // Try to find studentB
      const users = await tx.$queryRaw`SELECT * FROM users WHERE email = ${studentB.email}`;
      expect((users as any[]).length).toBe(0); // RLS prevents visibility

      // Try to find adminA
      const usersA = await tx.$queryRaw`SELECT * FROM users WHERE email = ${adminA.email}`;
      expect((usersA as any[]).length).toBe(1); // RLS allows visibility
    });
  });
});
