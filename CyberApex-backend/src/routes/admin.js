'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/dashboard', authenticate, requireRole('super_admin'), ctrl.getDashboard);
router.get('/analytics', authenticate, requireRole('super_admin'), ctrl.getAnalytics);

module.exports = router;
