'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/industryPackController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const { body, param } = require('express-validator');
const { validate } = require('../middleware/validator');

const SA = requireRole('super_admin');

router.get('/export',         authenticate, SA, ctrl.exportPacks);
router.get('/',               authenticate, SA, ctrl.list);
router.get('/export/csv',     authenticate, SA, ctrl.exportCsv);
router.get('/:id', [
    authenticate, SA,
    param('id').notEmpty().withMessage('Pack ID required'),
    validate
], ctrl.getById);

router.post('/', [
    authenticate, SA,
    body('pack_name').trim().escape().notEmpty().withMessage('Pack name required'),
    body('industry_category').notEmpty().withMessage('Industry category required'),
    validate
], ctrl.create);

router.post('/assign', [
    authenticate, SA,
    body('pack_id').notEmpty().withMessage('Pack ID required'),
    body('tenant_id').notEmpty().withMessage('Tenant ID required'),
    validate
], ctrl.assignToTenant);

router.post('/custom', [
    authenticate, SA,
    body('pack_name').trim().escape().notEmpty().withMessage('Custom pack name required'),
    body('courses').isArray({ min: 1 }).withMessage('At least one course required'),
    validate
], ctrl.createCustomPack);

router.put('/:id', [
    authenticate, SA,
    param('id').notEmpty().withMessage('Pack ID required'),
    body('pack_name').optional().trim().escape(),
    validate
], ctrl.update);

router.delete('/:id', [
    authenticate, SA,
    param('id').notEmpty().withMessage('Pack ID required'),
    validate
], ctrl.remove);

module.exports = router;
