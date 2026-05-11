'use strict';
const path    = require('path');
const fs      = require('fs');
const { v4: uuidv4 } = require('uuid');
const multer  = require('multer');
const { PrismaClient } = require('@prisma/client');
const { StudioCourse, StudioModule, StudioLesson, ContentBlock, StudioQuiz, StudioQuestion } = require('../models');

const prisma = new PrismaClient();

// ─── Upload directory ─────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'dist', 'uploads', 'studio');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uuidv4()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.pdf', '.doc', '.docx'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) cb(null, true);
        else cb(new Error(`File type ${ext} not allowed. Allowed: mp4, webm, mov, pdf, doc, docx`));
    },
});

// ─── Prisma RLS bypass ────────────────────────────────────────────────────────
async function withSA(fn) {
    return prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_role', 'super_admin', true)`;
        await tx.$executeRaw`SELECT set_config('app.current_tenant_id', '00000000-0000-0000-0000-000000000000', true)`;
        return fn(tx);
    });
}

// ─── POST /upload ─────────────────────────────────────────────────────────────
exports.uploadMedia = [
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
            const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
            const url = `${baseUrl}/uploads/studio/${req.file.filename}`;
            return res.json({
                success: true,
                data: {
                    url,
                    filename:     req.file.filename,
                    originalname: req.file.originalname,
                    size:         req.file.size,
                    mimetype:     req.file.mimetype,
                },
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    },
];

// ─── COURSE ENDPOINTS ─────────────────────────────────────────────────────────

exports.listCourses = async (req, res, next) => {
    try {
        const { audience, status } = req.query;
        const where = {};
        if (audience) where.audience = audience;
        if (status)   where.status   = status;

        const courses = await StudioCourse.findAll({
            where,
            include: [{ model: StudioModule, as: 'modules', include: [{ model: StudioLesson, as: 'lessons' }] }],
            order: [['updated_at', 'DESC']],
        });

        const stats = {
            total:     await StudioCourse.count(),
            published: await StudioCourse.count({ where: { status: 'published' } }),
            in_review: await StudioCourse.count({ where: { status: 'in_review' } }),
            draft:     await StudioCourse.count({ where: { status: 'draft' } }),
        };

        res.json({ success: true, data: courses, stats });
    } catch (err) { next(err); }
};

exports.getCourse = async (req, res, next) => {
    try {
        const course = await StudioCourse.findByPk(req.params.id, {
            include: [{
                model: StudioModule, as: 'modules', order: [['order', 'ASC']],
                include: [{
                    model: StudioLesson, as: 'lessons', order: [['order', 'ASC']],
                    include: [
                        { model: ContentBlock, as: 'blocks', order: [['order', 'ASC']] },
                        { model: StudioQuiz, as: 'quizzes', include: [{ model: StudioQuestion, as: 'questions', order: [['order', 'ASC']] }] },
                    ],
                }],
            }],
        });
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        res.json({ success: true, data: course });
    } catch (err) { next(err); }
};

exports.createCourse = async (req, res, next) => {
    try {
        const { title, description, audience, category, compliance_tags, pass_mark, certificate_enabled, certificate_name, deadline_days } = req.body;
        if (!title?.trim()) return res.status(400).json({ success: false, message: 'Course title is required' });

        const course = await StudioCourse.create({
            title, description,
            audience: audience || 'Corporate',
            category,
            compliance_tags: compliance_tags || [],
            status: 'draft',
            pass_mark: pass_mark || 70,
            certificate_enabled: certificate_enabled !== false,
            certificate_name,
            deadline_days,
            created_by: req.user?.email || 'admin@cyberapex.io',
        });

        res.status(201).json({ success: true, message: 'Course created', data: course });
    } catch (err) { next(err); }
};

exports.updateCourse = async (req, res, next) => {
    try {
        const course = await StudioCourse.findByPk(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        await course.update(req.body);
        res.json({ success: true, message: 'Course updated', data: course });
    } catch (err) { next(err); }
};

exports.deleteCourse = async (req, res, next) => {
    try {
        const course = await StudioCourse.findByPk(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        await course.destroy();
        res.json({ success: true, message: `Course "${course.title}" deleted` });
    } catch (err) { next(err); }
};

// ─── MODULE ENDPOINTS ─────────────────────────────────────────────────────────

exports.addModule = async (req, res, next) => {
    try {
        const { course_id, title, description } = req.body;
        const course = await StudioCourse.findByPk(course_id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        const count = await StudioModule.count({ where: { course_id } });
        const mod = await StudioModule.create({ course_id, title, description, order: count });
        res.status(201).json({ success: true, message: 'Module added', data: mod });
    } catch (err) { next(err); }
};

exports.updateModule = async (req, res, next) => {
    try {
        const mod = await StudioModule.findByPk(req.params.id);
        if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });
        await mod.update(req.body);
        res.json({ success: true, message: 'Module updated', data: mod });
    } catch (err) { next(err); }
};

exports.deleteModule = async (req, res, next) => {
    try {
        const mod = await StudioModule.findByPk(req.params.id);
        if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });
        await mod.destroy();
        res.json({ success: true, message: 'Module deleted' });
    } catch (err) { next(err); }
};

