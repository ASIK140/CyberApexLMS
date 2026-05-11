import { Worker, Job } from 'bullmq';
import { bullmqConnection } from '../lib/bullmq-connection';
import { prisma } from '../lib/prisma';
import { uploadToS3 } from '../lib/s3';
import { generateVerificationHash } from '../lib/crypto';
import { addEmailJob, CertJob } from '../queues';
import { logger } from '../lib/logger';
import axios from 'axios';

export const certWorker = new Worker<CertJob>(
  'certificate',
  async (job: Job<CertJob>) => {
    const { enrollmentId } = job.data;

    // 1. Fetch all data needed
    const enrollment = await prisma.enrollment.findUniqueOrThrow({
      where: { id: enrollmentId },
      include: {
        user:   true,
        course: { include: { template: true } },
        tenant: true,
        quizAttempts: {
          where: { status: 'submitted', passed: true },
          orderBy: { submittedAt: 'desc' },
          take: 1,
        },
      },
    });

    // Idempotency guard — cert may already exist
    const existing = await prisma.certificate.findUnique({ where: { enrollmentId } });
    if (existing) {
      logger.info({ enrollmentId, certId: existing.id }, 'Certificate already exists, skipping');
      return { certificateId: existing.id, certNumber: existing.certificateNumber };
    }

    // 2. Get certificate template
    const template =
      enrollment.course.template ??
      (await prisma.certificateTemplate.findFirst({ where: { isDefault: true } }));
    if (!template) throw new Error('No certificate template found — create a default template first');

    // 3. Generate certificate number (CERT-2026-SLUG-00142)
    const year    = new Date().getFullYear();
    const tenantSlug = enrollment.tenant?.slug ?? 'individual';
    const slug    = tenantSlug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

    let seq: number;
    try {
      const result = await prisma.$queryRaw<[{ next_seq: number }]>`
        SELECT COALESCE(MAX(
          CAST(SPLIT_PART(certificate_number, '-', 4) AS INTEGER)
        ), 0) + 1 AS next_seq
        FROM certificates
        WHERE tenant_id = ${enrollment.tenantId ?? '00000000-0000-0000-0000-000000000000'}::uuid
          AND EXTRACT(YEAR FROM issued_at) = ${year}
      `;
      seq = result[0].next_seq;
    } catch {
      seq = 1;
    }

    const certNumber = `CERT-${year}-${slug}-${String(seq).padStart(5, '0')}`;
    const verificationHash = generateVerificationHash(enrollmentId, certNumber);

    // 4. Create certificate record (pdf_url = null initially)
    const score = enrollment.quizAttempts[0]?.score ?? 100;
    const certificate = await prisma.certificate.create({
      data: {
        userId:           enrollment.userId,
        courseId:         enrollment.courseId,
        enrollmentId,
        tenantId:         enrollment.tenantId,
        certificateNumber: certNumber,
        score,
        verificationHash,
        templateId:       template.id,
      },
    });

    // 5. Render HTML template with merge fields
    const html = template.htmlTemplate
      .replace(/{{student_name}}/g, `${enrollment.user.firstName} ${enrollment.user.lastName}`)
      .replace(/{{course_title}}/g, enrollment.course.title)
      .replace(/{{issue_date}}/g, new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }))
      .replace(/{{cert_number}}/g, certNumber)
      .replace(/{{score}}/g, String(score))
      .replace(/{{org_name}}/g, enrollment.tenant?.name ?? 'Individual')
      .replace(/{{logo_url}}/g, enrollment.tenant?.logoUrl ?? '')
      .replace(/{{verify_url}}/g, `${process.env.CERT_VERIFICATION_BASE_URL ?? ''}/verify/${verificationHash}`);

    // 6. Generate PDF via Puppeteer service
    let pdfUrl: string | undefined;
    try {
      const puppeteerUrl = process.env.PDF_WORKER_URL ?? process.env.PUPPETEER_SERVICE_URL ?? 'http://localhost:7000';
      const pdfResponse = await axios.post<ArrayBuffer>(
        `${puppeteerUrl}/generate-pdf`,
        { html },
        { responseType: 'arraybuffer', timeout: 30_000 },
      );

      const pdfKey = `certificates/${enrollment.tenantId ?? 'individual'}/${enrollment.userId}/${certificate.id}.pdf`;
      pdfUrl = await uploadToS3(pdfKey, Buffer.from(pdfResponse.data), 'application/pdf');

      await prisma.certificate.update({
        where: { id: certificate.id },
        data: { pdfUrl, pdfGeneratedAt: new Date() },
      });
    } catch (pdfErr) {
      // PDF generation failure should NOT roll back the certificate record
      logger.error({ err: pdfErr, certId: certificate.id }, 'PDF generation failed — certificate record still created');
    }

    // 7. Link certificate to enrollment
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { certificateId: certificate.id },
    });

    // 8. Queue congratulations email
    await addEmailJob({ templateName: 'certificate-issued', userId: enrollment.userId, certificateId: certificate.id });

    logger.info({ certNumber, userId: enrollment.userId }, 'Certificate generated');
    return { certificateId: certificate.id, certNumber };
  },
  { connection: bullmqConnection, concurrency: 2, skipVersionCheck: true },
);

certWorker.on('failed', (job, err) =>
  logger.error({ jobId: job?.id, err }, 'Certificate worker job failed'),
);
