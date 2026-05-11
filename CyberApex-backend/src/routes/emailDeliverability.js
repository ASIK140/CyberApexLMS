const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailDeliverabilityController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const SA = requireRole('super_admin');

// All routes require authentication and Super Admin role
router.use(authenticate);
router.use(SA);

router.get('/', emailController.getDeliverabilityData);
router.get('/alerts', emailController.getEmailAlerts);
router.post('/fix-spf', emailController.fixSPF);
router.post('/fix-dmarc', emailController.fixDMARC);
router.post('/generate-dkim', emailController.generateDKIM);
router.get('/export/csv', emailController.exportCSV);
router.get('/export/excel', emailController.exportExcel);

module.exports = router;
