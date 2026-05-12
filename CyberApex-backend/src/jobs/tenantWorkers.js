'use strict';
const { logger } = require('../config/logger');

// ── Tenant Admin BullMQ Workers ───────────────────────────────────────────────

const initTenantAdminJobs = () => {
    try {
        const IORedis = require('ioredis');
        const { Queue, Worker } = require('bullmq');

        const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            lazyConnect: true,
        });

        // ── Queues ──────────────────────────────────────────────────
        const importQueue     = new Queue('tenant:user-import',    { connection });
        const reminderQueue   = new Queue('tenant:reminder-email', { connection });
        const reportQueue     = new Queue('tenant:report-gen',     { connection });
        const certQueue       = new Queue('tenant:cert-gen',       { connection });
        const welcomeQueue    = new Queue('tenant:welcome-email',  { connection });

        // ── 1. CSV User Import Worker ────────────────────────────────
        const importWorker = new Worker('tenant:user-import', async (job) => {
            const { tenant_id, job_id, file_url, imported_by } = job.data;
            logger.info(`📤 [Import] Processing ${job_id} for tenant ${tenant_id}`);

            // Production:
            // 1. Download CSV from S3 (file_url)
            // 2. Parse with csv-parse
            // 3. Validate each row (email format, role enum, dept exists)
            // 4. Batch INSERT valid users to DB
            // 5. Queue welcome email for each new user
            // 6. Update UserImportJob status + stats

            const mockResults = { total: 25, successful: 23, failed: 2, errors: ['Row 14: duplicate email', 'Row 19: invalid role'] };
            logger.info(`✅ [Import] ${job_id} done — ${mockResults.successful}/${mockResults.total} users imported`);
            return { success: true, job_id, ...mockResults };
        }, { connection, concurrency: 3 });

        importWorker.on('completed', (job) => logger.info(`✅ Import job ${job.id} completed`));
        importWorker.on('failed',    (job, err) => logger.error(`❌ Import job ${job?.id} failed: ${err.message}`));

        // ── 2. Training Reminder Email Worker ───────────────────────
        const reminderWorker = new Worker('tenant:reminder-email', async (job) => {
            const { tenant_id, type, recipient_email, recipient_name, data } = job.data;
            logger.info(`📧 [Reminder] Sending ${type} to ${recipient_email}`);

            const templates = {
                training_reminder: `Hi ${recipient_name}, your course "${data?.course_name}" is due on ${data?.due_date}. Please complete it soon.`,
                overdue_training:  `Hi ${recipient_name}, you have overdue training: "${data?.course_name}". Please complete immediately.`,
                cert_expiry:       `Hi ${recipient_name}, your certificate for "${data?.cert_name}" expires on ${data?.expiry_date}.`,
                welcome:           `Welcome to CyberApex LMS, ${recipient_name}! Your account is ready.`,
            };

            const body = templates[type] || `CyberApex LMS notification for ${recipient_name}`;
            logger.info(`📬 [Email] Subject: CyberApex LMS — ${type} | To: ${recipient_email}`);
            // Production: call nodemailer / SendGrid with `body`
            return { success: true, type, recipient: recipient_email };
        }, { connection, concurrency: 10 });

        reminderWorker.on('completed', (job) => logger.info(`✅ Reminder job ${job.id} sent`));
        reminderWorker.on('failed',    (job, err) => logger.warn(`⚠️ Reminder job failed: ${err.message}`));

        // ── 3. Welcome Email Worker ─────────────────────────────────
        const welcomeWorker = new Worker('tenant:welcome-email', async (job) => {
            const { tenant_id, user_name, user_email, temp_password } = job.data;
            logger.info(`👋 [Welcome] Sending onboarding email to ${user_email}`);
            // Production: send branded welcome email with login URL + temp password
            return { success: true, recipient: user_email };
        }, { connection });

        welcomeWorker.on('completed', (job) => logger.info(`✅ Welcome email ${job.id} sent`));

        // ── 4. Report Generation Worker ─────────────────────────────
        const reportWorker = new Worker('tenant:report-gen', async (job) => {
            const { tenant_id, report_type, export_id, requested_by } = job.data;
            logger.info(`📊 [Report] Generating ${report_type} for tenant ${tenant_id} (${export_id})`);
            await new Promise(r => setTimeout(r, 1500)); // simulate PDF generation
            // Production: use pdfkit or puppeteer, upload to S3, update exports table
            return { success: true, export_id, status: 'completed', pdf_url: `https://s3.cyberapex.io/${tenant_id}/reports/${export_id}.pdf` };
        }, { connection });

        reportWorker.on('completed', (job) => logger.info(`✅ Report ${job.id} done`));
        reportWorker.on('failed',    (job, err) => logger.error(`❌ Report ${job?.id} failed: ${err.message}`));

        // ── 5. Certificate Generation Worker ────────────────────────
        const certWorker = new Worker('tenant:cert-gen', async (job) => {
            const { tenant_id, user_id, user_name, course_name, score, cert_id } = job.data;
            logger.info(`🏆 [Cert] Generating certificate ${cert_id} for ${user_name}`);
            await new Promise(r => setTimeout(r, 800));
            // Production: use pdfkit to generate cert PDF, upload to S3, save to certificates table
            return { success: true, cert_id, pdf_url: `https://s3.cyberapex.io/${tenant_id}/certs/${cert_id}.pdf` };
        }, { connection });

        certWorker.on('completed', (job) => logger.info(`✅ Cert ${job.id} generated`));
        certWorker.on('failed',    (job, err) => logger.warn(`⚠️ Cert job failed: ${err.message}`));

        logger.info('✅ Tenant Admin BullMQ workers initialized (import, reminders, welcome, reports, certs)');

        return { importQueue, reminderQueue, reportQueue, certQueue, welcomeQueue };

    } catch (err) {
        logger.warn(`⚠️ Tenant Admin workers init skipped (Redis unavailable): ${err.message}`);

        const mockQueue = (name) => ({
            add: async (jobName, data) => {
                logger.info(`[MOCK QUEUE] ${name} → ${jobName}: ${JSON.stringify(data).slice(0, 80)}`);
                return { id: `mock-${Date.now()}` };
            },
        });

        return {
            importQueue:   mockQueue('tenant:user-import'),
            reminderQueue: mockQueue('tenant:reminder-email'),
            reportQueue:   mockQueue('tenant:report-gen'),
            certQueue:     mockQueue('tenant:cert-gen'),
            welcomeQueue:  mockQueue('tenant:welcome-email'),
        };
    }
};

module.exports = { initTenantAdminJobs };
