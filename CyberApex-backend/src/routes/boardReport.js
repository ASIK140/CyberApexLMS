const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/boardReportController');
const { authenticate } = require('../middleware/auth');
const { requireRole, tenantIsolation } = require('../middleware/rbac');

// The Board Report module should be accessible to CISO, Tenant Admin, and Super Admin.
const boardAccess = [authenticate, tenantIsolation, requireRole('ciso', 'tenant_admin', 'super_admin')];

router.get('/summary', boardAccess, ctrl.getSummary);
router.get('/metrics', boardAccess, ctrl.getMetrics);
router.get('/risks', boardAccess, ctrl.getRisksAndRecommendations);

router.post('/generate', boardAccess, ctrl.generateReport);
router.get('/pdf', boardAccess, ctrl.exportPDF);
router.post('/email', boardAccess, ctrl.emailReport);
router.post('/schedule', boardAccess, ctrl.scheduleReport);

module.exports = router;
