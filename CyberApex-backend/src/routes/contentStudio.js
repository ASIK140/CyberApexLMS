'use strict';
const express = require('express');
const router  = express.Router();
const c       = require('../controllers/contentStudioController');

// File upload (video MP4, PDF notes)
router.post('/upload', c.uploadMedia);

// Courses
router.get('/list',           c.listCourses);
router.get('/:id',            c.getCourse);
router.post('/create',        c.createCourse);
router.put('/update/:id',     c.updateCourse);
router.delete('/delete/:id',  c.deleteCourse);

// Modules
router.post('/modules/add',   c.addModule);
router.put('/modules/:id',    c.updateModule);
router.delete('/modules/:id', c.deleteModule);

// Lessons
router.post('/lessons/add',   c.addLesson);
router.put('/lessons/:id',    c.updateLesson);
router.delete('/lessons/:id', c.deleteLesson);

// Content blocks
router.post('/blocks/add',    c.addBlock);
router.put('/blocks/:id',     c.updateBlock);
router.delete('/blocks/:id',  c.deleteBlock);

// Quizzes & Questions
router.post('/quiz/create',       c.createQuiz);
router.post('/questions/add',     c.addQuestion);
router.put('/questions/:id',      c.updateQuestion);
router.delete('/questions/:id',   c.deleteQuestion);

// Workflow
router.get('/validate/:id',          c.validateCourse);
router.post('/submit-review/:id',    c.submitForReview);
router.post('/approve/:id',          c.approveCourse);
router.post('/reject/:id',           c.rejectCourse);

module.exports = router;
