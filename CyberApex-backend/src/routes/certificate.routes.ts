import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { CertificateRepository } from '../repositories/certificate.repository';
import { getPresignedUrl } from '../lib/s3';
import { AppError, ErrorCodes } from '../lib/app-error';

const router   = Router();
const certRepo = new CertificateRepository();

// ── GET /certificates — list my certificates ────────────────────────────────
router.get('/', authenticate, async (req: Request, res: Response, next) => {
  try {
    const user = req.user!;

    if (user.role === 'student') {
      const certs = await certRepo.findByUser(user.id);
      return res.json({ data: certs });
    }

    // Admins can list certs scoped to their tenant
    const { prisma } = await import('../lib/prisma');
    const tenantId = user.role === 'super_admin' ? (req.query.tenantId as string) : user.tenantId;
    const page  = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);
    const skip  = (page - 1) * limit;

    const [data, total] = await prisma.$transaction([
      prisma.certificate.findMany({
        where: { ...(tenantId ? { tenantId } : {}), revoked: false },
        skip, take: limit,
        include: {
          user:   { select: { firstName: true, lastName: true, email: true } },
          course: { select: { title: true } },
        },
        orderBy: { issuedAt: 'desc' },
      }),
      prisma.certificate.count({ where: { ...(tenantId ? { tenantId } : {}), revoked: false } }),
    ]);

    return res.json({ data, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

// ── GET /certificates/:id/download — presigned PDF URL ──────────────────────
router.get('/:id/download', authenticate, async (req: Request, res: Response, next) => {
  try {
    const cert = await certRepo.findById(req.params.id);
    if (!cert) throw new AppError(ErrorCodes.NOT_FOUND, 'Certificate not found', 404);

    const user = req.user!;
    if (user.role === 'student' && cert.userId !== user.id) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Not your certificate', 403);
    }

    if (!cert.pdfUrl) throw new AppError(ErrorCodes.NOT_FOUND, 'PDF not yet generated', 404);

    // Extract S3 key from full URL
    const key = cert.pdfUrl.replace(`${process.env.S3_PUBLIC_URL ?? ''}/`, '');
    const url = await getPresignedUrl(key, 3600);

    return res.json({ data: { url, expiresIn: 3600 } });
  } catch (err) {
    next(err);
  }
});

// ── GET /verify/:hash — PUBLIC certificate verification ─────────────────────
router.get('/verify/:hash', async (req: Request, res: Response, next) => {
  try {
    const cert = await certRepo.findByHash(req.params.hash);
    if (!cert || cert.revoked) {
      return res.status(404).json({ data: { valid: false, reason: cert?.revoked ? 'Certificate has been revoked' : 'Certificate not found' } });
    }

    return res.json({
      data: {
        valid: true,
        certificateNumber: cert.certificateNumber,
        studentName: `${cert.user.firstName} ${cert.user.lastName}`,
        courseTitle: cert.course.title,
        issuedAt:    cert.issuedAt,
        expiresAt:   cert.expiresAt,
        score:       cert.score,
        issuer:      cert.tenant?.name ?? 'CyberApex LMS',
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
