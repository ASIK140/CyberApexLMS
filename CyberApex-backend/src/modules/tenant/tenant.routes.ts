import { Router } from 'express';
import { createTenant, getTenants, suspendTenant } from './tenant.controller';
import { protectRoute } from '../../middlewares/authMiddleware';
import { authorizeRoles, Roles } from '../../middlewares/rbac';

const router = Router();

// Only Super Admins can manage Tenants globally
router.use(protectRoute);
router.use(authorizeRoles(Roles.SUPER_ADMIN));

router.post('/', createTenant);
router.get('/', getTenants);
router.put('/:id/suspend', suspendTenant);

export default router;
