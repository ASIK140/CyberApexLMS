import { Router } from 'express';
import { createCampaign, fetchCampaigns } from './phishing.controller';
import { protectRoute } from '../../middlewares/authMiddleware';
import { authorizeRoles, Roles } from '../../middlewares/rbac';
import { tenantScopeMiddleware } from '../../middlewares/tenantScope';

const router = Router();

router.use(protectRoute);
router.use(tenantScopeMiddleware);

// Only CISO and TENANT_ADMIN should manage/view phishing campaigns
router.get('/', authorizeRoles(Roles.TENANT_ADMIN, Roles.CISO), fetchCampaigns);

router.post('/', authorizeRoles(Roles.TENANT_ADMIN), createCampaign);

export default router;
