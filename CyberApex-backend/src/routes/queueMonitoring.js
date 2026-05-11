'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/queueMonitoringController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.get('/jobs', authenticate, requireRole('super_admin'), ctrl.getJobs);
router.get('/emails', authenticate, requireRole('super_admin'), ctrl.getEmails);
router.delete('/jobs/:id', authenticate, requireRole('super_admin'), ctrl.removeJob);
router.post('/jobs/:id/cancel', authenticate, requireRole('super_admin'), ctrl.cancelJob);
router.post('/jobs/:id/retry', authenticate, requireRole('super_admin'), ctrl.retryJob);
router.post('/jobs/retry-all', authenticate, requireRole('super_admin'), ctrl.retryAllFailed);

router.get('/pause-status', authenticate, requireRole('super_admin'), ctrl.getPauseStatus);
router.post('/pause-status', authenticate, requireRole('super_admin'), ctrl.togglePause);
router.post('/emails/:id/cancel', authenticate, requireRole('super_admin'), ctrl.cancelEmail);
router.post('/emails/:id/resend', authenticate, requireRole('super_admin'), ctrl.resendEmail);

module.exports = router;
