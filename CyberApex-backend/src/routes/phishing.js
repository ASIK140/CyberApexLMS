const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/phishingController');
const { authenticate } = require('../middleware/auth');
const { requireRole, tenantIsolation } = require('../middleware/rbac');

const cisoAccess = [authenticate, tenantIsolation, requireRole('ciso', 'tenant_admin', 'super_admin')];

router.get('/list', cisoAccess, ctrl.listCampaigns);
router.post('/create', cisoAccess, ctrl.createCampaign);
router.post('/send', cisoAccess, ctrl.sendCampaign);

router.get('/:id/results', cisoAccess, ctrl.getCampaignResults);
router.get('/:id/funnel', cisoAccess, ctrl.getFunnel);
router.get('/:id/departments', cisoAccess, ctrl.getDepartmentAnalytics);

router.get('/:id/export/csv', cisoAccess, ctrl.exportCsv);
router.get('/:id/export/pdf', cisoAccess, ctrl.exportPdf);

// Mock Automation Webhook
router.post('/simulate-event', cisoAccess, ctrl.simulateEvent);

module.exports = router;
