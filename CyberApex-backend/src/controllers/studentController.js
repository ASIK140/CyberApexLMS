'use strict';
/**
 * Individual Student Controller — Prisma (PostgreSQL) only.
 *
 * Individual students are Prisma Users with:
 *   role = 'student'
 *   tenantId = null   (not linked to any tenant)
 *
 * Courses are stored as Enrollment rows (enrollmentType = 'individual').
 * The student portal (/api/student/*) already reads Prisma Enrollments by
 * userId, so login + course visibility works end-to-end.
 */
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();
const PEPPER = process.env.ARGON2_PEPPER || 'cyberapex-dev-pepper-2026';
const ARGON2_OPTS = { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 };

async function hashPw(pw) {
  return argon2.hash(pw + PEPPER, ARGON2_OPTS);
}

async function withSA(fn) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_role', 'super_admin', true)`;
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', '00000000-0000-0000-0000-000000000000', true)`;
    return fn(tx);
  });
}

function toShape(user, enrollments = []) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return {
    student_id:       user.id,
    id:               user.id,
    name,
    email:            user.email,
    phone:            user.phone || null,
    login_id:         user.email,
    service_status:   user.status === 'inactive' ? 'stopped' : 'active',
    status:           user.status,
    assigned_courses: enrollments.map(e => ({
      course_id:    e.courseId,
      course_title: e.course?.title || e.courseId,
      assigned_at:  e.enrolledAt,
      progress:     e.progressPercent || 0,
      status:       e.status,
    })),
    progress:       Object.fromEntries(enrollments.map(e => [e.courseId, e.progressPercent || 0])),
    enrolled_count: enrollments.length,
    last_login:     user.lastLoginAt,
    created_at:     user.createdAt,
  };
}

