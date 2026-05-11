import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { userService } from '../services/user.service';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { upload } from '../middleware/upload';
import { uploadToS3 } from '../lib/s3';
import { addImportJob } from '../queues';
import { AppError, ErrorCodes } from '../lib/app-error';

const router = Router({ mergeParams: true });

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum(['super_admin', 'tenant_admin', 'ciso', 'student']),
  jobRoleCategory: z.enum(['general', 'it', 'cybersecurity', 'dev', 'risk', 'privileged', 'executive']).optional(),
  status: z.enum(['active', 'inactive', 'invited', 'locked', 'sso_only']).optional(),
  employeeId: z.string().max(100).optional(),
  department: z.string().max(150).optional(),
});

// GET /api/v1/tenants/:tenantId/users
router.get('/', authenticate, authorize(['super_admin', 'tenant_admin', 'ciso'], { sameTenantOnly: true }), async (req: Request, res: Response, next) => {
  try {
    const tenantId = req.params.tenantId;
    const params = {
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 20),
      status: req.query.status as string | undefined,
    };
    const result = await userService.list(tenantId, params);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/tenants/:tenantId/users
router.post('/', authenticate, authorize(['super_admin', 'tenant_admin'], { sameTenantOnly: true }), async (req: Request, res: Response, next) => {
  try {
    const tenantId = req.params.tenantId;
    const data = CreateUserSchema.parse(req.body);
    const user = await userService.create(tenantId, req.user, data, req.ip ?? '');
    res.status(201).json({ data: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/tenants/:tenantId/users/bulk-import
router.post('/bulk-import',
  authenticate,
  authorize(['super_admin', 'tenant_admin'], { sameTenantOnly: true }),
  upload.single('file'),
  async (req: Request, res: Response, next) => {
    try {
      if (!req.file) throw new AppError(ErrorCodes.VALIDATION_ERROR, 'No CSV file uploaded', 400);
      
      const tenantId = req.params.tenantId;
      const inputKey = `imports/${tenantId}/${Date.now()}-${req.file.originalname}`;
      
      // 1. Upload CSV to S3
      await uploadToS3(inputKey, req.file.buffer, req.file.mimetype);

      // 2. Queue import job
      const job = await addImportJob({ 
        tenantId, 
        inputKey, 
        requestedBy: req.user!.id 
      });

      res.status(202).json({
        success: true,
        message: 'Bulk import started',
        jobId: job.id
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
