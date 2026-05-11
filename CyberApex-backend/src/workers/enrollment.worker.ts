import { Worker, Job } from 'bullmq';
import { bullmqConnection } from '../lib/bullmq-connection';
import { prisma } from '../lib/prisma';
import { addEmailJob, AutoEnrollJob } from '../queues';
import { logger } from '../lib/logger';

export const enrollmentWorker = new Worker<AutoEnrollJob>(
  'auto-enrollment',
  async (job: Job<AutoEnrollJob>) => {
    const { triggerType, tenantId, complianceId, userId, courseId } = job.data;
    logger.info({ jobId: job.id, triggerType }, 'Auto-enrollment job started');

    let userIds: string[] = [];
    let courseIds: string[] = [];
    let resolvedTenantId: string | undefined = tenantId;

    // ── Resolve users + courses based on trigger type ─────────────────────────
    if (triggerType === 'T1' && tenantId && complianceId) {
      // Tenant assigned compliance → enroll all tenant users in all compliance courses
      courseIds = await getPublishedCourseIdsForCompliance(complianceId);
      userIds   = await getActiveUserIdsForTenant(tenantId);

    } else if (triggerType === 'T2' && userId && tenantId) {
      // New user added → enroll in all courses for all active tenant compliances
      const complianceIds = await getComplianceIdsForTenant(tenantId);
      courseIds = await getPublishedCourseIdsForCompliances(complianceIds);
      userIds   = [userId];

    } else if ((triggerType === 'T3' || triggerType === 'T4') && courseId && complianceId) {
      // Course published / added to compliance → enroll users of all tenants with this compliance
      const tenantIds = await getTenantIdsForCompliance(complianceId);
      for (const tid of tenantIds) {
        userIds.push(...(await getActiveUserIdsForTenant(tid)));
      }
      courseIds = [courseId];
      resolvedTenantId = undefined;
    }

    if (userIds.length === 0 || courseIds.length === 0) {
      logger.info({ jobId: job.id }, 'Auto-enrollment: nothing to enroll, skipping');
      return { enrolled: 0 };
    }

    // ── Resolve due-date days ─────────────────────────────────────────────────
    const dueDateDays =
      tenantId && complianceId ? await getDueDateDays(tenantId, complianceId) : 30;

    const now     = new Date();
    const dueDate = new Date(now.getTime() + dueDateDays * 86_400_000);

    // ── Bulk idempotent insert ────────────────────────────────────────────────
    const enrollmentData = userIds.flatMap((uid) =>
      courseIds.map((cid) => ({
        userId:         uid,
        courseId:       cid,
        tenantId:       resolvedTenantId ?? null,
        enrollmentType: 'auto_compliance' as const,
        dueDate,
      })),
    );

    const result = await prisma.enrollment.createMany({
      data: enrollmentData,
      skipDuplicates: true,
    });

    logger.info({ jobId: job.id, enrolled: result.count }, 'Auto-enrollment complete');

    // ── Queue welcome emails for new enrollments ──────────────────────────────
    const cutoff = new Date(now.getTime() - 15_000);
    const newEnrollments = await prisma.enrollment.findMany({
      where: {
        userId:     { in: userIds },
        courseId:   { in: courseIds },
        enrolledAt: { gte: cutoff },
      },
      select: { id: true, userId: true },
    });

    await Promise.allSettled(
      newEnrollments.map((e) =>
        addEmailJob({ templateName: 'enrollment-welcome', userId: e.userId, enrollmentId: e.id }, 5000),
      ),
    );

    // ── Audit log ─────────────────────────────────────────────────────────────
    await prisma.auditLog.create({
      data: {
        actorEmail: 'system',
        actorRole:  'super_admin',
        tenantId:   resolvedTenantId ?? null,
        action:     'AUTO_ENROLLED',
        entityType: 'enrollment',
        afterState: { count: result.count, triggerType, userCount: userIds.length, courseCount: courseIds.length },
      },
    });

    return { enrolled: result.count };
  },
  { connection: bullmqConnection, concurrency: 3, skipVersionCheck: true },
);

enrollmentWorker.on('failed', (job, err) =>
  logger.error({ jobId: job?.id, err }, 'Enrollment worker job failed'),
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getPublishedCourseIdsForCompliance(complianceId: string): Promise<string[]> {
  const rows = await prisma.courseComplianceMapping.findMany({
    where: { complianceId, isMandatory: true, course: { status: 'published', deletedAt: null } },
    select: { courseId: true },
  });
  return rows.map((r) => r.courseId);
}

async function getActiveUserIdsForTenant(tenantId: string): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { tenantId, status: 'active', deletedAt: null },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

async function getComplianceIdsForTenant(tenantId: string): Promise<string[]> {
  const rows = await prisma.tenantComplianceMapping.findMany({
    where: { tenantId },
    select: { complianceId: true },
  });
  return rows.map((r) => r.complianceId);
}

async function getPublishedCourseIdsForCompliances(complianceIds: string[]): Promise<string[]> {
  if (complianceIds.length === 0) return [];
  const rows = await prisma.courseComplianceMapping.findMany({
    where: { complianceId: { in: complianceIds }, isMandatory: true, course: { status: 'published' } },
    select: { courseId: true },
  });
  return Array.from(new Set(rows.map((r: { courseId: string }) => r.courseId)));
}

async function getTenantIdsForCompliance(complianceId: string): Promise<string[]> {
  const rows = await prisma.tenantComplianceMapping.findMany({
    where: { complianceId, tenant: { status: 'active' } },
    select: { tenantId: true },
  });
  return rows.map((r) => r.tenantId);
}

async function getDueDateDays(tenantId: string, complianceId: string): Promise<number> {
  const mapping = await prisma.tenantComplianceMapping.findUnique({
    where: { tenantId_complianceId: { tenantId, complianceId } },
    select: { dueDateDays: true },
  });
  return mapping?.dueDateDays ?? 30;
}
