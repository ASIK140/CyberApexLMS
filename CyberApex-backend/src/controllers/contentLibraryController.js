'use strict';
/**
 * Content Library Controller — switched to Prisma so course IDs match the
 * TenantCourseAssignment FK (PostgreSQL).  The legacy Sequelize Course model
 * used SQLite / a separate "course_id" PK that is invisible to Prisma.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/** Run fn with super-admin RLS bypass */
async function withSA(fn) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_role', 'super_admin', true)`;
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', '00000000-0000-0000-0000-000000000000', true)`;
    return fn(tx);
  });
}

// GET /api/admin/content-library
exports.list = async (req, res) => {
    try {
        const { status, search } = req.query;
        const where = { deletedAt: null };
        if (status) where.status = status.toLowerCase();
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const courses = await withSA((tx) => tx.course.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        }));

        const data = courses.map(c => ({
            course_id:        c.id,            // Prisma UUID — safe for TenantCourseAssignment FK
            course_title:     c.title,
            course_code:      'CYB-' + c.id.substring(0, 6).toUpperCase(),
            audience:         'All Staff',
            duration_minutes: c.durationMinutes || 45,
            cpd_credits:      1.0,
            status:           c.status === 'published' ? 'Published' : c.status,
            frameworks:       [],
            tenants_using:    0,
            created_at:       c.createdAt,
        }));

        res.json({ success: true, count: data.length, data });
    } catch (err) {
        console.error('[contentLibrary.list]', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/admin/content-library/:id
exports.getById = async (req, res) => {
    try {
        const course = await withSA((tx) => tx.course.findUnique({ where: { id: req.params.id } }));
        if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
        res.json({ success: true, data: { ...course, course_id: course.id, course_title: course.title } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/admin/content-library — create course (SA must exist as Prisma user)
exports.create = async (req, res) => {
    try {
        const { course_title, course_code, duration_minutes, frameworks } = req.body;
        if (!course_title) return res.status(400).json({ success: false, message: 'Title required.' });

        const slug = course_title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

        const course = await withSA(async (tx) => {
            const saUser = await tx.user.findFirst({ where: { role: 'super_admin', deletedAt: null } });
            if (!saUser) throw new Error('No super_admin user found to assign as course creator.');
            return tx.course.create({
                data: {
                    title:           course_title,
                    slug,
                    durationMinutes: parseInt(duration_minutes) || 45,
                    status:          'draft',
                    createdBy:       saUser.id,
                },
            });
        });

        res.status(201).json({
            success: true,
            message: 'Course created.',
            data: { ...course, course_id: course.id, course_title: course.title },
        });
    } catch (err) {
        console.error('[contentLibrary.create]', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/admin/content-library/publish
exports.publish = async (req, res) => {
    try {
        const { course_id } = req.body;
        if (!course_id) return res.status(400).json({ success: false, message: 'course_id required.' });
        const course = await withSA((tx) => tx.course.update({
            where: { id: course_id },
            data:  { status: 'published' },
        }));
        res.json({ success: true, message: 'Course published.', data: course });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/admin/content-library/:id/preview
exports.preview = async (req, res) => {
    try {
        const course = await withSA((tx) => tx.course.findUnique({
            where: { id: req.params.id },
            include: { modules: { include: { lessons: true }, orderBy: { orderIndex: 'asc' } } },
        }));
        if (!course) return res.status(404).json({ success: false, message: 'Course not found.' });
        res.json({
            success: true,
            data: {
                course_id:    course.id,
                course_title: course.title,
                description:  course.description || 'Advanced simulation-based training.',
                modules:      course.modules,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/admin/content-library/:id
exports.update = async (req, res) => {
    try {
        const { course_title, duration_minutes } = req.body;
        const course = await withSA((tx) => tx.course.update({
            where: { id: req.params.id },
            data: {
                ...(course_title     ? { title: course_title }                          : {}),
                ...(duration_minutes ? { durationMinutes: parseInt(duration_minutes) }  : {}),
            },
        }));
        res.json({ success: true, message: 'Course updated.', data: { ...course, course_id: course.id } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/admin/content-library/:id
exports.remove = async (req, res) => {
    try {
        await withSA((tx) => tx.course.update({
            where: { id: req.params.id },
            data:  { deletedAt: new Date() },
        }));
        res.json({ success: true, message: 'Course deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.exportData = (req, res) => res.json({ success: true, message: 'Exporting...' });
