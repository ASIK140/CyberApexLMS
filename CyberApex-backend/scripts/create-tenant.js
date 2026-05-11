const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  const ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  };
  
  // Need to load dotenv here to get the pepper
  require('dotenv').config();
  
  const peppered = 'TenantAdmin123!' + (process.env.ARGON2_PEPPER || '');
  const passwordHash = await argon2.hash(peppered, ARGON2_OPTIONS);

  const tenant = await prisma.tenant.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp-' + Date.now(),
      domain: 'acme.com',
      status: 'active',
      maxUsers: 100,
    }
  });

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@acme.com',
      passwordHash: passwordHash,
      firstName: 'Alice',
      lastName: 'Admin',
      role: 'tenant_admin',
      status: 'active',
    }
  });

  console.log('Tenant created:', tenant.id);
  console.log('Tenant Admin created:', admin.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());