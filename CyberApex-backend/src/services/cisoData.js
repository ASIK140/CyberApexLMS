'use strict';

// ── Mock Data Store ───────────────────────────────────────────────────────────
// All data is scoped per tenant_id. In production, replace with DB queries.

const MOCK_USERS = {
    tenant_001: [
        { id: 'u001', name: 'Alice Johnson',    email: 'alice@acme.com',   department: 'Finance',      dept_id: 'd001', role: 'employee', phish_clicks: 3, phish_total: 8, training_pct: 45, exam_score: 58, credential_submitted: true,  risk_score: 72, risk_level: 'High',     last_login: '2026-03-12' },
        { id: 'u002', name: 'Bob Smith',        email: 'bob@acme.com',     department: 'Finance',      dept_id: 'd001', role: 'employee', phish_clicks: 0, phish_total: 8, training_pct: 100,exam_score: 92, credential_submitted: false, risk_score: 5,  risk_level: 'Low',      last_login: '2026-03-12' },
        { id: 'u003', name: 'Carol Davis',      email: 'carol@acme.com',   department: 'IT',           dept_id: 'd002', role: 'employee', phish_clicks: 1, phish_total: 8, training_pct: 80, exam_score: 74, credential_submitted: false, risk_score: 22, risk_level: 'Low',      last_login: '2026-03-11' },
        { id: 'u004', name: 'Dan Wallace',      email: 'dan@acme.com',     department: 'Sales',        dept_id: 'd003', role: 'employee', phish_clicks: 4, phish_total: 8, training_pct: 30, exam_score: 45, credential_submitted: true,  risk_score: 84, risk_level: 'Critical', last_login: '2026-03-10' },
        { id: 'u005', name: 'Eva Brown',        email: 'eva@acme.com',     department: 'HR',           dept_id: 'd004', role: 'employee', phish_clicks: 2, phish_total: 8, training_pct: 65, exam_score: 68, credential_submitted: false, risk_score: 38, risk_level: 'Low',      last_login: '2026-03-09' },
        { id: 'u006', name: 'Frank Lee',        email: 'frank@acme.com',   department: 'Sales',        dept_id: 'd003', role: 'employee', phish_clicks: 5, phish_total: 8, training_pct: 20, exam_score: 30, credential_submitted: true,  risk_score: 91, risk_level: 'Critical', last_login: '2026-03-08' },
        { id: 'u007', name: 'Grace Kim',        email: 'grace@acme.com',   department: 'Operations',   dept_id: 'd005', role: 'employee', phish_clicks: 0, phish_total: 8, training_pct: 95, exam_score: 88, credential_submitted: false, risk_score: 3,  risk_level: 'Low',      last_login: '2026-03-12' },
        { id: 'u008', name: 'Henry Park',       email: 'henry@acme.com',   department: 'IT',           dept_id: 'd002', role: 'employee', phish_clicks: 3, phish_total: 8, training_pct: 55, exam_score: 60, credential_submitted: false, risk_score: 51, risk_level: 'Medium',   last_login: '2026-03-11' },
        { id: 'u009', name: 'Iris Chen',        email: 'iris@acme.com',    department: 'Finance',      dept_id: 'd001', role: 'employee', phish_clicks: 2, phish_total: 8, training_pct: 70, exam_score: 72, credential_submitted: false, risk_score: 34, risk_level: 'Low',      last_login: '2026-03-10' },
        { id: 'u010', name: 'Jack Thompson',    email: 'jack@acme.com',    department: 'HR',           dept_id: 'd004', role: 'employee', phish_clicks: 4, phish_total: 8, training_pct: 40, exam_score: 50, credential_submitted: true,  risk_score: 78, risk_level: 'High',     last_login: '2026-03-09' },
    ],
};

const MOCK_DEPARTMENTS = {
    tenant_001: [
        { id: 'd001', name: 'Finance',    employee_count: 3, avg_risk: 37,  phish_click_rate: 28, training_completion: 72 },
        { id: 'd002', name: 'IT',         employee_count: 2, avg_risk: 36,  phish_click_rate: 25, training_completion: 67 },
        { id: 'd003', name: 'Sales',      employee_count: 2, avg_risk: 87,  phish_click_rate: 56, training_completion: 25 },
        { id: 'd004', name: 'HR',         employee_count: 2, avg_risk: 58,  phish_click_rate: 38, training_completion: 52 },
        { id: 'd005', name: 'Operations', employee_count: 1, avg_risk: 3,   phish_click_rate: 0,  training_completion: 95 },
    ],
};

