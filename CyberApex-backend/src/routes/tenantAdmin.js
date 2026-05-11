'use strict';
const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { requireRole, tenantIsolation } = require('../middleware/rbac');
const c = require('../controllers/tenantAdminController');
const g = require('../controllers/groupController');

// All Tenant Admin routes: JWT + isolation + tenant_admin / super_admin
const ta = [auth.authenticate, tenantIsolation, requireRole('tenant_admin', 'super_admin')];
// Strict admin only
const adminOnly = [auth.authenticate, tenantIsolation, requireRole('tenant_admin', 'super_admin')];

// ── Dashboard ─────────────────────────────────────────────
router.get('/dashboard',              ta, c.getDashboard);

// ── User Management ───────────────────────────────────────
router.get('/users',                  ta, c.getAllUsers);
router.post('/users/create',          adminOnly, c.createUser);
router.put('/users/update',           adminOnly, c.updateUser);
router.delete('/users',               adminOnly, c.deleteUser);
router.post('/users/import',          adminOnly, c.importUsers);
router.post('/users/reset-password',  adminOnly, c.resetUserPassword);

// ── Departments ───────────────────────────────────────────
router.get('/departments',            ta, c.getDepartments);
router.post('/departments/create',    adminOnly, c.createDepartment);
router.put('/departments/update',     adminOnly, c.updateDepartment);
router.delete('/departments',         adminOnly, c.deleteDepartment);

// ── Teams ─────────────────────────────────────────────────
router.get('/teams',                  ta, c.getAllTeams);
router.post('/teams/create',          adminOnly, c.createTeam);

// ── Course Deployment ─────────────────────────────────────
router.post('/courses/assign',        adminOnly, c.assignCourse);
router.get('/courses/assigned',       ta, c.getAssignedCourses);

// ── Training Status ───────────────────────────────────────
router.get('/training-status',        ta, c.getTrainingStatus);

// ── Compliance Frameworks ─────────────────────────────────
router.get('/frameworks',             ta, c.getFrameworkList);
router.post('/frameworks/enable',     adminOnly, c.enableFramework);

// ── Phishing Campaigns ────────────────────────────────────
router.post('/phishing/create',       adminOnly, c.createPhishingCampaign);
router.get('/phishing',               ta, c.getPhishingCampaigns);

// ── Notifications ─────────────────────────────────────────
router.post('/notifications/send',    adminOnly, c.sendNotification);

// ── Activity Tracking ─────────────────────────────────────
router.get('/activity',               ta, c.getActivityLogs);

// ── Reports ───────────────────────────────────────────────
router.get('/reports/training',       ta, c.getTrainingReport);
router.get('/reports/departments',    ta, c.getDeptReport);
router.get('/reports/employees',      ta, c.getEmployeeReport);

// ── Audit Log ─────────────────────────────────────────────
router.get('/audit-log',              ta, c.getAuditLog);

// ── Groups ────────────────────────────────────────────────
router.get('/groups',                          ta, g.listGroups);
router.post('/groups/create',                  adminOnly, g.createGroup);
router.put('/groups/update',                   adminOnly, g.updateGroup);
router.delete('/groups',                       adminOnly, g.deleteGroup);
router.get('/groups/:id/members',              ta, g.getGroupMembers);
router.post('/groups/:id/members',             adminOnly, g.addGroupMembers);
router.delete('/groups/:id/members/:userId',   adminOnly, g.removeGroupMember);
router.post('/groups/:id/assign-course',       adminOnly, g.assignCourseToGroup);
router.delete('/groups/:id/courses/:courseId', adminOnly, g.removeCourseFromGroup);
router.get('/courses',                         ta, g.getTenantCourses);

module.exports = router;
