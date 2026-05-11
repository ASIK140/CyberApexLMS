'use strict';

// ── Tenant-scoped mock data for Tenant Admin module ───────────────────────────
// All data is keyed by tenant_id. In production, replace with DB queries.

const TENANT_USERS = {
    tenant_001: [
        { id: 'u001', name: 'Alice Johnson',    email: 'alice@acme.com',   dept_id: 'd001', dept: 'Finance',      team_id: 't001', role: 'employee',       status: 'active',   joined: '2024-01-15', risk_score: 72, training_pct: 45, last_login: '2026-03-12' },
        { id: 'u002', name: 'Bob Smith',        email: 'bob@acme.com',     dept_id: 'd001', dept: 'Finance',      team_id: 't001', role: 'employee',       status: 'active',   joined: '2024-02-01', risk_score: 5,  training_pct: 100,last_login: '2026-03-12' },
        { id: 'u003', name: 'Carol Davis',      email: 'carol@acme.com',   dept_id: 'd002', dept: 'IT',           team_id: 't002', role: 'employee',        status: 'active',   joined: '2023-11-10', risk_score: 22, training_pct: 80, last_login: '2026-03-11' },
        { id: 'u004', name: 'Dan Wallace',      email: 'dan@acme.com',     dept_id: 'd003', dept: 'Sales',        team_id: 't003', role: 'employee',       status: 'active',   joined: '2023-09-05', risk_score: 84, training_pct: 30, last_login: '2026-03-10' },
        { id: 'u005', name: 'Eva Brown',        email: 'eva@acme.com',     dept_id: 'd004', dept: 'HR',           team_id: 't004', role: 'employee',       status: 'active',   joined: '2024-03-20', risk_score: 38, training_pct: 65, last_login: '2026-03-09' },
        { id: 'u006', name: 'Frank Lee',        email: 'frank@acme.com',   dept_id: 'd003', dept: 'Sales',        team_id: 't003', role: 'employee',       status: 'inactive', joined: '2023-06-01', risk_score: 91, training_pct: 20, last_login: '2026-03-08' },
        { id: 'u007', name: 'Grace Kim',        email: 'grace@acme.com',   dept_id: 'd005', dept: 'Operations',   team_id: 't005', role: 'employee',       status: 'active',   joined: '2024-04-11', risk_score: 3,  training_pct: 95, last_login: '2026-03-12' },
        { id: 'u008', name: 'Henry Park',       email: 'henry@acme.com',   dept_id: 'd002', dept: 'IT',           team_id: 't002', role: 'employee',       status: 'active',   joined: '2023-12-15', risk_score: 51, training_pct: 55, last_login: '2026-03-11' },
        { id: 'u009', name: 'Iris Chen',        email: 'iris@acme.com',    dept_id: 'd001', dept: 'Finance',      team_id: 't001', role: 'employee',       status: 'active',   joined: '2024-05-08', risk_score: 34, training_pct: 70, last_login: '2026-03-10' },
        { id: 'u010', name: 'Jack Thompson',    email: 'jack@acme.com',    dept_id: 'd004', dept: 'HR',           team_id: 't004', role: 'employee',        status: 'active',   joined: '2023-08-22', risk_score: 78, training_pct: 40, last_login: '2026-03-09' },
        { id: 'u011', name: 'Karen White',      email: 'karen@acme.com',   dept_id: 'd003', dept: 'Sales',        team_id: 't003', role: 'employee',       status: 'active',   joined: '2024-01-28', risk_score: 45, training_pct: 60, last_login: '2026-03-08' },
        { id: 'u012', name: 'Liam Harris',      email: 'liam@acme.com',    dept_id: 'd002', dept: 'IT',           team_id: 't002', role: 'employee',       status: 'active',   joined: '2023-10-14', risk_score: 15, training_pct: 88, last_login: '2026-03-12' },
    ],
};

const TENANT_DEPTS = {
    tenant_001: [
        { id: 'd001', name: 'Finance',    supervisor_id: 'u002', supervisor_name: 'Bob Smith',    employee_count: 3, teams: 1, avg_training: 71, avg_risk: 37  },
        { id: 'd002', name: 'IT',         supervisor_id: 'u003', supervisor_name: 'Carol Davis',  employee_count: 3, teams: 1, avg_training: 74, avg_risk: 29  },
        { id: 'd003', name: 'Sales',      supervisor_id: 'u004', supervisor_name: 'Dan Wallace',  employee_count: 3, teams: 1, avg_training: 37, avg_risk: 73  },
        { id: 'd004', name: 'HR',         supervisor_id: 'u010', supervisor_name: 'Jack Thompson',employee_count: 2, teams: 1, avg_training: 52, avg_risk: 58  },
        { id: 'd005', name: 'Operations', supervisor_id: 'u007', supervisor_name: 'Grace Kim',    employee_count: 1, teams: 1, avg_training: 95, avg_risk: 3   },
    ],
};

