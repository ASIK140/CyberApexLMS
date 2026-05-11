import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { tenantService } from '../services/tenant.service';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';

const router = Router();

const CreateTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  domain: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'trial']).default('active'),
  maxUsers: z.number().default(-1),
  subscriptionPlan: z.string().default('starter'),
});

router.get('/', authenticate, authorize(['super_admin']), async (req: Request, res: Response, next) => {
  try {
    const params = {
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
      status: req.query.status as string | undefined,
    };
    const result = await tenantService.list(params);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post('/', authenticate, authorize(['super_admin']), async (req: Request, res: Response, next) => {
  try {
    const data = CreateTenantSchema.parse(req.body);
    const tenant = await tenantService.create(req.user, data, req.ip ?? '');
    res.status(201).json({ data: tenant });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', authenticate, authorize(['super_admin', 'tenant_admin']), async (req: Request, res: Response, next) => {
  try {
    // If tenant_admin, must match tenantId
    if (req.user?.role !== 'super_admin' && req.user?.tenantId !== req.params.id) {
      return res.status(403).json({ error: { message: 'Cross-tenant access denied' }});
    }
    const tenant = await tenantService.getById(req.params.id);
    res.json({ data: tenant });
  } catch (err) {
    next(err);
  }
});

export default router;
