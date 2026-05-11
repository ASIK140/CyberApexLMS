'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/tenantController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const { body, param } = require('express-validator');
const { validate } = require('../middleware/validator');

const SA = requireRole('super_admin');

router.get('/',          authenticate, SA, ctrl.list);
router.get('/export',    authenticate, SA, ctrl.exportTenants);
router.get('/:id',       [authenticate, SA, param('id').notEmpty().withMessage('Invalid Tenant ID'), validate], ctrl.getById);

router.post('/', [
    authenticate, SA,
    body('organization_name').trim().escape().notEmpty().withMessage('Organization name is required'),
    body('admin_email').isEmail().withMessage('Valid admin email required').customSanitizer(v => v.toLowerCase().trim()),
    validate
], ctrl.create);

router.put('/:id', [
    authenticate, SA,
    param('id').notEmpty().withMessage('Invalid Tenant ID'),
    body('organization_name').optional().trim().escape(),
    body('admin_email').optional().isEmail().customSanitizer(v => v.toLowerCase().trim()),
    validate
], ctrl.update);

router.patch('/:id/status', [
    authenticate, SA,
    param('id').notEmpty().withMessage('Invalid Tenant ID'),
    body('status').isIn(['active', 'suspended']).withMessage('Invalid status'),
    validate
], ctrl.updateStatus);

router.post('/:id/reset-password', [
    authenticate, SA,
    param('id').notEmpty().withMessage('Invalid Tenant ID'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    validate
], ctrl.resetAdminPassword);

router.delete('/:id', [authenticate, SA, param('id').notEmpty().withMessage('Invalid Tenant ID'), validate], ctrl.remove);

// ── Tenant Course Assignments (Super Admin) ───────────────
router.get('/:id/courses',              authenticate, SA, ctrl.listTenantCourses);
router.post('/:id/courses',             authenticate, SA, ctrl.assignCourseToTenant);
router.delete('/:id/courses/:courseId', authenticate, SA, ctrl.removeCourseFromTenant);

module.exports = router;