const TENANT_TEAMS = {
    tenant_001: [
        { id: 't001', dept_id: 'd001', dept: 'Finance',    team_name: 'Finance Core',      supervisor_id: 'u002', supervisor: 'Bob Smith',    member_count: 3, status: 'active' },
        { id: 't002', dept_id: 'd002', dept: 'IT',         team_name: 'Infrastructure',    supervisor_id: 'u003', supervisor: 'Carol Davis',  member_count: 3, status: 'active' },
        { id: 't003', dept_id: 'd003', dept: 'Sales',      team_name: 'Regional Sales',    supervisor_id: 'u004', supervisor: 'Dan Wallace',  member_count: 3, status: 'active' },
        { id: 't004', dept_id: 'd004', dept: 'HR',         team_name: 'HR Operations',     supervisor_id: 'u010', supervisor: 'Jack Thompson',member_count: 2, status: 'active' },
        { id: 't005', dept_id: 'd005', dept: 'Operations', team_name: 'Ops Core',          supervisor_id: 'u007', supervisor: 'Grace Kim',    member_count: 1, status: 'active' },
    ],
};

const TENANT_ASSIGNMENTS = {
    tenant_001: [
        { id: 'ca001', course_id: 'c001', course_name: 'Phishing & Social Engineering',  assigned_to_type: 'all',        assigned_to: 'All Users',  deadline: '2026-04-01', status: 'active',    enrolled: 12, completed: 7,  overdue: 3 },
        { id: 'ca002', course_id: 'c002', course_name: 'GDPR & Data Protection',         assigned_to_type: 'department', assigned_to: 'Finance',    deadline: '2026-03-25', status: 'active',    enrolled: 3,  completed: 2,  overdue: 1 },
        { id: 'ca003', course_id: 'c003', course_name: 'Password & Access Management',   assigned_to_type: 'all',        assigned_to: 'All Users',  deadline: '2026-05-15', status: 'active',    enrolled: 12, completed: 10, overdue: 0 },
        { id: 'ca004', course_id: 'c004', course_name: 'Business Email Compromise',      assigned_to_type: 'department', assigned_to: 'Sales',      deadline: '2026-03-20', status: 'completed', enrolled: 3,  completed: 3,  overdue: 0 },
        { id: 'ca005', course_id: 'c005', course_name: 'Executive Cyber Threats',        assigned_to_type: 'role',       assigned_to: 'Super Admin', deadline: '2026-04-30', status: 'active',    enrolled: 2,  completed: 0,  overdue: 0 },
    ],
};

const TENANT_FRAMEWORKS = {
    tenant_001: [
        { id: 'f001', framework_name: 'ISO 27001',       enabled: true,  coverage_pct: 78, deadline: '2026-06-01', total_controls: 114, mapped_courses: 14 },
        { id: 'f002', framework_name: 'GDPR',            enabled: true,  coverage_pct: 94, deadline: '2026-04-30', total_controls: 32,  mapped_courses: 8  },
        { id: 'f003', framework_name: 'DORA',            enabled: false, coverage_pct: 0,  deadline: null,         total_controls: 58,  mapped_courses: 22 },
        { id: 'f004', framework_name: 'PCI DSS',         enabled: true,  coverage_pct: 65, deadline: '2026-05-15', total_controls: 45,  mapped_courses: 18 },
        { id: 'f005', framework_name: 'SOC 2',           enabled: false, coverage_pct: 0,  deadline: null,         total_controls: 40,  mapped_courses: 12 },
        { id: 'f006', framework_name: 'NIS2',            enabled: false, coverage_pct: 0,  deadline: null,         total_controls: 50,  mapped_courses: 20 },
        { id: 'f007', framework_name: 'Cyber Essentials',enabled: true,  coverage_pct: 91, deadline: '2026-08-01', total_controls: 18,  mapped_courses: 6  },
    ],
};

const TENANT_PHISHING = {
    tenant_001: [
        { id: 'ph001', campaign_name: 'Q1 IT Support Alert',   template: 'it_support',     audience: 'all',        target_count: 12, status: 'completed', click_rate: 25.0, cred_rate: 8.3,  launch_date: '2026-01-15', completed_at: '2026-01-22' },
        { id: 'ph002', campaign_name: 'Finance Invoice Scam',  template: 'invoice',        audience: 'department', target_count: 3,  status: 'completed', click_rate: 33.3, cred_rate: 0,    launch_date: '2026-02-01', completed_at: '2026-02-08' },
        { id: 'ph003', campaign_name: 'Password Reset Attack', template: 'password_reset', audience: 'all',        target_count: 12, status: 'running',   click_rate: 16.7, cred_rate: null, launch_date: '2026-03-10', completed_at: null },
        { id: 'ph004', campaign_name: 'CEO Urgent Request',    template: 'ceo_fraud',      audience: 'role',       target_count: 2,  status: 'draft',     click_rate: null, cred_rate: null, launch_date: null,         completed_at: null },
    ],
};

