'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/contentLibraryController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const SA = requireRole('super_admin');

router.get('/',             authenticate, SA, ctrl.list);
router.get('/export/:type', authenticate, SA, ctrl.exportData);
router.get('/:id',          authenticate, SA, ctrl.getById);
router.post('/',            authenticate, SA, ctrl.create);
router.put('/:id',          authenticate, SA, ctrl.update);
router.delete('/:id',       authenticate, SA, ctrl.remove);

module.exports = router;
