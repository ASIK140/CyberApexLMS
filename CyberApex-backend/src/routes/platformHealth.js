'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/platformHealthController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/', authenticate, requireRole('super_admin'), ctrl.getHealth);

module.exports = router;
