'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/billingController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const SA = requireRole('super_admin');

router.get('/',         authenticate, SA, ctrl.getBilling);
router.get('/revenue',  authenticate, SA, ctrl.getRevenue);
router.get('/export',   authenticate, SA, ctrl.exportBilling);

module.exports = router;