// ─── LESSON ENDPOINTS ─────────────────────────────────────────────────────────

exports.addLesson = async (req, res, next) => {
    try {
        const { module_id, title, unlock_condition, completion_rule } = req.body;
        const mod = await StudioModule.findByPk(module_id);
        if (!mod) return res.status(404).json({ success: false, message: 'Module not found' });
        const count = await StudioLesson.count({ where: { module_id } });
        const lesson = await StudioLesson.create({ module_id, title, unlock_condition, completion_rule, order: count });
        res.status(201).json({ success: true, message: 'Lesson added', data: lesson });
    } catch (err) { next(err); }
};

exports.updateLesson = async (req, res, next) => {
    try {
        const lesson = await StudioLesson.findByPk(req.params.id);
        if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
        await lesson.update(req.body);
        res.json({ success: true, message: 'Lesson updated', data: lesson });
    } catch (err) { next(err); }
};

exports.deleteLesson = async (req, res, next) => {
    try {
        const lesson = await StudioLesson.findByPk(req.params.id);
        if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
        await lesson.destroy();
        res.json({ success: true, message: 'Lesson deleted' });
    } catch (err) { next(err); }
};

// ─── CONTENT BLOCK ENDPOINTS ──────────────────────────────────────────────────

exports.addBlock = async (req, res, next) => {
    try {
        const { lesson_id, type, content_json, title } = req.body;
        const VALID = ['text', 'video', 'notes', 'quiz', 'file', 'scenario', 'quick_question'];
        if (!VALID.includes(type)) return res.status(400).json({ success: false, message: `Invalid block type: ${type}` });
        const count = await ContentBlock.count({ where: { lesson_id } });
        const block = await ContentBlock.create({ lesson_id, type, content_json: content_json || {}, title, order: count });
        res.status(201).json({ success: true, message: 'Block added', data: block });
    } catch (err) { next(err); }
};

exports.updateBlock = async (req, res, next) => {
    try {
        const block = await ContentBlock.findByPk(req.params.id);
        if (!block) return res.status(404).json({ success: false, message: 'Block not found' });
        await block.update(req.body);
        res.json({ success: true, message: 'Block updated', data: block });
    } catch (err) { next(err); }
};

exports.deleteBlock = async (req, res, next) => {
    try {
        const block = await ContentBlock.findByPk(req.params.id);
        if (!block) return res.status(404).json({ success: false, message: 'Block not found' });
        // Delete the file from disk if present
        const url = block.content_json?.url || '';
        if (url.includes('/uploads/studio/')) {
            const fname = url.split('/uploads/studio/')[1];
            const fpath = path.join(UPLOAD_DIR, fname);
            if (fname && fs.existsSync(fpath)) fs.unlinkSync(fpath);
        }
        await block.destroy();
        res.json({ success: true, message: 'Block deleted' });
    } catch (err) { next(err); }
};

// ─── QUIZ ENDPOINTS ───────────────────────────────────────────────────────────

exports.createQuiz = async (req, res, next) => {
    try {
        const { lesson_id, title, pass_mark, max_attempts, show_hints } = req.body;
        const lesson = await StudioLesson.findByPk(lesson_id);
        if (!lesson) return res.status(404).json({ success: false, message: 'Lesson not found' });
        const quiz = await StudioQuiz.create({
            lesson_id, title: title || 'Quiz',
            pass_mark: pass_mark || 70,
            max_attempts: max_attempts || 3,
            show_hints: show_hints !== false,
        });
        res.status(201).json({ success: true, message: 'Quiz created', data: quiz });
    } catch (err) { next(err); }
};

exports.addQuestion = async (req, res, next) => {
    try {
        const { quiz_id, question, options, correct_answer, explanation } = req.body;
        if (!question?.trim()) return res.status(400).json({ success: false, message: 'Question text is required' });
        if (!options || options.length < 2) return res.status(400).json({ success: false, message: 'At least 2 options required' });
        if (correct_answer === undefined || correct_answer === null)
            return res.status(400).json({ success: false, message: 'correct_answer index is required' });

        const quiz = await StudioQuiz.findByPk(quiz_id);
        if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

        const count = await StudioQuestion.count({ where: { quiz_id } });
        const q = await StudioQuestion.create({ quiz_id, question, options, correct_answer, explanation, order: count });
        res.status(201).json({ success: true, message: 'Question added', data: q });
    } catch (err) { next(err); }
};

exports.updateQuestion = async (req, res, next) => {
    try {
        const q = await StudioQuestion.findByPk(req.params.id);
        if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
        await q.update(req.body);
        res.json({ success: true, message: 'Question updated', data: q });
    } catch (err) { next(err); }
};

exports.deleteQuestion = async (req, res, next) => {
    try {
        const q = await StudioQuestion.findByPk(req.params.id);
        if (!q) return res.status(404).json({ success: false, message: 'Question not found' });
        await q.destroy();
        res.json({ success: true, message: 'Question deleted' });
    } catch (err) { next(err); }
};

// ─── WORKFLOW ENDPOINTS ───────────────────────────────────────────────────────

