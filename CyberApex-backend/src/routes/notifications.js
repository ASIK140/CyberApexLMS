'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const SA = requireRole('super_admin');

router.get('/',              authenticate, SA, ctrl.list);
router.post('/',             authenticate, SA, ctrl.create);
router.patch('/:id/read',    authenticate, SA, ctrl.markRead);
router.patch('/read-all',    authenticate, SA, ctrl.markAllRead);
router.post('/bulk',         authenticate, SA, ctrl.bulkCreate);

module.exports = router;
