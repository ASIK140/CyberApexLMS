'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/auditController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const SA = requireRole('super_admin');

router.get('/',               authenticate, SA, ctrl.list);
router.get('/export',         authenticate, SA, ctrl.exportLogs);

module.exports = router;