// ─── GET /api/admin/students/courses-list ────────────────────────────────────
exports.coursesList = async (req, res) => {
  try {
    const courses = await withSA((tx) => tx.course.findMany({
      where: { status: 'published', deletedAt: null },
      select: { id: true, title: true, durationMinutes: true },
      orderBy: { title: 'asc' },
    }));
    const data = courses.map(c => ({
      id:       c.id,
      title:    c.title,
      code:     'CYB-' + c.id.substring(0, 6).toUpperCase(),
      duration: c.durationMinutes || 0,
    }));
    res.json({ success: true, data, total: data.length });
  } catch (err) {
    console.error('[Students] coursesList error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/students ──────────────────────────────────────────────────
exports.list = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 50 } = req.query;
    const where = { role: 'student', tenantId: null, deletedAt: null };
    if (status === 'active')  where.status = 'active';
    if (status === 'stopped') where.status = 'inactive';
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
        { email:     { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await withSA(async (tx) => {
      const u = await tx.user.findMany({
        where,
        include: { enrollments: { include: { course: { select: { id: true, title: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip:  (Number(page) - 1) * Number(limit),
        take:  Number(limit),
      });
      const count = await tx.user.count({ where });
      return [u, count];
    });

    const data = users.map(u => toShape(u, u.enrollments));
    res.json({ success: true, data, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error('[Students] list error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/students/:id ─────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const user = await withSA((tx) => tx.user.findFirst({
      where: { id: req.params.id, role: 'student', tenantId: null, deletedAt: null },
      include: { enrollments: { include: { course: { select: { id: true, title: true } } } } },
    }));
    if (!user) return res.status(404).json({ success: false, message: 'Student not found.' });
    res.json({ success: true, data: toShape(user, user.enrollments) });
  } catch (err) {
    console.error('[Students] getById error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/admin/students ─────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { name, email, phone, password, assigned_courses = [] } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const passwordHash = await hashPw(password);
    const parts        = name.trim().split(/\s+/);
    const firstName    = parts[0];
    const lastName     = parts.slice(1).join(' ') || '';
    const normalEmail  = email.toLowerCase().trim();

    const user = await withSA(async (tx) => {
      const existing = await tx.user.findFirst({ where: { email: normalEmail, deletedAt: null } });
      if (existing) throw Object.assign(new Error('A student with this email already exists.'), { status: 409 });

      const newUser = await tx.user.create({
        data: { email: normalEmail, firstName, lastName, phone: phone || null, passwordHash, role: 'student', status: 'active' },
      });

      for (const cid of assigned_courses) {
        await tx.enrollment.create({
          data: { userId: newUser.id, courseId: cid, enrollmentType: 'individual', status: 'not_started', progressPercent: 0 },
        }).catch(() => null);
      }

      return tx.user.findFirst({
        where: { id: newUser.id },
        include: { enrollments: { include: { course: { select: { id: true, title: true } } } } },
      });
    });

    res.status(201).json({ success: true, message: 'Student created successfully.', data: toShape(user, user.enrollments) });
  } catch (err) {
    console.error('[Students] create error:', err.message);
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

// ─── PUT /api/admin/students/:id ─────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const data = {};
    if (name) {
      const p = name.trim().split(/\s+/);
      data.firstName = p[0];
      data.lastName  = p.slice(1).join(' ') || '';
    }
    if (email) data.email = email.toLowerCase().trim();
    if (phone !== undefined) data.phone = phone;

    const user = await withSA((tx) => tx.user.update({
      where: { id: req.params.id },
      data,
      include: { enrollments: { include: { course: { select: { id: true, title: true } } } } },
    }));
    res.json({ success: true, message: 'Student details updated.', data: toShape(user, user.enrollments) });
  } catch (err) {
    console.error('[Students] update error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/admin/students/:id ──────────────────────────────────────────
exports.deleteOne = async (req, res) => {
  try {
    await withSA((tx) => tx.user.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } }));
    res.json({ success: true, message: 'Student deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/admin/students/bulk-delete ────────────────────────────────────
exports.deleteBulk = async (req, res) => {
  try {
    const { ids = [] } = req.body;
    if (!ids.length) return res.status(400).json({ success: false, message: 'ids array is required.' });
    await withSA((tx) => tx.user.updateMany({
      where: { id: { in: ids }, role: 'student', tenantId: null },
      data:  { deletedAt: new Date() },
    }));
    res.json({ success: true, message: `${ids.length} student(s) deleted.` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH /api/admin/students/:id/stop-service ───────────────────────────────
exports.stopService = async (req, res) => {
  try {
    const user = await withSA((tx) => tx.user.findFirst({ where: { id: req.params.id, role: 'student' } }));
    if (!user) return res.status(404).json({ success: false, message: 'Student not found.' });

    const newStatus = user.status === 'inactive' ? 'active' : 'inactive';
    await withSA((tx) => tx.user.update({ where: { id: req.params.id }, data: { status: newStatus } }));

    res.json({
      success: true,
      message: newStatus === 'inactive'
        ? 'Service stopped. Student can no longer access the LMS.'
        : 'Service restored. Student can now access the LMS.',
      data: { student_id: req.params.id, service_status: newStatus === 'inactive' ? 'stopped' : 'active' },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH /api/admin/students/:id/reset-password ────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { new_password } = req.body;
    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ success: false, message: 'new_password must be at least 6 characters.' });
    }
    const passwordHash = await hashPw(new_password);
    await withSA((tx) => tx.user.update({
      where: { id: req.params.id },
      data:  { passwordHash, passwordChangedAt: new Date() },
    }));
    res.json({ success: true, message: 'Password reset successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/admin/students/:id/assign-course ───────────────────────────────
exports.assignCourse = async (req, res) => {
  try {
    const { course_ids = [] } = req.body;
    if (!course_ids.length) {
      return res.status(400).json({ success: false, message: 'course_ids array is required.' });
    }

    let assigned = 0;
    await withSA(async (tx) => {
      for (const cid of course_ids) {
        const exists = await tx.enrollment.findFirst({ where: { userId: req.params.id, courseId: cid } });
        if (exists) continue;
        await tx.enrollment.create({
          data: { userId: req.params.id, courseId: cid, enrollmentType: 'individual', status: 'not_started', progressPercent: 0 },
        }).catch(() => null);
        assigned++;
      }
    });

    res.json({ success: true, message: `${assigned} course(s) assigned.` });
  } catch (err) {
    console.error('[Students] assignCourse error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/admin/students/:id/courses/:courseId ─────────────────────────
exports.removeCourse = async (req, res) => {
  try {
    const enrollment = await withSA((tx) => tx.enrollment.findFirst({
      where: { userId: req.params.id, courseId: req.params.courseId },
    }));
    if (!enrollment) return res.status(404).json({ success: false, message: 'Course not found in student assignments.' });

    await withSA((tx) => tx.enrollment.delete({ where: { id: enrollment.id } }));
    res.json({ success: true, message: 'Course removed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/admin/students/export ──────────────────────────────────────────
exports.exportAll = (req, res) => res.json({ success: true, message: 'Export not implemented.' });

// ─── GET /api/admin/students/:id/activity-report ─────────────────────────────
exports.exportActivity = (req, res) => res.json({ success: true, message: 'Activity report.' });
