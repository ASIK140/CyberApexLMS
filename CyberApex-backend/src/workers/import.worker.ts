import { Worker, Job } from 'bullmq';
import { bullmqConnection } from '../lib/bullmq-connection';
import { prisma } from '../lib/prisma';
import { BulkImportJob, addAutoEnrollJob } from '../queues';
import { logger } from '../lib/logger';
import { downloadFromS3 } from '../lib/s3';
import csv from 'csv-parser';
import { hashPassword } from '../lib/crypto';
import { randomBytes } from 'crypto';

export const importWorker = new Worker<BulkImportJob>(
  'bulk-import',
  async (job: Job<BulkImportJob>) => {
    const { tenantId, inputKey, requestedBy } = job.data;
    logger.info({ jobId: job.id, tenantId }, 'Bulk import started');

    const users: any[] = [];
    const stream = await downloadFromS3(inputKey);

    return new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => users.push(data))
        .on('end', async () => {
          try {
            let successCount = 0;
            let failureCount = 0;

            for (const userData of users) {
              try {
                // Expected CSV headers: email, first_name, last_name, role, department
                const email = userData.email?.toLowerCase().trim();
                if (!email) continue;

                // Check if user already exists
                const existing = await prisma.user.findUnique({ where: { email } });
                if (existing) {
                  failureCount++;
                  continue;
                }

                const tempPassword = randomBytes(8).toString('hex');
                const passwordHash = await hashPassword(tempPassword);

                const newUser = await prisma.user.create({
                  data: {
                    tenantId,
                    email,
                    firstName: userData.first_name || 'User',
                    lastName: userData.last_name || '',
                    role: (userData.role || 'student') as any,
                    department: userData.department || null,
                    passwordHash,
                    status: 'active',
                  },
                });

                // Trigger auto-enrollment
                await addAutoEnrollJob({ triggerType: 'T2', tenantId, userId: newUser.id });
                
                successCount++;
              } catch (err: any) {
                failureCount++;
                logger.error({ err: err.message, userData }, 'Failed to import user');
              }
            }

            await prisma.auditLog.create({
              data: {
                actorId: requestedBy,
                actorEmail: 'system',
                actorRole: 'admin',
                tenantId,
                action: 'BULK_IMPORT_COMPLETED',
                entityType: 'tenant',
                entityId: tenantId,
                afterState: { successCount, failureCount, total: users.length },
              },
            });

            logger.info({ tenantId, successCount, failureCount }, 'Bulk import completed');
            resolve({ successCount, failureCount });
          } catch (err) {
            reject(err);
          }
        })
        .on('error', (err) => reject(err));
    });
  },
  { connection: bullmqConnection, concurrency: 1, skipVersionCheck: true }
);

importWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Import worker job failed');
});
