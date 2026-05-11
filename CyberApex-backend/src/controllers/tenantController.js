'use strict';
/**
 * Tenant Controller — uses Prisma (not Sequelize) so that:
 *  - Tenant admin users share the same users table as auth.service.ts
 *  - Passwords are Argon2 (compatible with /api/v1/auth/login)
 *  - RLS context is set for every query via withSA()
 */
const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

const PEPPER  = process.env.ARGON2_PEPPER || 'cyberapex-dev-pepper-2026';
const ARGON2_OPTS = { type: argon2.argon2id, memoryCost: 65536, timeCost: 3, parallelism: 4 };

async function hashPw(pw) {
  return argon2.hash(pw + PEPPER, ARGON2_OPTS);
}

/** Run fn inside a transaction with super_admin RLS bypass */
async function withSA(fn) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_role', 'super_admin', true)`;
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', '00000000-0000-0000-0000-000000000000', true)`;
    return fn(tx);
  });
}

/** Map a Prisma tenant row + admin email + seat count to the legacy API shape */
function toApiShape(tenant, adminEmail, seatCount = 0) {
  const planMap = { enterprise: 'Enterprise', professional: 'Professional', starter: 'Starter', trial: 'Trial' };
  const revenueMap = { enterprise: 4200, professional: 1800, starter: 299, trial: 0 };
  const plan = tenant.subscriptionPlan || 'starter';
  return {
    tenant_id:         tenant.id,
    organization_name: tenant.name,
    admin_email:       adminEmail || '',
    plan_type:         planMap[plan] || plan,
    user_limit:        tenant.maxUsers === -1 ? 9999 : tenant.maxUsers,
    seat_count:        seatCount,
    status:            tenant.status,
    monthly_revenue:   revenueMap[plan] || 0,
    created_at:        tenant.createdAt,
    slug:              tenant.slug,
    domain:            tenant.domain,
  };
}

