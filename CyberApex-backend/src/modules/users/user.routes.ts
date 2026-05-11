import { Router } from 'express';
import { createUser, fetchUsers } from './user.controller';
import { protectRoute } from '../../middlewares/authMiddleware';
import { authorizeRoles, Roles } from '../../middlewares/rbac';
import { tenantScopeMiddleware } from '../../middlewares/tenantScope';

const router = Router();

// Routes protected by JWT + Tenant Scope
router.use(protectRoute);
router.use(tenantScopeMiddleware);

// Tenant Admins and Managers can fetch users in their tenant
router.get('/', authorizeRoles(Roles.TENANT_ADMIN, Roles.MANAGER), fetchUsers);

// Only Tenant Admins can create new users directly
router.post('/', authorizeRoles(Roles.TENANT_ADMIN), createUser);

export default router;
