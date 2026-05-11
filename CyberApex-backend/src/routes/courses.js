'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/contentLibraryController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const SA = requireRole('super_admin');

router.post('/create',       authenticate, SA, ctrl.create);
router.post('/publish',      authenticate, SA, ctrl.publish);
router.get('/preview/:id',   authenticate, SA, ctrl.preview);

module.exports = router;