// GET /api/admin/tenants
exports.list = async (req, res) => {
  try {
    const { status, plan_type, search, page = 1, limit = 50 } = req.query;
    const where = { deletedAt: null };
    if (status)    where.status = status;
    if (plan_type) where.subscriptionPlan = plan_type.toLowerCase();

    const [tenants, total] = await withSA(async (tx) => {
      const rows  = await tx.tenant.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * parseInt(limit), take: parseInt(limit) });
      const count = await tx.tenant.count({ where });
      return [rows, count];
    });

    // Enrich with admin email + seat count
    const data = await Promise.all(tenants.map(async (t) => {
      const [admin, seats] = await withSA(async (tx) => {
        const a = await tx.user.findFirst({ where: { tenantId: t.id, role: 'tenant_admin', deletedAt: null }, select: { email: true } });
        const s = await tx.user.count({ where: { tenantId: t.id, deletedAt: null } });
        return [a, s];
      });
      let row = toApiShape(t, admin?.email, seats);
      // Apply search filter on mapped fields
      if (search) {
        const q = search.toLowerCase();
        if (!row.organization_name.toLowerCase().includes(q) && !row.admin_email.toLowerCase().includes(q)) return null;
      }
      return row;
    }));

    res.json({ success: true, data: data.filter(Boolean), meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('[tenantController.list]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/tenants/export
exports.exportTenants = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    const tenants = await withSA((tx) => tx.tenant.findMany({ where: { deletedAt: null }, orderBy: { name: 'asc' } }));

    const ExportUtil = require('../utils/exportUtility');
    const data = tenants.map(t => ({
      org:     t.name,
      plan:    t.subscriptionPlan,
      status:  t.status,
      joined:  new Date(t.createdAt).toLocaleDateString(),
    }));
    const columns = [
      { header: 'Organization', key: 'org',    width: 140 },
      { header: 'Plan',         key: 'plan',   width: 80  },
      { header: 'Status',       key: 'status', width: 70  },
      { header: 'Joined Date',  key: 'joined', width: 90  },
    ];
    const filename = `platform_tenants_${new Date().toISOString().split('T')[0]}`;
    if      (format === 'pdf')   return await ExportUtil.generatePDF(res,   'Active Platform Tenants', columns, data, `${filename}.pdf`);
    else if (format === 'excel') return await ExportUtil.generateExcel(res,  'Active Platform Tenants', columns, data, `${filename}.xlsx`);
    else                         return ExportUtil.generateCSV(res, columns, data, `${filename}.csv`);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/tenants/:id
exports.getById = async (req, res) => {
  try {
    const tenant = await withSA((tx) => tx.tenant.findUnique({ where: { id: req.params.id } }));
    if (!tenant || tenant.deletedAt) return res.status(404).json({ success: false, message: 'Tenant not found.' });

    const admin = await withSA((tx) => tx.user.findFirst({ where: { tenantId: tenant.id, role: 'tenant_admin', deletedAt: null }, select: { email: true, firstName: true, lastName: true } }));
    const seats = await withSA((tx) => tx.user.count({ where: { tenantId: tenant.id, deletedAt: null } }));

    res.json({ success: true, data: toApiShape(tenant, admin?.email, seats) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/tenants — Create tenant + admin user
exports.create = async (req, res) => {
  try {
    const { organization_name, admin_email, admin_name, admin_password, user_limit } = req.body;

    if (!organization_name || !admin_email || !admin_name || !admin_password) {
      return res.status(400).json({ success: false, message: 'organization_name, admin_name, admin_email, and admin_password are required.' });
    }
    if (admin_password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // Check email uniqueness
    const existing = await withSA((tx) => tx.user.findFirst({ where: { email: admin_email.toLowerCase().trim(), deletedAt: null } }));
    if (existing) return res.status(409).json({ success: false, message: 'A user with this email already exists.' });

    // Derive a unique slug from org name
    const baseSlug = organization_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const [firstName, ...rest] = (admin_name || 'Admin').split(' ');
    const lastName = rest.join(' ') || '';
    const passwordHash = await hashPw(admin_password);

    const result = await withSA(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name:             organization_name,
          slug,
          status:           'active',
          subscriptionPlan: 'starter',
          maxUsers:         parseInt(user_limit) || 50,
          createdBy:        req.user?.id ?? null,
        },
      });

      const adminUser = await tx.user.create({
        data: {
          tenantId:     tenant.id,
          email:        admin_email.toLowerCase().trim(),
          passwordHash,
          firstName,
          lastName,
          role:         'tenant_admin',
          status:       'active',
          emailVerified: true,
        },
      });

      return { tenant, adminUser };
    });

    res.status(201).json({
      success: true,
      message: 'Tenant created successfully.',
      data: {
        ...toApiShape(result.tenant, result.adminUser.email, 1),
        admin: { name: admin_name, email: result.adminUser.email },
      },
    });
  } catch (err) {
    console.error('[tenantController.create]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/admin/tenants/:id
exports.update = async (req, res) => {
  try {
    const { organization_name, user_limit, plan_type } = req.body;
    const planMap = { Enterprise: 'enterprise', Professional: 'professional', Starter: 'starter', Trial: 'trial' };

    const tenant = await withSA(async (tx) => {
      const existing = await tx.tenant.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) throw Object.assign(new Error('Tenant not found.'), { status: 404 });
      return tx.tenant.update({
        where: { id: req.params.id },
        data: {
          ...(organization_name && { name: organization_name }),
          ...(user_limit        && { maxUsers: parseInt(user_limit) }),
          ...(plan_type         && { subscriptionPlan: planMap[plan_type] || plan_type.toLowerCase() }),
        },
      });
    });

    res.json({ success: true, message: 'Tenant updated.', data: toApiShape(tenant, null, 0) });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

// PATCH /api/admin/tenants/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['active', 'inactive', 'suspended', 'trial'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status value.' });

    const tenant = await withSA(async (tx) => {
      const existing = await tx.tenant.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) throw Object.assign(new Error('Tenant not found.'), { status: 404 });
      return tx.tenant.update({ where: { id: req.params.id }, data: { status } });
    });

    res.json({ success: true, message: `Tenant status updated to ${status}.`, data: toApiShape(tenant, null, 0) });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/tenants/:id — soft delete
exports.remove = async (req, res) => {
  try {
    await withSA(async (tx) => {
      const existing = await tx.tenant.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.deletedAt) throw Object.assign(new Error('Tenant not found.'), { status: 404 });
      await tx.tenant.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    });
    res.json({ success: true, message: 'Tenant deleted.' });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

// GET /api/admin/tenants/:id/courses
exports.listTenantCourses = async (req, res) => {
  try {
    const assignments = await withSA((tx) =>
      tx.tenantCourseAssignment.findMany({
        where: { tenantId: req.params.id },
        include: {
          course: { select: { id: true, title: true, description: true, status: true, durationMinutes: true } },
        },
        orderBy: { assignedAt: 'desc' },
      })
    );

    res.json({
      success: true,
      total: assignments.length,
      data: assignments.map((a) => ({
        assignment_id: a.id,
        course_id: a.courseId,
        title: a.course?.title,
        description: a.course?.description,
        status: a.course?.status,
        duration_minutes: a.course?.durationMinutes,
        assigned_at: a.assignedAt,
        assigned_by: a.assignedBy,
      })),
    });
  } catch (err) {
    console.error('[tenantController.listTenantCourses]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/tenants/:id/courses
exports.assignCourseToTenant = async (req, res) => {
  try {
    const { course_id } = req.body;
    if (!course_id) return res.status(400).json({ success: false, message: 'course_id is required.' });

    const assignment = await withSA(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: req.params.id } });
      if (!tenant || tenant.deletedAt) throw Object.assign(new Error('Tenant not found.'), { status: 404 });

      const course = await tx.course.findUnique({ where: { id: course_id } });
      if (!course) throw Object.assign(new Error('Course not found.'), { status: 404 });

      return tx.tenantCourseAssignment.upsert({
        where: { tenantId_courseId: { tenantId: req.params.id, courseId: course_id } },
        create: {
          tenantId: req.params.id,
          courseId: course_id,
          assignedBy: req.user?.id || null,
        },
        update: { assignedBy: req.user?.id || null },
      });
    });

    res.status(201).json({
      success: true,
      message: 'Course assigned to tenant.',
      data: { assignment_id: assignment.id, tenant_id: req.params.id, course_id, assigned_at: assignment.assignedAt },
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

// DELETE /api/admin/tenants/:id/courses/:courseId
exports.removeCourseFromTenant = async (req, res) => {
  try {
    await withSA(async (tx) => {
      await tx.tenantCourseAssignment.deleteMany({
        where: { tenantId: req.params.id, courseId: req.params.courseId },
      });
    });
    res.json({ success: true, message: 'Course removed from tenant.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/admin/tenants/:id/reset-password
exports.resetAdminPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters long.' });
    }

    const adminUser = await withSA(async (tx) => {
      const tenant = await tx.tenant.findUnique({ where: { id: req.params.id } });
      if (!tenant || tenant.deletedAt) throw Object.assign(new Error('Tenant not found.'), { status: 404 });
      const u = await tx.user.findFirst({ where: { tenantId: req.params.id, role: 'tenant_admin', deletedAt: null } });
      if (!u) throw Object.assign(new Error('Tenant Admin user not found.'), { status: 404 });
      const passwordHash = await hashPw(newPassword);
      return tx.user.update({ where: { id: u.id }, data: { passwordHash, passwordChangedAt: new Date() } });
    });

    res.json({ success: true, message: `Password for ${adminUser.email} has been reset successfully.` });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};