const TENANT_ACTIVITY = {
    tenant_001: [
        { log_id: 'act001', user_id: 'u001', user_name: 'Alice Johnson',   dept: 'Finance',  action: 'login',           login_time: '2026-03-12T09:15:00Z', ip: '10.0.1.5',  device: 'Chrome / Windows', session_min: 42, pages: 8  },
        { log_id: 'act002', user_id: 'u002', user_name: 'Bob Smith',       dept: 'Finance',  action: 'course_complete', login_time: '2026-03-12T10:00:00Z', ip: '10.0.1.6',  device: 'Firefox / macOS',  session_min: 65, pages: 12 },
        { log_id: 'act003', user_id: 'u003', user_name: 'Carol Davis',     dept: 'IT',       action: 'login',           login_time: '2026-03-11T08:30:00Z', ip: '10.0.1.7',  device: 'Chrome / Windows', session_min: 28, pages: 5  },
        { log_id: 'act004', user_id: 'u004', user_name: 'Dan Wallace',     dept: 'Sales',    action: 'phishing_click',  login_time: '2026-03-10T14:00:00Z', ip: '10.0.2.8',  device: 'Safari / iOS',     session_min: 15, pages: 3  },
        { log_id: 'act005', user_id: 'u007', user_name: 'Grace Kim',       dept: 'Operations',action:'exam_passed',     login_time: '2026-03-12T11:00:00Z', ip: '10.0.1.9',  device: 'Chrome / Windows', session_min: 90, pages: 20 },
        { log_id: 'act006', user_id: 'u005', user_name: 'Eva Brown',       dept: 'HR',       action: 'login',           login_time: '2026-03-09T09:00:00Z', ip: '10.0.1.10', device: 'Edge / Windows',   session_min: 33, pages: 7  },
        { log_id: 'act007', user_id: 'u006', user_name: 'Frank Lee',       dept: 'Sales',    action: 'credential_submit',login_time:'2026-03-08T16:00:00Z', ip: '10.0.3.20', device: 'Chrome / Android', session_min: 5,  pages: 2  },
    ],
};

const TENANT_AUDIT = {
    tenant_001: [
        { log_id: 'al001', actor: 'admin@acme.com',  role: 'tenant_admin', action: 'USER_CREATED',          target: 'karen@acme.com',      ip: '10.0.0.5', timestamp: '2026-03-12T09:00:00Z', result: 'success' },
        { log_id: 'al002', actor: 'admin@acme.com',  role: 'tenant_admin', action: 'COURSE_ASSIGNED',        target: 'Phishing & SE → All', ip: '10.0.0.5', timestamp: '2026-03-11T14:00:00Z', result: 'success' },
        { log_id: 'al003', actor: 'admin@acme.com',  role: 'tenant_admin', action: 'USER_IMPORT',            target: '12 users (CSV)',       ip: '10.0.0.5', timestamp: '2026-03-10T11:00:00Z', result: 'success' },
        { log_id: 'al004', actor: 'admin@acme.com',  role: 'tenant_admin', action: 'PHISHING_CAMPAIGN_CREATED',target: 'CEO Urgent Request', ip: '10.0.0.5', timestamp: '2026-03-09T10:00:00Z', result: 'success' },
        { log_id: 'al005', actor: 'carol@acme.com',  role: 'employee',      action: 'NOTIFICATION_SENT',      target: 'IT Dept (training)',  ip: '10.0.1.7', timestamp: '2026-03-08T16:00:00Z', result: 'success' },
        { log_id: 'al006', actor: 'unknown@evil.com',role: null,           action: 'AUTH_FAILED',            target: 'auth',                ip: '185.220.10.3', timestamp: '2026-03-07T03:00:00Z', result: 'failure' },
    ],
};

const getUsers    = (tid) => TENANT_USERS[tid]       || TENANT_USERS['tenant_001'];
const getDepts    = (tid) => TENANT_DEPTS[tid]       || TENANT_DEPTS['tenant_001'];
const getTeams    = (tid) => TENANT_TEAMS[tid]       || TENANT_TEAMS['tenant_001'];
const getAssignments=(tid) => TENANT_ASSIGNMENTS[tid]|| TENANT_ASSIGNMENTS['tenant_001'];
const getFrameworks=(tid) => TENANT_FRAMEWORKS[tid]  || TENANT_FRAMEWORKS['tenant_001'];
const getPhishing =(tid) => TENANT_PHISHING[tid]     || TENANT_PHISHING['tenant_001'];
const getActivity =(tid) => TENANT_ACTIVITY[tid]     || TENANT_ACTIVITY['tenant_001'];
const getAuditLogs=(tid) => TENANT_AUDIT[tid]        || TENANT_AUDIT['tenant_001'];

module.exports = { getUsers, getDepts, getTeams, getAssignments, getFrameworks, getPhishing, getActivity, getAuditLogs };
