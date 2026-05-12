'use strict';
const { logger } = require('../config/logger');
const { calculateUserRisk, processRiskCalculationJob } = require('../services/riskEngine');

// ──────────────────────────────────────────────────────────────────────────────
// CISO BullMQ Job Definitions
// ──────────────────────────────────────────────────────────────────────────────

let riskQueue, reportQueue, evidenceQueue, notificationQueue;
let riskWorker, reportWorker, evidenceWorker, notificationWorker;

const initCISOJobs = (queues, workers) => {
    try {
        const IORedis = require('ioredis');
        const { Queue, Worker } = require('bullmq');

        const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: null,
            enableReadyCheck: false,
            lazyConnect: true,
        });

        // ── Queues ──
        riskQueue        = new Queue('ciso:risk-calculation',  { connection });
        reportQueue      = new Queue('ciso:report-generation', { connection });
        evidenceQueue    = new Queue('ciso:evidence-pack',     { connection });
        notificationQueue = new Queue('ciso:notifications',   { connection });

        // ── Risk Calculation Worker ──
        riskWorker = new Worker('ciso:risk-calculation', async (job) => {
            return await processRiskCalculationJob(job);
        }, { connection, concurrency: 5 });

        riskWorker.on('completed', (job) => logger.info(`✅ Risk job ${job.id} completed`));
        riskWorker.on('failed', (job, err) => logger.error(`❌ Risk job ${job?.id} failed: ${err.message}`));

        // ── Board Report Worker ──
        reportWorker = new Worker('ciso:report-generation', async (job) => {
            const { tenant_id, report_type, export_id } = job.data;
            logger.info(`📄 Generating ${report_type} report for tenant ${tenant_id} (export: ${export_id})`);
            // Production: use pdfkit to build PDF, upload to S3, update exports table
            await new Promise(r => setTimeout(r, 1000)); // simulate processing
            return { success: true, export_id, status: 'completed' };
        }, { connection });

        reportWorker.on('completed', (job) => logger.info(`✅ Report job ${job.id} done`));
        reportWorker.on('failed', (job, err) => logger.error(`❌ Report job ${job?.id} failed: ${err.message}`));

        // ── Evidence Pack Worker ──
        evidenceWorker = new Worker('ciso:evidence-pack', async (job) => {
            const { tenant_id, export_id, includes } = job.data;
            logger.info(`📦 Building evidence pack for tenant ${tenant_id} (export: ${export_id})`);
            // Production: gather training logs, certs, exam results, phishing reports → ZIP → S3
            await new Promise(r => setTimeout(r, 2000));
            return { success: true, export_id, status: 'completed', zip_url: `https://s3.cyberapex.io/${tenant_id}/evidence/${export_id}.zip` };
        }, { connection });

        evidenceWorker.on('completed', (job) => logger.info(`✅ Evidence pack job ${job.id} done`));

        // ── Notification Worker ──
        notificationWorker = new Worker('ciso:notifications', async (job) => {
            const { type, tenant_id, recipient, data } = job.data;
            logger.info(`📧 Sending notification [${type}] to ${recipient} for tenant ${tenant_id}`);

            const templates = {
                overdue_training:      `⚠️ Training overdue: ${data?.course_name || 'Course'}`,
                high_risk_alert:       `🚨 High-risk user detected: ${data?.user_name}`,
                expiring_cert:         `📜 Certificate expiring soon: ${data?.cert_name}`,
                compliance_gap:        `🔴 Compliance gap detected in ${data?.framework}`,
                campaign_complete:     `✅ Phishing campaign completed: ${data?.campaign_name}`,
            };

            const subject = templates[type] || `CyberApex LMS Alert: ${type}`;
            logger.info(`Email Subject: ${subject}`);
            // Production: call nodemailer / SendGrid here
            return { success: true, type, recipient, subject };
        }, { connection });

        notificationWorker.on('completed', (job) => logger.info(`✅ Notification job ${job.id} sent`));
        notificationWorker.on('failed', (job, err) => logger.error(`❌ Notification job failed: ${err.message}`));

        logger.info('✅ CISO BullMQ workers initialized (risk, report, evidence, notifications)');

        return { riskQueue, reportQueue, evidenceQueue, notificationQueue };

    } catch (err) {
        logger.warn(`⚠️ CISO BullMQ init skipped (Redis unavailable): ${err.message}`);

        // Return mock queue objects that log instead of queuing
        const mockQueue = (name) => ({
            add: async (jobName, data) => {
                logger.info(`[MOCK QUEUE] ${name} → ${jobName}: ${JSON.stringify(data).slice(0, 100)}`);
                return { id: `mock-${Date.now()}` };
            },
        });

        return {
            riskQueue:         mockQueue('ciso:risk-calculation'),
            reportQueue:       mockQueue('ciso:report-generation'),
            evidenceQueue:     mockQueue('ciso:evidence-pack'),
            notificationQueue: mockQueue('ciso:notifications'),
        };
    }
};

/**
 * Schedule recurring risk calculation for all tenants.
 * In production: use a cron-like scheduler (agenda, node-cron) to run every 6 hours.
 */
const scheduleRiskRecalculation = async (riskQueue, tenantIds = ['tenant_001']) => {
    for (const tenant_id of tenantIds) {
        await riskQueue.add('calculate-risk', { tenant_id }, {
            repeat: { every: 6 * 60 * 60 * 1000 }, // every 6 hours
            removeOnComplete: 10,
            removeOnFail: 5,
        }).catch(err => logger.warn(`Could not schedule risk job: ${err.message}`));
    }
};

module.exports = { initCISOJobs, scheduleRiskRecalculation };
