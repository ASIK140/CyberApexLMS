import { Queue } from 'bullmq';

// We would normally connect to the Redis instance defined in our docker-compose
const emailQueue = new Queue('emailQueue', {
    connection: {
        host: 'localhost',
        port: 6379
    }
});

interface EmailPayload {
    to: string;
    subject: string;
    templateId: string;
    variables: Record<string, string>;
    tenantId: string;
}

/**
 * Service to dispatch emails to the Redis queue for async processing.
 * Represents the baseline integration for SMTP/O365/Google Workspace setups per tenant.
 */
export const sendEmail = async (payload: EmailPayload) => {
    try {
        // Determine provider logic based on tenantId's configuration later in the worker
        await emailQueue.add('sendEmailJob', payload);
        console.log(`Queued email for ${payload.to} against Tenant ${payload.tenantId}`);
    } catch (error) {
        console.error('Failed to queue email', error);
    }
};
