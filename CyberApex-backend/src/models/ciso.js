'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/* ─── Departments ───────────────────────── */
const Department = sequelize.define('Department', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:   { type: DataTypes.UUID, allowNull: false },
    name:        { type: DataTypes.STRING(100), allowNull: false },
    head_user_id:{ type: DataTypes.UUID },
    employee_count: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'departments', underscored: true });

/* ─── Course Modules ────────────────────── */
const CourseModule = sequelize.define('CourseModule', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    course_id:   { type: DataTypes.UUID, allowNull: false },
    tenant_id:   { type: DataTypes.UUID },
    title:       { type: DataTypes.STRING(255), allowNull: false },
    type:        { type: DataTypes.ENUM('video','reading','quiz','exam'), defaultValue: 'video' },
    duration_minutes: { type: DataTypes.INTEGER, defaultValue: 10 },
    order_index: { type: DataTypes.INTEGER, defaultValue: 1 },
}, { tableName: 'course_modules', underscored: true });

/* ─── Course Assignments ────────────────── */
const CourseAssignment = sequelize.define('CourseAssignment', {
    id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:     { type: DataTypes.UUID, allowNull: false },
    user_id:       { type: DataTypes.UUID, allowNull: false },
    course_id:     { type: DataTypes.UUID, allowNull: false },
    assigned_by:   { type: DataTypes.UUID },
    due_date:      { type: DataTypes.DATEONLY },
    is_mandatory:  { type: DataTypes.BOOLEAN, defaultValue: true },
    is_remedial:   { type: DataTypes.BOOLEAN, defaultValue: false },
    status:        { type: DataTypes.ENUM('not_started','in_progress','completed','overdue'), defaultValue: 'not_started' },
}, { tableName: 'course_assignments', underscored: true });

/* ─── Training Progress ─────────────────── */
const TrainingProgress = sequelize.define('TrainingProgress', {
    id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:     { type: DataTypes.UUID, allowNull: false },
    user_id:       { type: DataTypes.UUID, allowNull: false },
    course_id:     { type: DataTypes.UUID, allowNull: false },
    module_id:     { type: DataTypes.UUID },
    completion_pct:{ type: DataTypes.INTEGER, defaultValue: 0 },
    time_spent_min:{ type: DataTypes.INTEGER, defaultValue: 0 },
    last_accessed: { type: DataTypes.DATE },
    completed_at:  { type: DataTypes.DATE },
    status:        { type: DataTypes.ENUM('not_started','in_progress','completed'), defaultValue: 'not_started' },
}, { tableName: 'training_progress', underscored: true });

/* ─── Exam Results ──────────────────────── */
const ExamResult = sequelize.define('ExamResult', {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:    { type: DataTypes.UUID, allowNull: false },
    user_id:      { type: DataTypes.UUID, allowNull: false },
    course_id:    { type: DataTypes.UUID, allowNull: false },
    score:        { type: DataTypes.INTEGER, defaultValue: 0 },
    pass_score:   { type: DataTypes.INTEGER, defaultValue: 70 },
    passed:       { type: DataTypes.BOOLEAN, defaultValue: false },
    attempt_no:   { type: DataTypes.INTEGER, defaultValue: 1 },
    taken_at:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'exam_results', underscored: true });

/* ─── Phishing Campaigns ────────────────── */
const PhishingCampaignCISO = sequelize.define('PhishingCampaignCISO', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:      { type: DataTypes.UUID, allowNull: false },
    created_by:     { type: DataTypes.UUID },
    campaign_name:  { type: DataTypes.STRING(255), allowNull: false },
    template_type:  { type: DataTypes.ENUM('it_support','password_reset','invoice','delivery','hr_update','ceo_fraud'), defaultValue: 'it_support' },
    difficulty:     { type: DataTypes.ENUM('easy','medium','hard'), defaultValue: 'medium' },
    audience:       { type: DataTypes.ENUM('all','department','role','custom'), defaultValue: 'all' },
    audience_filter:{ type: DataTypes.JSON },
    target_count:   { type: DataTypes.INTEGER, defaultValue: 0 },
    status:         { type: DataTypes.ENUM('draft','scheduled','running','completed','paused'), defaultValue: 'draft' },
    launch_date:    { type: DataTypes.DATE },
    completed_at:   { type: DataTypes.DATE },
}, { tableName: 'phishing_campaigns_ciso', underscored: true });

/* ─── Phishing Emails ───────────────────── */
const PhishingEmail = sequelize.define('PhishingEmail', {
    id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:       { type: DataTypes.UUID, allowNull: false },
    campaign_id:     { type: DataTypes.UUID, allowNull: false },
    user_id:         { type: DataTypes.UUID, allowNull: false },
    sent_at:         { type: DataTypes.DATE },
    opened_at:       { type: DataTypes.DATE },
    clicked_at:      { type: DataTypes.DATE },
    credential_submitted_at: { type: DataTypes.DATE },
    reported_at:     { type: DataTypes.DATE },
    status:          { type: DataTypes.ENUM('sent','opened','clicked','credential_submitted','reported'), defaultValue: 'sent' },
}, { tableName: 'phishing_emails', underscored: true });

