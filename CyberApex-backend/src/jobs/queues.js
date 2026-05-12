'use strict';
const { Queue } = require('bullmq');
const { logger } = require('../config/logger');

let redisConnection = null;
let queues = {};

try {
    const Redis = require('ioredis');
    const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
    
    redisConnection = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
    });

    redisConnection.on('error', () => {
        logger.warn('⚠️  Redis not connected — background jobs disabled');
    });

    const connection = redisConnection;

    queues.emailQueue   = new Queue('email',   { connection });
    queues.reportQueue  = new Queue('reports', { connection });
    queues.exportQueue  = new Queue('exports', { connection });

    logger.info('✅ BullMQ queues initialized');
} catch (err) {
    logger.warn(`⚠️  BullMQ setup skipped: ${err.message}`);
}

/**
 * Add an email job to the queue (with fallback for no Redis)
 */
const addEmailJob = async (payload) => {
    if (queues.emailQueue) {
        return queues.emailQueue.add('send-email', payload, { attempts: 3, backoff: { type: 'exponential', delay: 2000 } });
    }
    logger.warn('Email job queued without Redis — would send:', payload.subject);
};

/**
 * Add a report generation job
 */
const addReportJob = async (payload) => {
    if (queues.reportQueue) {
        return queues.reportQueue.add('generate-report', payload, { attempts: 2 });
    }
    logger.warn('Report job queued without Redis:', payload.type);
};

module.exports = { queues, redisConnection, addEmailJob, addReportJob };
