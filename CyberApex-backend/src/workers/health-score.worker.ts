import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';

// Runs daily at 02:00 UTC
export function startHealthScoreCron() {
  cron.schedule('0 2 * * *', async () => {
    logger.info('Health score cron started');

    const tenants = await prisma.tenant.findMany({
      where: { status: 'active', deletedAt: null },
      select: { id: true },
    });

    for (const tenant of tenants) {
      try {
        const stats = await prisma.$queryRaw<
          [{ total: bigint; completed: bigint; overdue: bigint; certified: bigint }]
        >`
          SELECT
            COUNT(DISTINCT e.id)                                                          AS total,
            COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'completed')                   AS completed,
            COUNT(DISTINCT e.id) FILTER (
              WHERE e.due_date < NOW() AND e.status NOT IN ('completed', 'failed')
            )                                                                             AS overdue,
            COUNT(DISTINCT c.id)                                                          AS certified
          FROM enrollments e
          LEFT JOIN certificates c ON c.enrollment_id = e.id
          WHERE e.tenant_id = ${tenant.id}::uuid
        `;

        const { total, completed, overdue, certified } = stats[0];
        const completionRate = Number(total) > 0 ? (Number(completed) / Number(total)) * 100 : 100;
        const overdueRate    = Number(total) > 0 ? (Number(overdue)   / Number(total)) * 100 : 0;
        const healthScore    = Math.max(0, Math.round(completionRate - overdueRate * 0.5));

        await redis.setex(
          `health:${tenant.id}`,
          25 * 3600,
          JSON.stringify({
            healthScore,
            completionRate: Math.round(completionRate),
            overdue:        Number(overdue),
            certified:      Number(certified),
            calculatedAt:   new Date().toISOString(),
          }),
        );
      } catch (err) {
        logger.error({ tenantId: tenant.id, err }, 'Health score calculation failed for tenant');
      }
    }

    logger.info({ count: tenants.length }, 'Daily health scores calculated');
  });
}
