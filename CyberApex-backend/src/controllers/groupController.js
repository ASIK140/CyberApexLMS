'use strict';
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/** Super-admin bypass for cross-tenant reads */
async function withSA(fn) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_role', 'super_admin', true)`;
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', '00000000-0000-0000-0000-000000000000', true)`;
    return fn(tx);
  });
}

/** Extract tenant ID from request */
function getTenantId(req) {
  if (req.user && req.user.role === 'super_admin') {
    return req.query.tenant_id || req.body?.tenant_id || null;
  }
  return req.tenantId || req.user?.tenantId || req.user?.tenant_id || null;
}

/* ── 1. GET /api/tenant/groups ───────────────────────────── */
const listGroups = async (req, res) => {
  try {
    const tid = getTenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: 'tenant_id required.' });

    const groups = await withSA((tx) =>
      tx.userGroup.findMany({
        where: { tenantId: tid },
        include: {
          members: { select: { id: true } },
          courses: {
            include: {
              course: { select: { id: true, title: true, status: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    );

    const data = groups.map((g) => ({
      group_id: g.id,
      name: g.name,
      description: g.description,
      member_count: g.members.length,
      courses: g.courses.map((gc) => ({
        course_id: gc.courseId,
        title: gc.course?.title,
        status: gc.course?.status,
        assigned_at: gc.assignedAt,
      })),
      created_at: g.createdAt,
      updated_at: g.updatedAt,
    }));

    res.json({ success: true, total: data.length, data });
  } catch (err) {
    console.error('[groupController.listGroups]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── 2. POST /api/tenant/groups/create ──────────────────── */
const createGroup = async (req, res) => {
  try {
    const tid = getTenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: 'tenant_id required.' });

    const { name, description } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'name is required.' });

    const group = await withSA((tx) =>
      tx.userGroup.create({
        data: {
          tenantId: tid,
          name,
          description: description || null,
          createdBy: req.user?.id || null,
        },
      })
    );

    res.status(201).json({
      success: true,
      message: 'Group created.',
      data: {
        group_id: group.id,
        name: group.name,
        description: group.description,
        member_count: 0,
        courses: [],
        created_at: group.createdAt,
      },
    });
  } catch (err) {
    console.error('[groupController.createGroup]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── 3. PUT /api/tenant/groups/update?group_id=X ─────────── */
const updateGroup = async (req, res) => {
  try {
    const tid = getTenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: 'tenant_id required.' });

    const { group_id } = req.query;
    if (!group_id) return res.status(400).json({ success: false, message: 'group_id is required.' });

    const { name, description } = req.body;

    const group = await withSA(async (tx) => {
      const existing = await tx.userGroup.findFirst({ where: { id: group_id, tenantId: tid } });
      if (!existing) throw Object.assign(new Error('Group not found.'), { status: 404 });
      return tx.userGroup.update({
        where: { id: group_id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
        },
      });
    });

    res.json({ success: true, message: 'Group updated.', data: { group_id: group.id, name: group.name, description: group.description } });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/* ── 4. DELETE /api/tenant/groups?group_id=X ─────────────── */
const deleteGroup = async (req, res) => {
  try {
    const tid = getTenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: 'tenant_id required.' });

    const { group_id } = req.query;
    if (!group_id) return res.status(400).json({ success: false, message: 'group_id is required.' });

    await withSA(async (tx) => {
      const existing = await tx.userGroup.findFirst({ where: { id: group_id, tenantId: tid } });
      if (!existing) throw Object.assign(new Error('Group not found.'), { status: 404 });
      await tx.userGroup.delete({ where: { id: group_id } });
    });

    res.json({ success: true, message: `Group ${group_id} deleted.` });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/* ── 5. GET /api/tenant/groups/:id/members ───────────────── */
const getGroupMembers = async (req, res) => {
  try {
    const tid = getTenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: 'tenant_id required.' });

    const { id: groupId } = req.params;

    const members = await withSA(async (tx) => {
      const group = await tx.userGroup.findFirst({ where: { id: groupId, tenantId: tid } });
      if (!group) throw Object.assign(new Error('Group not found.'), { status: 404 });
      return tx.groupMember.findMany({
        where: { groupId },
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true, department: true, role: true, status: true },
          },
        },
        orderBy: { addedAt: 'desc' },
      });
    });

    res.json({
      success: true,
      total: members.length,
      data: members.map((m) => ({
        member_id: m.id,
        user_id: m.userId,
        name: `${m.user.firstName} ${m.user.lastName}`.trim(),
        email: m.user.email,
        department: m.user.department,
        role: m.user.role,
        status: m.user.status,
        added_at: m.addedAt,
      })),
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/* ── 6. POST /api/tenant/groups/:id/members ──────────────── */
const addGroupMembers = async (req, res) => {
  try {
    const tid = getTenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: 'tenant_id required.' });

    const { id: groupId } = req.params;
    const { user_ids = [] } = req.body;
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'user_ids array is required.' });
    }

    const result = await withSA(async (tx) => {
      const group = await tx.userGroup.findFirst({
        where: { id: groupId, tenantId: tid },
        include: { courses: { select: { courseId: true } } },
      });
      if (!group) throw Object.assign(new Error('Group not found.'), { status: 404 });

      let added = 0;
      for (const userId of user_ids) {
        try {
          await tx.groupMember.create({ data: { groupId, userId } });
          added++;
        } catch {
          // Already a member — skip
        }
      }

      // Auto-enroll new members in courses already assigned to this group
      const courseIds = group.courses.map((gc) => gc.courseId);
      for (const userId of user_ids) {
        for (const courseId of courseIds) {
          try {
            await tx.enrollment.upsert({
              where: { userId_courseId: { userId, courseId } },
              create: {
                userId,
                courseId,
                tenantId: tid,
                enrollmentType: 'auto_compliance',
                status: 'not_started',
                enrolledBy: req.user?.id || null,
              },
              update: {},
            });
          } catch { /* Skip */ }
        }
      }

      return added;
    });

    res.status(201).json({ success: true, message: `${result} member(s) added to group.` });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/* ── 7. DELETE /api/tenant/groups/:id/members/:userId ─────── */
const removeGroupMember = async (req, res) => {
  try {
    const tid = getTenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: 'tenant_id required.' });

    const { id: groupId, userId } = req.params;

    await withSA(async (tx) => {
      const group = await tx.userGroup.findFirst({ where: { id: groupId, tenantId: tid } });
      if (!group) throw Object.assign(new Error('Group not found.'), { status: 404 });

      const member = await tx.groupMember.findFirst({ where: { groupId, userId } });
      if (!member) throw Object.assign(new Error('User is not a member of this group.'), { status: 404 });

      await tx.groupMember.delete({ where: { id: member.id } });
    });

    res.json({ success: true, message: `User ${userId} removed from group.` });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/* ── 8. POST /api/tenant/groups/:id/assign-course ────────── */
const assignCourseToGroup = async (req, res) => {
  try {
    const tid = getTenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: 'tenant_id required.' });

    const { id: groupId } = req.params;
    const { course_id, deadline } = req.body;
    if (!course_id) return res.status(400).json({ success: false, message: 'course_id is required.' });

    const dueDate = deadline ? new Date(deadline) : null;

    const enrolledCount = await withSA(async (tx) => {
      // Verify the group belongs to this tenant
      const group = await tx.userGroup.findFirst({
        where: { id: groupId, tenantId: tid },
        include: { members: { select: { userId: true } } },
      });
      if (!group) throw Object.assign(new Error('Group not found.'), { status: 404 });

      // Verify course is assigned to this tenant
      const tenantCourse = await tx.tenantCourseAssignment.findFirst({
        where: { tenantId: tid, courseId: course_id },
      });
      if (!tenantCourse) {
        throw Object.assign(new Error('Course is not assigned to this tenant. Ask Super Admin to assign it first.'), { status: 403 });
      }

      // Create GroupCourseAssignment (upsert to avoid duplicates)
      await tx.groupCourseAssignment.upsert({
        where: { groupId_courseId: { groupId, courseId: course_id } },
        create: { groupId, courseId: course_id, assignedBy: req.user?.id || null },
        update: { assignedBy: req.user?.id || null },
      });

      // Auto-enroll all current group members
      let count = 0;
      for (const { userId } of group.members) {
        try {
          await tx.enrollment.upsert({
            where: { userId_courseId: { userId, courseId: course_id } },
            create: {
              userId,
              courseId: course_id,
              tenantId: tid,
              enrollmentType: 'auto_compliance',
              status: 'not_started',
              dueDate,
              enrolledBy: req.user?.id || null,
            },
            update: { dueDate, enrolledBy: req.user?.id || null },
          });
          count++;
        } catch { /* Skip */ }
      }
      return count;
    });

    res.status(201).json({
      success: true,
      message: `Course assigned to group. ${enrolledCount} member(s) enrolled.`,
      data: { group_id: groupId, course_id, enrolled_count: enrolledCount, deadline },
    });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/* ── 9. DELETE /api/tenant/groups/:id/courses/:courseId ───── */
const removeCourseFromGroup = async (req, res) => {
  try {
    const tid = getTenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: 'tenant_id required.' });

    const { id: groupId, courseId } = req.params;

    await withSA(async (tx) => {
      const group = await tx.userGroup.findFirst({ where: { id: groupId, tenantId: tid } });
      if (!group) throw Object.assign(new Error('Group not found.'), { status: 404 });

      await tx.groupCourseAssignment.deleteMany({ where: { groupId, courseId } });
    });

    res.json({ success: true, message: `Course ${courseId} removed from group.` });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

/* ── 10. GET /api/tenant/courses ─────────────────────────── */
const getTenantCourses = async (req, res) => {
  try {
    const tid = getTenantId(req);
    if (!tid) return res.status(400).json({ success: false, message: 'tenant_id required.' });

    const assignments = await withSA((tx) =>
      tx.tenantCourseAssignment.findMany({
        where: { tenantId: tid },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              status: true,
              durationMinutes: true,
              thumbnailUrl: true,
              enrollments: {
                where: { tenantId: tid },
                select: { status: true, progressPercent: true },
              },
            },
          },
        },
        orderBy: { assignedAt: 'desc' },
      })
    );

    const data = assignments.map((a) => {
      const enrollments = a.course?.enrollments || [];
      const total = enrollments.length;
      const completed = enrollments.filter((e) => e.status === 'completed').length;
      return {
        assignment_id: a.id,
        course_id: a.courseId,
        title: a.course?.title,
        description: a.course?.description,
        status: a.course?.status,
        duration_minutes: a.course?.durationMinutes,
        thumbnail_url: a.course?.thumbnailUrl,
        assigned_at: a.assignedAt,
        enrollment_stats: {
          total,
          completed,
          in_progress: enrollments.filter((e) => e.status === 'in_progress').length,
          not_started: enrollments.filter((e) => e.status === 'not_started').length,
          completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
        },
      };
    });

    res.json({ success: true, total: data.length, data });
  } catch (err) {
    console.error('[groupController.getTenantCourses]', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getGroupMembers,
  addGroupMembers,
  removeGroupMember,
  assignCourseToGroup,
  removeCourseFromGroup,
  getTenantCourses,
};
