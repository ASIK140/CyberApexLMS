'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/emailController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const SA = requireRole('super_admin');

router.get('/deliverability', authenticate, SA, ctrl.getDeliverability);
router.get('/logs',           authenticate, SA, ctrl.getLogs);

module.exports = router;
