
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('Successfully connected to the database');
    const tenantCount = await prisma.tenant.count();
    console.log(`Number of tenants in DB: ${tenantCount}`);
  } catch (e) {
    console.error('Failed to connect to the database:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
