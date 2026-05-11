'use strict';
const { logger } = require('../config/logger');

/**
 * Email worker — in production this would use BullMQ Worker + nodemailer.
 * Currently simulates job processing with logging.
 */
const processEmailJob = async (job) => {
    const { to, subject, body, type } = job.data;
    logger.info(`📧 Processing email job [${type}] → ${to} | Subject: ${subject}`);
    // In production:
    // const transporter = nodemailer.createTransport({ host: ..., auth: {...} });
    // await transporter.sendMail({ from: 'noreply@cyberapex.io', to, subject, html: body });
    logger.info(`✅ Email sent successfully to ${to}`);
    return { success: true, to, subject, sentAt: new Date().toISOString() };
};

/**
 * Report worker — generates CSV/Excel/PDF exports
 */
const processReportJob = async (job) => {
    const { type, format, tenant_id, filters } = job.data;
    logger.info(`📊 Processing report job [${type}] format=${format} tenant=${tenant_id || 'global'}`);
    // In production: generate file, upload to S3, send download link
    return { success: true, type, format, generatedAt: new Date().toISOString(), downloadUrl: `https://s3.cyberapex.io/reports/${type}_${Date.now()}.${format}` };
};

module.exports = { processEmailJob, processReportJob };