/* ─── Phishing Results ──────────────────── */
const PhishingResult = sequelize.define('PhishingResult', {
    id:                   { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:            { type: DataTypes.UUID, allowNull: false },
    campaign_id:          { type: DataTypes.UUID, allowNull: false },
    emails_sent:          { type: DataTypes.INTEGER, defaultValue: 0 },
    emails_opened:        { type: DataTypes.INTEGER, defaultValue: 0 },
    links_clicked:        { type: DataTypes.INTEGER, defaultValue: 0 },
    credentials_submitted:{ type: DataTypes.INTEGER, defaultValue: 0 },
    reported_phishing:    { type: DataTypes.INTEGER, defaultValue: 0 },
    click_rate_pct:       { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
    credential_rate_pct:  { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
}, { tableName: 'phishing_results', underscored: true });

/* ─── Remedial Assignments ──────────────── */
const RemedialAssignment = sequelize.define('RemedialAssignment', {
    id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:       { type: DataTypes.UUID, allowNull: false },
    employee_id:     { type: DataTypes.UUID, allowNull: false },
    trigger_event:   { type: DataTypes.ENUM('phishing_click','credential_submission','exam_failure','overdue_training'), allowNull: false },
    remedial_course_id: { type: DataTypes.UUID, allowNull: false },
    assigned_by:     { type: DataTypes.UUID },
    assigned_date:   { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    deadline:        { type: DataTypes.DATEONLY },
    progress_pct:    { type: DataTypes.INTEGER, defaultValue: 0 },
    status:          { type: DataTypes.ENUM('pending','in_progress','completed','overdue'), defaultValue: 'pending' },
}, { tableName: 'remedial_assignments', underscored: true });

/* ─── Compliance Frameworks ─────────────── */
const ComplianceFramework = sequelize.define('ComplianceFramework', {
    id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:       { type: DataTypes.UUID },
    name:            { type: DataTypes.STRING(100), allowNull: false },
    description:     { type: DataTypes.TEXT },
    version:         { type: DataTypes.STRING(20) },
    effective_date:  { type: DataTypes.DATEONLY },
    total_controls:  { type: DataTypes.INTEGER, defaultValue: 0 },
    status:          { type: DataTypes.ENUM('active','inactive'), defaultValue: 'active' },
}, { tableName: 'compliance_frameworks', underscored: true });

/* ─── Framework Controls ────────────────── */
const FrameworkControl = sequelize.define('FrameworkControl', {
    id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    framework_id:    { type: DataTypes.UUID, allowNull: false },
    tenant_id:       { type: DataTypes.UUID },
    control_id:      { type: DataTypes.STRING(50) },
    title:           { type: DataTypes.STRING(255), allowNull: false },
    description:     { type: DataTypes.TEXT },
    priority:        { type: DataTypes.ENUM('critical','high','medium','low'), defaultValue: 'medium' },
    training_required: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'framework_controls', underscored: true });

/* ─── Framework Course Mapping ──────────── */
const FrameworkCourseMapping = sequelize.define('FrameworkCourseMapping', {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    framework_id: { type: DataTypes.UUID, allowNull: false },
    control_id:   { type: DataTypes.UUID, allowNull: false },
    course_id:    { type: DataTypes.UUID, allowNull: false },
    tenant_id:    { type: DataTypes.UUID },
    weight:       { type: DataTypes.DECIMAL(5,2), defaultValue: 1.0 },
}, { tableName: 'framework_course_mapping', underscored: true });

/* ─── Risk Scores ───────────────────────── */
const RiskScore = sequelize.define('RiskScore', {
    id:                     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:              { type: DataTypes.UUID, allowNull: false },
    user_id:                { type: DataTypes.UUID, allowNull: false },
    department_id:          { type: DataTypes.UUID },
    risk_score:             { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
    risk_level:             { type: DataTypes.ENUM('Low','Medium','High','Critical'), defaultValue: 'Low' },
    phish_click_score:      { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
    training_incomplete_score: { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
    exam_failure_score:     { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
    credential_submit_score: { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
    calculated_at:          { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'risk_scores', underscored: true });

/* ─── Risk Events ───────────────────────── */
const RiskEvent = sequelize.define('RiskEvent', {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:    { type: DataTypes.UUID, allowNull: false },
    user_id:      { type: DataTypes.UUID, allowNull: false },
    event_type:   { type: DataTypes.ENUM('phishing_click','credential_submission','exam_failure','training_overdue','report_submitted'), allowNull: false },
    severity:     { type: DataTypes.ENUM('critical','high','medium','low'), defaultValue: 'medium' },
    description:  { type: DataTypes.TEXT },
    occurred_at:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    resolved:     { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'risk_events', underscored: true });

/* ─── Exports ───────────────────────────── */
const Export = sequelize.define('Export', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:   { type: DataTypes.UUID, allowNull: false },
    requested_by:{ type: DataTypes.UUID },
    type:        { type: DataTypes.ENUM('board_report','evidence_pack','audit_log','training_report','certificate_report'), allowNull: false },
    format:      { type: DataTypes.ENUM('pdf','csv','excel','zip'), defaultValue: 'pdf' },
    status:      { type: DataTypes.ENUM('pending','processing','completed','failed'), defaultValue: 'pending' },
    file_url:    { type: DataTypes.STRING(1000) },
    file_size_kb:{ type: DataTypes.INTEGER },
    expires_at:  { type: DataTypes.DATE },
}, { tableName: 'exports', underscored: true });

module.exports = {
    Department, CourseModule, CourseAssignment, TrainingProgress, ExamResult,
    PhishingCampaignCISO, PhishingEmail, PhishingResult,
    RemedialAssignment, ComplianceFramework, FrameworkControl, FrameworkCourseMapping,
    RiskScore, RiskEvent, Export,
};
