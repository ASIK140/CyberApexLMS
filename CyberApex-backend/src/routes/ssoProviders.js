'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/ssoController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const SA = requireRole('super_admin');

router.get('/',           authenticate, SA, ctrl.getIntegrations);
router.get('/alerts',    authenticate, SA, ctrl.getAlerts);
router.post('/diagnose', authenticate, SA, ctrl.diagnose);
router.post('/fix',      authenticate, SA, ctrl.fix);
router.post('/setup',    authenticate, SA, ctrl.setup);
router.get('/export/csv', authenticate, SA, ctrl.exportCSV);
router.get('/export/excel', authenticate, SA, ctrl.exportExcel);

module.exports = router;