const MOCK_CAMPAIGNS = {
    tenant_001: [
        { id: 'camp_001', campaign_name: 'Q1 2026 — IT Support Alert', template_type: 'it_support',     difficulty: 'medium', audience: 'all',        target_count: 340, status: 'completed', click_rate: 18.4, submitted_rate: 6.2, launch_date: '2026-01-15', completed_at: '2026-01-22' },
        { id: 'camp_002', campaign_name: 'Finance Dept Invoice Fraud',  template_type: 'invoice',       difficulty: 'hard',   audience: 'department', target_count: 45,  status: 'completed', click_rate: 24.1, submitted_rate: 8.9, launch_date: '2026-02-01', completed_at: '2026-02-08' },
        { id: 'camp_003', campaign_name: 'CEO Spear Phishing Test',     template_type: 'ceo_fraud',     difficulty: 'hard',   audience: 'role',       target_count: 12,  status: 'running',   click_rate: 33.3, submitted_rate: null,launch_date: '2026-03-10', completed_at: null },
        { id: 'camp_004', campaign_name: 'HR Password Reset Wave',      template_type: 'password_reset', difficulty: 'easy',   audience: 'all',        target_count: 340, status: 'draft',     click_rate: null, submitted_rate: null,launch_date: null, completed_at: null },
    ],
};

const MOCK_COMPLIANCE = {
    tenant_001: [
        { framework: 'ISO 27001',  coverage_pct: 78, training_required: 14, training_completed: 11, status: 'Compliant',     deadline: '2026-06-01', gap_pct: 22 },
        { framework: 'GDPR',       coverage_pct: 94, training_required: 8,  training_completed: 7,  status: 'Compliant',     deadline: '2026-04-30', gap_pct: 6  },
        { framework: 'DORA',       coverage_pct: 48, training_required: 22, training_completed: 10, status: 'Non-Compliant', deadline: '2026-04-30', gap_pct: 52 },
        { framework: 'PCI DSS',    coverage_pct: 65, training_required: 18, training_completed: 12, status: 'At Risk',       deadline: '2026-05-15', gap_pct: 35 },
        { framework: 'SOC 2',      coverage_pct: 82, training_required: 12, training_completed: 10, status: 'Compliant',     deadline: '2026-07-01', gap_pct: 18 },
        { framework: 'NIS2',       coverage_pct: 56, training_required: 20, training_completed: 11, status: 'At Risk',       deadline: '2026-05-31', gap_pct: 44 },
        { framework: 'Cyber Essentials', coverage_pct: 91, training_required: 6, training_completed: 5, status: 'Compliant', deadline: '2026-08-01', gap_pct: 9 },
    ],
};

const MOCK_COURSES = {
    tenant_001: [
        { course_id: 'course_001', course_name: 'Phishing, Smishing & Vishing',  enrolled: 340, completed: 238, in_progress: 64, not_started: 38, avg_score: 74, pass_rate: 81, overdue: 38, framework_tags: ['ISO27001','DORA','NIST'] },
        { course_id: 'course_002', course_name: 'GDPR & Data Protection',         enrolled: 340, completed: 312, in_progress: 18, not_started: 10, avg_score: 82, pass_rate: 88, overdue: 10, framework_tags: ['GDPR','ISO27001'] },
        { course_id: 'course_003', course_name: 'Business Email Compromise',      enrolled: 340, completed: 180, in_progress: 90, not_started: 70, avg_score: 68, pass_rate: 72, overdue: 70, framework_tags: ['ISO27001','DORA'] },
        { course_id: 'course_004', course_name: 'Executive Targeted Attacks',     enrolled: 12,  completed: 4,   in_progress: 5,  not_started: 3,  avg_score: 71, pass_rate: 67, overdue: 3,  framework_tags: ['ISO27001'] },
        { course_id: 'course_005', course_name: 'Password & Access Security',     enrolled: 340, completed: 295, in_progress: 30, not_started: 15, avg_score: 88, pass_rate: 94, overdue: 15, framework_tags: ['CyberEssentials','NIST'] },
    ],
};

const MOCK_REMEDIAL = {
    tenant_001: [
        { id: 'rem_001', employee_name: 'Dan Wallace',   department: 'Sales',   trigger_event: 'credential_submission', remedial_course: 'Phishing, Smishing & Vishing', assigned_date: '2026-03-10', deadline: '2026-03-24', progress_pct: 20, status: 'in_progress' },
        { id: 'rem_002', employee_name: 'Frank Lee',     department: 'Sales',   trigger_event: 'credential_submission', remedial_course: 'Business Email Compromise',      assigned_date: '2026-03-08', deadline: '2026-03-22', progress_pct: 0,  status: 'pending' },
        { id: 'rem_003', employee_name: 'Alice Johnson', department: 'Finance', trigger_event: 'phishing_click',        remedial_course: 'Phishing, Smishing & Vishing', assigned_date: '2026-03-05', deadline: '2026-03-19', progress_pct: 55, status: 'in_progress' },
        { id: 'rem_004', employee_name: 'Jack Thompson', department: 'HR',      trigger_event: 'exam_failure',          remedial_course: 'GDPR & Data Protection',         assigned_date: '2026-03-01', deadline: '2026-03-15', progress_pct: 0,  status: 'overdue' },
    ],
};

