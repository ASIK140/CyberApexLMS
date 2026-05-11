/**
 * Tenant Users Routes
 * Manage users within each tenant
 */

const express = require('express');
const router = express.Router({ mergeParams: true });
const tenantUsersController = require('../controllers/tenantUsersController');
const { authenticate } = require('../middleware/authenticate');
const tenantIsolation = require('../middleware/tenantIsolation');

// All routes require authentication and tenant isolation
router.use(authenticate);
router.use(tenantIsolation);

// List users in tenant
router.get('/', tenantUsersController.list);

// Get single user
router.get('/:userId', tenantUsersController.getOne);

// Create user
router.post('/', tenantUsersController.create);

// Update user
router.put('/:userId', tenantUsersController.update);

// Update user status
router.patch('/:userId/status', tenantUsersController.updateStatus);

// Reset password
router.post('/:userId/reset-password', tenantUsersController.resetPassword);

// Delete user
router.delete('/:userId', tenantUsersController.delete);

module.exports = router;
