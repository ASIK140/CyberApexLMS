'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/storageController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/', authenticate, requireRole('super_admin'), ctrl.getStorageData);
router.post('/expand', authenticate, requireRole('super_admin'), ctrl.expandStorage);

module.exports = router;
