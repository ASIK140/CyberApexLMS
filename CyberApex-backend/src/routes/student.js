'use strict';
const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/auth');
const ctrl = require('../controllers/studentPortalController');

const STUDENT = authorizeRoles('student');

// GET  /api/student/me  — get own profile + assigned courses
router.get('/me', authenticate, STUDENT, ctrl.getMe);

// GET  /api/student/courses — list assigned courses with full details
router.get('/courses', authenticate, STUDENT, ctrl.getCourses);

// GET  /api/student/courses/:courseId — get specific course player details
router.get('/courses/:courseId', authenticate, STUDENT, ctrl.getCoursePlayerDetails);


// PATCH /api/student/progress  — update progress for a course
router.patch('/progress', authenticate, STUDENT, ctrl.updateProgress);

module.exports = router;
