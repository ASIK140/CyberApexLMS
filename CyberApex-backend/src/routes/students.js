'use strict';
const router = require('express').Router();
const ctrl   = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');
const { requireRole }  = require('../middleware/rbac');

const SA = requireRole('super_admin');

// ── Courses picker (for Add Student form) ─────────────────────────────────────
router.get('/courses-list', authenticate, SA, ctrl.coursesList);

// ── List / Export all students ─────────────────────────────────────────────────
router.get('/',          authenticate, SA, ctrl.list);
router.get('/export',    authenticate, SA, ctrl.exportAll);

// ── Single student & Bulk ─────────────────────────────────────────────────────────────
router.post('/bulk-delete', authenticate, SA, ctrl.deleteBulk);
router.get('/:id',       authenticate, SA, ctrl.getById);
router.post('/',         authenticate, SA, ctrl.create);
router.put('/:id',       authenticate, SA, ctrl.update);
router.delete('/:id',    authenticate, SA, ctrl.deleteOne);

// ── Service control ────────────────────────────────────────────────────────────
router.patch('/:id/stop-service',   authenticate, SA, ctrl.stopService);
router.patch('/:id/reset-password', authenticate, SA, ctrl.resetPassword);

// ── Course assignment ──────────────────────────────────────────────────────────
router.post('/:id/assign-course', authenticate, SA, ctrl.assignCourse);
router.delete('/:id/courses/:courseId', authenticate, SA, ctrl.removeCourse);

// ── Per-student activity export ────────────────────────────────────────────────
router.get('/:id/activity-report', authenticate, SA, ctrl.exportActivity);

module.exports = router;
