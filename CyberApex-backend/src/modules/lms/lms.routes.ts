import { Router } from 'express';
import { createCourse, fetchCourses } from './lms.controller';
import { protectRoute } from '../../middlewares/authMiddleware';
import { authorizeRoles, Roles } from '../../middlewares/rbac';
import { tenantScopeMiddleware } from '../../middlewares/tenantScope';

const router = Router();

router.use(protectRoute);
router.use(tenantScopeMiddleware);

// All tenant users can fetch courses (employees see assigned/published; filtered in controller later)
router.get('/', fetchCourses);

// Only Tenant Admins can build new courses
router.post('/', authorizeRoles(Roles.TENANT_ADMIN), createCourse);

export default router;
