const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { authenticate } = require('../middleware/auth');
const { requireRole, tenantIsolation } = require('../middleware/rbac');

// Allow CISO, Tenant Admin, and Super Admin access
const complianceAccess = [authenticate, tenantIsolation, requireRole('ciso', 'tenant_admin', 'super_admin')];

// Routes for CISO Dashboard actions
router.get('/summary', complianceAccess, complianceController.getSummary);
router.get('/framework/:id', complianceAccess, complianceController.getFrameworkDetails);
router.post('/deploy-training', complianceAccess, complianceController.deployTraining);
router.get('/report', complianceAccess, complianceController.getReport);

module.exports = router;
