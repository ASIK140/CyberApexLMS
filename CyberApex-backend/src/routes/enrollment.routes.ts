import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { AppError, ErrorCodes } from '../lib/app-error';
import { addAutoEnrollJob } from '../queues';
import { completionService } from '../services/completion.service';
import { EnrollmentRepository } from '../repositories/enrollment.repository';
import { AuditRepository } from '../repositories/audit.repository';

const router   = Router();
const enrollRepo = new EnrollmentRepository();
const auditRepo  = new AuditRepository();

// ── GET /enrollments — list enrollments (scoped by role) ─────────────────────
router.get('/', authenticate, async (req: Request, res: Response, next) => {
  try {
    const user = req.user!;
    const page  = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 20);

    if (user.role === 'student') {
      const data = await enrollRepo.findByUser(user.id);
      return res.json({ data });
    }

    const tenantId = user.role === 'super_admin'
      ? (req.query.tenantId as string | undefined)
      : user.tenantId!;

    if (!tenantId) return res.json({ data: [], meta: { total: 0 } });

    const result = await enrollRepo.findByTenant(tenantId, {
      page, limit, status: req.query.status as string | undefined,
    });

    return res.json(result);
  } catch (err) {
    next(err);
  }
});

// ── POST /enrollments — manual enrollment ────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize(['super_admin', 'tenant_admin', 'ciso']),
  async (req: Request, res: Response, next) => {
    try {
      const { userId, courseId, dueDate } = z.object({
        userId:  z.string().uuid(),
        courseId: z.string().uuid(),
        dueDate:  z.string().optional(),
      }).parse(req.body);

      const course = await prisma.course.findFirst({ where: { id: courseId, status: 'published', deletedAt: null } });
      if (!course) throw new AppError(ErrorCodes.COURSE_NOT_PUBLISHED, 'Course not found or not published', 404);

      const enrollment = await prisma.enrollment.create({
        data: {
          userId,
          courseId,
          tenantId:       req.user!.tenantId,
          enrollmentType: 'manual',
          dueDate:        dueDate ? new Date(dueDate) : undefined,
          enrolledBy:     req.user!.id,
        },
      });

      await auditRepo.log({
        actorId:    req.user!.id,
        actorEmail: req.user!.email,
        actorRole:  req.user!.role,
        tenantId:   req.user!.tenantId,
        action:     'MANUAL_ENROLLED',
        entityType: 'enrollment',
        entityId:   enrollment.id,
        afterState: { userId, courseId },
        ipAddress:  req.ip,
      });

      return res.status(201).json({ data: enrollment });
    } catch (err) {
      next(err);
    }
  },
);

// ── PATCH /enrollments/:id — update due date ─────────────────────────────────
router.patch(
  '/:id',
  authenticate,
  authorize(['super_admin', 'tenant_admin', 'ciso']),
  async (req: Request, res: Response, next) => {
    try {
      const { dueDate } = z.object({ dueDate: z.string() }).parse(req.body);
      const updated = await prisma.enrollment.update({
        where: { id: req.params.id },
        data:  { dueDate: new Date(dueDate) },
      });
      return res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
);

// ── POST /enrollments/:id/progress — update lesson progress ─────────────────
router.post('/:id/progress', authenticate, async (req: Request, res: Response, next) => {
  try {
    const { lessonId, status, videoPosition, videoCompletedPct } = z.object({
      lessonId:         z.string().uuid(),
      status:           z.enum(['not_started', 'in_progress', 'completed']),
      videoPosition:    z.number().int().optional(),
      videoCompletedPct: z.number().optional(),
    }).parse(req.body);

    const enrollment = await prisma.enrollment.findUniqueOrThrow({ where: { id: req.params.id } });

    if (enrollment.userId !== req.user!.id && !['super_admin', 'tenant_admin', 'ciso'].includes(req.user!.role)) {
      throw new AppError(ErrorCodes.FORBIDDEN, 'Not your enrollment', 403);
    }

    const progress = await enrollRepo.upsertLessonProgress(
      req.params.id,
      lessonId,
      enrollment.userId,
      {
        status: status as any,
        videoPosition,
        videoCompletedPct,
        startedAt:   status === 'in_progress' ? new Date() : undefined,
        completedAt: status === 'completed'   ? new Date() : undefined,
      },
    );

    if (status === 'completed') {
      // Non-blocking completion check
      completionService.checkAndComplete(req.params.id).catch((err) =>
        console.error('Completion check failed', err),
      );
    }

    return res.json({ data: progress });
  } catch (err) {
    next(err);
  }
});

export default router;