const MOCK_CERTS = {
    tenant_001: [
        { cert_id: 'cert_001', employee_name: 'Bob Smith',   department: 'Finance', course_name: 'GDPR & Data Protection',         score: 92, issued_date: '2026-01-20', expiry_date: '2027-01-20', cpd_hours: 4, status: 'active', framework_tags: ['GDPR','ISO27001'] },
        { cert_id: 'cert_002', employee_name: 'Grace Kim',   department: 'Operations', course_name: 'Phishing, Smishing & Vishing', score: 88, issued_date: '2026-02-10', expiry_date: '2027-02-10', cpd_hours: 3, status: 'active', framework_tags: ['ISO27001'] },
        { cert_id: 'cert_003', employee_name: 'Carol Davis',  department: 'IT',      course_name: 'Password & Access Security',      score: 79, issued_date: '2025-06-01', expiry_date: '2026-06-01', cpd_hours: 2, status: 'expiring_soon', framework_tags: ['CyberEssentials'] },
        { cert_id: 'cert_004', employee_name: 'Iris Chen',   department: 'Finance', course_name: 'GDPR & Data Protection',         score: 84, issued_date: '2025-09-15', expiry_date: '2026-09-15', cpd_hours: 4, status: 'active', framework_tags: ['GDPR'] },
    ],
};

const MOCK_AUDIT_LOGS = {
    tenant_001: [
        { log_id: 'al_001', actor: 'ciso@acme.com', role: 'ciso', action: 'CAMPAIGN_LAUNCHED',      target: 'CEO Spear Phishing Test', ip: '10.0.1.14', timestamp: '2026-03-10T09:00:00Z', result: 'success' },
        { log_id: 'al_002', actor: 'ciso@acme.com', role: 'ciso', action: 'EVIDENCE_PACK_GENERATED', target: 'Q1 2026 Evidence Pack',  ip: '10.0.1.14', timestamp: '2026-03-09T14:30:00Z', result: 'success' },
        { log_id: 'al_003', actor: 'ciso@acme.com', role: 'ciso', action: 'REMEDIAL_ASSIGNED',       target: 'Dan Wallace',            ip: '10.0.1.14', timestamp: '2026-03-10T10:15:00Z', result: 'success' },
        { log_id: 'al_004', actor: 'admin@acme.com', role: 'tenant_admin', action: 'USER_IMPORTED', target: '12 users',               ip: '10.0.1.22', timestamp: '2026-03-08T11:00:00Z', result: 'success' },
        { log_id: 'al_005', actor: 'unknown@evil.com', role: null, action: 'AUTH_FAILED',             target: 'auth',                   ip: '185.220.101.5', timestamp: '2026-03-08T03:00:00Z', result: 'failure' },
    ],
};

// Default users for tenants without mock data
const getUsers = (tenant_id) => MOCK_USERS[tenant_id] || MOCK_USERS['tenant_001'];
const getDepts = (tenant_id) => MOCK_DEPARTMENTS[tenant_id] || MOCK_DEPARTMENTS['tenant_001'];
const getCampaigns = (tenant_id) => MOCK_CAMPAIGNS[tenant_id] || MOCK_CAMPAIGNS['tenant_001'];
const getCompliance = (tenant_id) => MOCK_COMPLIANCE[tenant_id] || MOCK_COMPLIANCE['tenant_001'];
const getCourses = (tenant_id) => MOCK_COURSES[tenant_id] || MOCK_COURSES['tenant_001'];
const getRemedial = (tenant_id) => MOCK_REMEDIAL[tenant_id] || MOCK_REMEDIAL['tenant_001'];
const getCerts = (tenant_id) => MOCK_CERTS[tenant_id] || MOCK_CERTS['tenant_001'];
const getAuditLogs = (tenant_id) => MOCK_AUDIT_LOGS[tenant_id] || MOCK_AUDIT_LOGS['tenant_001'];

module.exports = { getUsers, getDepts, getCampaigns, getCompliance, getCourses, getRemedial, getCerts, getAuditLogs, MOCK_CAMPAIGNS };