exports.submitForReview = async (req, res, next) => {
    try {
        const course = await StudioCourse.findByPk(req.params.id, {
            include: [{ model: StudioModule, as: 'modules', include: [{ model: StudioLesson, as: 'lessons', include: [{ model: StudioQuiz, as: 'quizzes', include: [{ model: StudioQuestion, as: 'questions' }] }] }] }],
        });
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        if (course.status === 'published') return res.status(400).json({ success: false, message: 'Course is already published' });

        const errors = [];
        if (!course.title?.trim()) errors.push('Course title is empty');
        if (!course.modules || course.modules.length === 0) errors.push('Course has no modules');
        for (const mod of (course.modules || [])) {
            if (!mod.lessons || mod.lessons.length === 0) errors.push(`Module "${mod.title}" has no lessons`);
            for (const lesson of (mod.lessons || [])) {
                for (const quiz of (lesson.quizzes || [])) {
                    if (!quiz.questions || quiz.questions.length === 0)
                        errors.push(`Quiz in "${lesson.title}" has no questions`);
                }
            }
        }
        if (errors.length > 0) return res.status(422).json({ success: false, message: 'Validation failed', errors });

        await course.update({ status: 'in_review' });
        res.json({ success: true, message: 'Course submitted for review.', status: 'in_review' });
    } catch (err) { next(err); }
};

exports.approveCourse = async (req, res, next) => {
    try {
        const course = await StudioCourse.findByPk(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        if (course.status !== 'in_review') return res.status(400).json({ success: false, message: 'Course must be in_review to approve' });

        await course.update({
            status: 'published',
            published_at: new Date(),
            approved_by: req.body.reviewer || 'admin@cyberapex.io',
            reviewer_note: req.body.note,
        });

        // ── Prisma Bridge: sync published Studio course → Prisma Course table ──
        // This makes the course available for tenant and individual student assignment.
        try {
            const slug = `studio-${course.id}`;
            await withSA(async (tx) => {
                const saUser = await tx.user.findFirst({ where: { role: 'super_admin', deletedAt: null } });
                if (!saUser) return;

                const existing = await tx.course.findFirst({ where: { slug } });
                if (existing) {
                    await tx.course.update({
                        where: { id: existing.id },
                        data: { title: course.title, status: 'published', description: course.description },
                    });
                } else {
                    await tx.course.create({
                        data: {
                            title:           course.title,
                            slug,
                            description:     course.description || '',
                            durationMinutes: 45,
                            status:          'published',
                            createdBy:       saUser.id,
                        },
                    });
                }
            });
        } catch (prismaErr) {
            console.warn('[Studio] Prisma sync warning:', prismaErr.message);
        }

        res.json({ success: true, message: 'Course approved and published!', status: 'published' });
    } catch (err) { next(err); }
};

exports.rejectCourse = async (req, res, next) => {
    try {
        const course = await StudioCourse.findByPk(req.params.id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        await course.update({ status: 'draft', reviewer_note: req.body.note || 'Returned for revision' });
        res.json({ success: true, message: 'Course returned to draft', status: 'draft' });
    } catch (err) { next(err); }
};

exports.validateCourse = async (req, res, next) => {
    try {
        const course = await StudioCourse.findByPk(req.params.id, {
            include: [{ model: StudioModule, as: 'modules', include: [{ model: StudioLesson, as: 'lessons', include: [{ model: StudioQuiz, as: 'quizzes', include: [{ model: StudioQuestion, as: 'questions' }] }] }] }],
        });
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

        const checks = [];
        checks.push({ name: 'Course title',     pass: !!course.title?.trim(),                       detail: course.title || 'Missing' });
        checks.push({ name: 'Has modules',       pass: (course.modules?.length || 0) > 0,            detail: `${course.modules?.length || 0} module(s)` });
        checks.push({ name: 'Compliance tags',   pass: (course.compliance_tags?.length || 0) > 0,    detail: (course.compliance_tags || []).join(', ') || 'None' });
        checks.push({ name: 'Pass mark set',     pass: !!course.pass_mark,                           detail: `${course.pass_mark}%` });

        let totalLessons = 0, emptyQuizzes = 0, totalQuizzes = 0;
        for (const mod of (course.modules || [])) {
            for (const lesson of (mod.lessons || [])) {
                totalLessons++;
                for (const quiz of (lesson.quizzes || [])) {
                    totalQuizzes++;
                    if (!quiz.questions || quiz.questions.length === 0) emptyQuizzes++;
                }
            }
        }
        checks.push({ name: 'Total lessons',   pass: totalLessons > 0,   detail: `${totalLessons} lesson(s)` });
        checks.push({ name: 'Quiz questions',  pass: emptyQuizzes === 0, detail: emptyQuizzes === 0 ? `All ${totalQuizzes} quiz(zes) have questions` : `${emptyQuizzes} quiz(zes) missing questions` });

        const passed = checks.filter(c => c.pass).length;
        res.json({ success: true, checks, passed, total: checks.length, ready_to_submit: checks.every(c => c.pass) });
    } catch (err) { next(err); }
};
