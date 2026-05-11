'use strict';
const router = require('express').Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/login', [
    body('email').notEmpty().withMessage('Email or Login ID required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
], ctrl.login);

router.post('/register', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().escape().notEmpty().withMessage('Name is required'),
    validate
], ctrl.register);

router.post('/refresh', ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.me);

module.exports = router;
