import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { addAutoEnrollJob } from '../queues';
import { AuditRepository } from '../repositories/audit.repository';

const router    = Router();
const auditRepo = new AuditRepository();

// ── GET /compliance — list frameworks ───────────────────────────────────────
router.get('/', authenticate, async (_req, res, next) => {
  try {
    const frameworks = await prisma.complianceFramework.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    return res.json({ data: frameworks });
  } catch (err) {
    next(err);
  }
});

// ── POST /compliance — create framework (super_admin only) ───────────────────
router.post('/', authenticate, authorize(['super_admin']), async (req: Request, res: Response, next) => {
  try {
    const data = z.object({
      name:        z.string(),
      code:        z.string(),
      version:     z.string(),
      description: z.string().optional(),
      authority:   z.string().optional(),
      region:      z.string().optional(),
    }).parse(req.body);

    const framework = await prisma.complianceFramework.create({
      data: { ...data, createdBy: req.user!.id },
    });

    return res.status(201).json({ data: framework });
  } catch (err) {
    next(err);
  }
});

// ── POST /tenants/:tenantId/compliance — assign framework → triggers T1 enroll
router.post(
  '/tenants/:tenantId/compliance',
  authenticate,
  authorize(['super_admin']),
  async (req: Request, res: Response, next) => {
    try {
      const { complianceIds, effectiveDate, dueDateDays } = z.object({
        complianceIds: z.array(z.string().uuid()),
        effectiveDate: z.string(),
        dueDateDays:   z.number().default(30),
      }).parse(req.body);

      const { tenantId } = req.params;

      // Upsert each compliance mapping
      for (const complianceId of complianceIds) {
        await prisma.tenantComplianceMapping.upsert({
          where:  { tenantId_complianceId: { tenantId, complianceId } },
          create: { tenantId, complianceId, assignedBy: req.user!.id, effectiveDate: new Date(effectiveDate), dueDateDays },
          update: { dueDateDays, effectiveDate: new Date(effectiveDate) },
        });

        // Trigger T1 auto-enrollment
        await addAutoEnrollJob({ triggerType: 'T1', tenantId, complianceId });
      }

      await auditRepo.log({
        actorId:    req.user!.id,
        actorEmail: req.user!.email,
        actorRole:  req.user!.role,
        action:     'COMPLIANCE_ASSIGNED',
        entityType: 'tenant',
        entityId:   tenantId,
        afterState: { complianceIds, dueDateDays },
        ipAddress:  req.ip,
      });

      return res.status(202).json({
        data: { status: 'queued', message: 'Compliance assigned — auto-enrollment processing started', count: complianceIds.length },
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
