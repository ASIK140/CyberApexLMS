import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';

beforeEach(async () => {
  // Try truncating known tables in order. Ignore errors if a table is missing.
  try {
    await prisma.$executeRaw`
      TRUNCATE TABLE
        certificates, quiz_attempts, lesson_progress, enrollments,
        quiz_answers, quiz_questions, quizzes, lessons, modules,
        course_compliance_mappings, courses, tenant_compliance_mappings,
        audit_logs, password_reset_tokens, users, tenants,
        compliance_frameworks, certificate_templates
      RESTART IDENTITY CASCADE
    `;
  } catch (err) {
    // some tables might not be needed in smaller tests
  }
  
  if (redis.status === 'ready') {
    await redis.flushdb();
  }
});

afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});
