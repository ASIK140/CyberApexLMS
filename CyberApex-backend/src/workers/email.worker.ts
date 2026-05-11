import { Worker } from 'bullmq';
import { bullmqConnection } from '../lib/bullmq-connection';
import { mailer } from '../lib/mailer';
import { prisma } from '../lib/prisma';
import { EmailJob } from '../queues';
import { logger } from '../lib/logger';

type TemplateFactory = (data: Record<string, unknown>) => { subject: string; html: string };

const templates: Record<string, TemplateFactory> = {
  'enrollment-welcome': (d) => ({
    subject: `You've been enrolled: ${d.courseTitle}`,
    html: `<p>Hi ${d.firstName},</p><p>You have been enrolled in <strong>${d.courseTitle}</strong>. Your deadline is <strong>${d.dueDate}</strong>.</p><a href="${d.loginUrl}">Start Learning →</a>`,
  }),
  'certificate-issued': (d) => ({
    subject: `Certificate Issued: ${d.courseTitle}`,
    html: `<p>Congratulations ${d.firstName}! You completed <strong>${d.courseTitle}</strong> and earned your certificate.</p><p>Certificate #: <strong>${d.certNumber}</strong></p><a href="${d.verifyUrl}">Verify Certificate →</a>`,
  }),
  'enrollment-reminder': (d) => ({
    subject: `Reminder: Complete ${d.courseTitle} by ${d.dueDate}`,
    html: `<p>Hi ${d.firstName}, your training <strong>${d.courseTitle}</strong> is due on ${d.dueDate}.</p><a href="${d.loginUrl}">Continue Training →</a>`,
  }),
  'overdue-alert': (d) => ({
    subject: `OVERDUE: ${d.courseTitle}`,
    html: `<p>Hi ${d.firstName}, your training <strong>${d.courseTitle}</strong> is now overdue. Please complete it immediately.</p><a href="${d.loginUrl}">Complete Now →</a>`,
  }),
  'password-reset': (d) => ({
    subject: 'Reset Your CyberApex LMS Password',
    html: `<p>Hi ${d.firstName},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p><a href="${d.resetUrl}">Reset Password →</a><p>If you didn't request this, ignore this email.</p>`,
  }),
  'invite': (d) => ({
    subject: `You've been invited to CyberApex LMS`,
    html: `<p>Hi ${d.firstName},</p><p>You have been invited to <strong>${d.orgName}</strong>'s cybersecurity training program.</p><a href="${d.inviteUrl}">Accept Invitation →</a>`,
  }),
};

export const emailWorker = new Worker<EmailJob>(
  'email',
  async (job) => {
    const { templateName, userId, enrollmentId, certificateId, data: extraData } = job.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'active') {
      return { skipped: true, reason: 'User inactive or not found' };
    }

    let templateData: Record<string, unknown> = {
      firstName: user.firstName,
      loginUrl:  `${process.env.FRONTEND_URL ?? ''}/login`,
      ...extraData,
    };

    if (enrollmentId) {
      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: { course: true },
      });
      if (enrollment) {
        templateData.courseTitle = enrollment.course.title;
        templateData.dueDate     = enrollment.dueDate?.toLocaleDateString('en-GB') ?? 'No deadline';
      }
    }

    if (certificateId) {
      const cert = await prisma.certificate.findUnique({ where: { id: certificateId }, include: { course: true } });
      if (cert) {
        templateData.certNumber  = cert.certificateNumber;
        templateData.courseTitle = cert.course.title;
        templateData.verifyUrl   = `${process.env.CERT_VERIFICATION_BASE_URL ?? ''}/verify/${cert.verificationHash}`;
        templateData.pdfUrl      = cert.pdfUrl;
      }
    }

    const factory = templates[templateName];
    if (!factory) throw new Error(`Unknown email template: ${templateName}`);

    const { subject, html } = factory(templateData);

    await mailer.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME ?? 'CyberApex LMS'}" <${process.env.EMAIL_FROM_ADDRESS ?? 'noreply@cyberapex.dev'}>`,
      to:   user.email,
      subject,
      html,
    });

    logger.info({ email: user.email, template: templateName }, 'Email sent');
    return { sent: true };
  },
  { connection: bullmqConnection, concurrency: 10, skipVersionCheck: true },
);

emailWorker.on('failed', (job, err) =>
  logger.error({ jobId: job?.id, err }, 'Email worker job failed'),
);
