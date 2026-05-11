import { sendEmail } from './email.service';

export enum NotificationChannel {
    IN_APP = 'IN_APP',
    EMAIL = 'EMAIL',
    BOTH = 'BOTH'
}

interface NotificationPayload {
    userId: string;
    tenantId: string;
    role: string;
    message: string;
    channel: NotificationChannel;
    emailAddress?: string;
}

/**
 * Service to dispatch role-aware notifications
 */
export const dispatchNotification = async (payload: NotificationPayload) => {
    // 1. Save In-App Notification if requested
    if (payload.channel === NotificationChannel.IN_APP || payload.channel === NotificationChannel.BOTH) {
        // e.g. await prisma.notification.create({ ... })
        console.log(`Saved In-App notification for User ${payload.userId} [${payload.role}]`);
    }

    // 2. Dispatch Email if requested
    if ((payload.channel === NotificationChannel.EMAIL || payload.channel === NotificationChannel.BOTH) && payload.emailAddress) {
        await sendEmail({
            to: payload.emailAddress,
            subject: 'CyberApex LMS Notification',
            templateId: 'system_alert',
            variables: { message: payload.message },
            tenantId: payload.tenantId
        });
    }
};
