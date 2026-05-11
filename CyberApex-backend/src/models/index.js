'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { encrypt, decrypt } = require('../utils/encryption');

/* ─── Users ─────────────────────────────── */
const User = sequelize.define('User', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name:      { type: DataTypes.STRING(255), allowNull: false },
    email:     { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password:  { type: DataTypes.STRING(255), allowNull: false },
    role:      { type: DataTypes.ENUM('super_admin', 'tenant_admin', 'ciso', 'employee'), defaultValue: 'employee' },
    tenant_id: { type: DataTypes.STRING(100), allowNull: true },
    status:    { type: DataTypes.ENUM('active','inactive','suspended'), defaultValue: 'active' },
}, { tableName: 'users', underscored: true });

// --- User Encryption Hooks ---
// TEMPORARILY DISABLED FOR DEBUGGING
User.beforeSave(async (user) => {
    if (user.changed('email')) {
        // DISABLED: user.email = encrypt(user.email);
    }
});

User.afterFind(async (results) => {
    if (!results) return;
    const items = Array.isArray(results) ? results : [results];
    items.forEach(item => {
        if (item.email) {
            // DISABLED: item.email = decrypt(item.email);
        }
    });
});

/* ─── Tenants ───────────────────────────── */
const Tenant = sequelize.define('Tenant', {
    tenant_id:            { type: DataTypes.STRING(50), primaryKey: true },
    organization_name:    { type: DataTypes.STRING(255), allowNull: false },
    industry:             { type: DataTypes.STRING(100) },
    admin_email:          { type: DataTypes.STRING(255), allowNull: false },
    plan_type:            { type: DataTypes.ENUM('Starter','Professional','Enterprise'), defaultValue: 'Starter' },
    user_limit:           { type: DataTypes.INTEGER, defaultValue: 50 },
    subscription_status:  { type: DataTypes.ENUM('active','trial','suspended','cancelled'), defaultValue: 'trial' },
    status:               { type: DataTypes.ENUM('active','inactive','trial'), defaultValue: 'trial' },
    seat_count:           { type: DataTypes.INTEGER, defaultValue: 0 },
    monthly_revenue:      { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
    assigned_courses:     { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    secondary_email:      { type: DataTypes.STRING(255) },
}, { tableName: 'tenants', underscored: true });

// --- Tenant Encryption Hooks ---
// TEMPORARILY DISABLED FOR DEBUGGING
Tenant.beforeSave(async (tenant) => {
    if (tenant.changed('organization_name')) {
        // DISABLED: tenant.organization_name = encrypt(tenant.organization_name);
    }
    if (tenant.changed('admin_email')) {
        // DISABLED: tenant.admin_email = encrypt(tenant.admin_email);
    }
    if (tenant.changed('secondary_email') && tenant.secondary_email) {
        // DISABLED: tenant.secondary_email = encrypt(tenant.secondary_email);
    }
});

Tenant.afterFind(async (results) => {
    if (!results) return;
    const items = Array.isArray(results) ? results : [results];
    items.forEach(item => {
        if (item.organization_name) {
            // DISABLED: item.organization_name = decrypt(item.organization_name);
        }
        if (item.admin_email) {
            // DISABLED: item.admin_email = decrypt(item.admin_email);
        }
        if (item.secondary_email) {
            // DISABLED: item.secondary_email = decrypt(item.secondary_email);
        }
    });
});

/* ─── Individual Students ───────────────── */
const IndividualStudent = sequelize.define('IndividualStudent', {
    student_id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name:             { type: DataTypes.STRING(255), allowNull: false },
    email:            { type: DataTypes.STRING(255), allowNull: false, unique: true },
    phone:            { type: DataTypes.STRING(30) },
    login_id:         { type: DataTypes.STRING(100), allowNull: false, unique: true },
    password_hash:    { type: DataTypes.STRING(255), allowNull: false },
    assigned_courses: { type: DataTypes.JSON, defaultValue: [] },  // array of { course_id, course_title, assigned_at }
    progress:         { type: DataTypes.JSON, defaultValue: {} },  // { [course_id]: percent_complete }
    service_status:   { type: DataTypes.ENUM('active', 'stopped'), defaultValue: 'active' },
    last_login:       { type: DataTypes.DATE },
    created_by:       { type: DataTypes.STRING(100), defaultValue: 'super_admin' },
}, { tableName: 'individual_students', underscored: true });

/* ─── Courses ───────────────────────────── */
const Course = sequelize.define('Course', {
    course_id:       { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title:           { type: DataTypes.STRING(255), allowNull: false },
    description:     { type: DataTypes.TEXT },
    category:        { type: DataTypes.STRING(100) },
    framework_tags:  { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    difficulty_level:{ type: DataTypes.ENUM('beginner','intermediate','advanced'), defaultValue: 'beginner' },
    status:          { type: DataTypes.ENUM('draft','published','archived'), defaultValue: 'draft' },
    created_by:      { type: DataTypes.STRING(255) },
}, { tableName: 'courses', underscored: true });

/* ─── Training Records ──────────────────── */
const TrainingRecord = sequelize.define('TrainingRecord', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id:     { type: DataTypes.UUID, allowNull: false },
    course_id:   { type: DataTypes.UUID, allowNull: false },
    tenant_id:   { type: DataTypes.STRING(50) },
    status:      { type: DataTypes.ENUM('not_started','in_progress','completed'), defaultValue: 'not_started' },
    score:       { type: DataTypes.INTEGER },
    completed_at:{ type: DataTypes.DATE },
}, { tableName: 'training_records', underscored: true });

/* ─── Certificates ──────────────────────── */
const Certificate = sequelize.define('Certificate', {
    certificate_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id:        { type: DataTypes.UUID, allowNull: false },
    course_id:      { type: DataTypes.UUID, allowNull: false },
    tenant_id:      { type: DataTypes.STRING(50) },
    issued_at:      { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    expires_at:     { type: DataTypes.DATE },
    certificate_url:{ type: DataTypes.STRING(1000) },
    status:         { type: DataTypes.ENUM('active','expired','revoked'), defaultValue: 'active' },
}, { tableName: 'certificates', underscored: true });

/* ─── Phishing Campaigns ────────────────── */
const PhishingCampaign = sequelize.define('PhishingCampaign', {
    campaign_id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:             { type: DataTypes.STRING(50), allowNull: false },
    name:                  { type: DataTypes.STRING(255), allowNull: false },
    type:                  { type: DataTypes.STRING(50), defaultValue: 'Email Phishing' },
    template_id:           { type: DataTypes.STRING(100) },
    status:                { type: DataTypes.ENUM('Draft','Scheduled','Running','Complete'), defaultValue: 'Draft' },
    scheduled_at:          { type: DataTypes.DATE },
    sent_at:               { type: DataTypes.DATE },
    started_at:            { type: DataTypes.DATE },
    completed_at:          { type: DataTypes.DATE },
    // Derived aggregates
    emails_sent:           { type: DataTypes.INTEGER, defaultValue: 0 },
    emails_clicked:        { type: DataTypes.INTEGER, defaultValue: 0 },
    credentials_submitted: { type: DataTypes.INTEGER, defaultValue: 0 },
    reported_count:        { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'phishing_campaigns', underscored: true });

const PhishingTemplate = sequelize.define('PhishingTemplate', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    campaign_id: { type: DataTypes.UUID, allowNull: false },
    subject:     { type: DataTypes.STRING(500) },
    body:        { type: DataTypes.TEXT },
    red_flags:   { type: DataTypes.JSON, defaultValue: [] },
}, { tableName: 'phishing_templates', underscored: true });

const PhishingLandingPage = sequelize.define('PhishingLandingPage', {
    id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    campaign_id:   { type: DataTypes.UUID, allowNull: false },
    type:          { type: DataTypes.STRING(100) },
    template_name: { type: DataTypes.STRING(100) },
    redirect_url:  { type: DataTypes.STRING(1000) },
}, { tableName: 'phishing_landing_pages', underscored: true });

// ─── Phase V: Email Templates Module ─────────────────────────────────────────

const EmailTemplate = sequelize.define('EmailTemplate', {
    id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:     { type: DataTypes.STRING(50), allowNull: false },
    name:          { type: DataTypes.STRING(255), allowNull: false },
    type:          { type: DataTypes.ENUM('Awareness', 'Overdue', 'Certificate', 'Welcome', 'Simulation', 'Custom'), defaultValue: 'Custom' },
    subject:       { type: DataTypes.STRING(500), allowNull: false },
    from_name:     { type: DataTypes.STRING(255) },
    from_email:    { type: DataTypes.STRING(255) },
    body_html:     { type: DataTypes.TEXT, allowNull: false },
    body_text:     { type: DataTypes.TEXT },
}, { tableName: 'email_templates', underscored: true });

const TemplateUsage = sequelize.define('TemplateUsage', {
    id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    template_id:   { type: DataTypes.UUID, allowNull: false },
    used_in:       { type: DataTypes.STRING(255), allowNull: false }, // e.g., campaign ID, course ID
    used_type:     { type: DataTypes.ENUM('campaign', 'training', 'automation', 'system'), allowNull: false },
}, { tableName: 'template_usages', underscored: true });

// ─── Phase VIII: SSO Configuration Module ───────────────────────────────────

const SsoConfig = sequelize.define('SsoConfig', {
    id:                   { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:            { type: DataTypes.STRING(50), allowNull: false, unique: true },
    provider:             { type: DataTypes.STRING(100), defaultValue: 'Microsoft Entra ID' },
    protocol:             { type: DataTypes.STRING(50), defaultValue: 'SAML 2.0' },
    entity_id:            { type: DataTypes.TEXT },
    sso_url:              { type: DataTypes.TEXT },
    certificate:          { type: DataTypes.TEXT },
    certificate_expiry:   { type: DataTypes.DATEONLY },
    jit_enabled:          { type: DataTypes.BOOLEAN, defaultValue: true },
    mfa_required:         { type: DataTypes.BOOLEAN, defaultValue: false },
    status:               { type: DataTypes.STRING(20), defaultValue: 'active' },
    active_users:         { type: DataTypes.INTEGER, defaultValue: 0 },
    last_login:           { type: DataTypes.DATE },
}, { tableName: 'sso_configs', underscored: true });

const ScimConfig = sequelize.define('ScimConfig', {
    id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:       { type: DataTypes.STRING(50), allowNull: false, unique: true },
    base_url:        { type: DataTypes.TEXT },
    token:           { type: DataTypes.TEXT },
    status:          { type: DataTypes.STRING(20), defaultValue: 'enabled' },
    group_sync:      { type: DataTypes.BOOLEAN, defaultValue: true },
    last_sync:       { type: DataTypes.DATE },
    users_provisioned: { type: DataTypes.INTEGER, defaultValue: 0 },
    sync_errors:     { type: DataTypes.INTEGER, defaultValue: 0 },
    deprovisioned:   { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'scim_configs', underscored: true });

const ScimLog = sequelize.define('ScimLog', {
    id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:     { type: DataTypes.STRING(50), allowNull: false },
    event_type:    { type: DataTypes.STRING(50) }, // CREATE, UPDATE, DELETE, SYNC, DIAGNOSTIC
    status:        { type: DataTypes.STRING(20) }, // success, error, warning
    message:       { type: DataTypes.TEXT },
    error_message: { type: DataTypes.TEXT },
    timestamp:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'scim_logs', underscored: true });

// ─── Phase IX: Integrations Hub ──────────────────────────────────────
const Integration = sequelize.define('Integration', {
    id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:     { type: DataTypes.STRING(50), allowNull: false },
    provider_name: { type: DataTypes.STRING(100), allowNull: false }, // Microsoft 365, BambooHR, Slack, etc.
    type:          { type: DataTypes.STRING(50) },                    // IAM, HRMS, Messaging, ITSM
    status:        { type: DataTypes.STRING(20), defaultValue: 'disconnected' }, // connected, disconnected, error
    config_json:   { type: DataTypes.JSON },                          // API keys, OAuth tokens (encrypted)
    last_sync:     { type: DataTypes.DATE },
    error_message: { type: DataTypes.TEXT },
}, { tableName: 'integrations', underscored: true });

const IntegrationLog = sequelize.define('IntegrationLog', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:   { type: DataTypes.STRING(50), allowNull: false },
    provider:    { type: DataTypes.STRING(100) },
    event_type:  { type: DataTypes.STRING(50) },  // CONNECT, DISCONNECT, SYNC, ERROR, AUTOMATION
    status:      { type: DataTypes.STRING(20) },  // success, error, warning
    message:     { type: DataTypes.TEXT },
    timestamp:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'integration_logs', underscored: true });

const SyncData = sequelize.define('SyncData', {
    id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:     { type: DataTypes.STRING(50), allowNull: false },
    provider:      { type: DataTypes.STRING(100) },
    users_synced:  { type: DataTypes.INTEGER, defaultValue: 0 },
    groups_synced: { type: DataTypes.INTEGER, defaultValue: 0 },
    errors:        { type: DataTypes.INTEGER, defaultValue: 0 },
    last_sync:     { type: DataTypes.DATE },
}, { tableName: 'sync_data', underscored: true });

// ─── Phase XI: Content Studio ─────────────────────────────────────────────

const StudioCourse = sequelize.define('StudioCourse', {
    id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:        { type: DataTypes.STRING(50), defaultValue: 'content_team' },
    title:            { type: DataTypes.STRING(255), allowNull: false },
    description:      { type: DataTypes.TEXT },
    audience:         { type: DataTypes.STRING(100), defaultValue: 'Corporate' }, // Corporate, NGO
    status:           { type: DataTypes.STRING(30), defaultValue: 'draft' }, // draft, in_review, approved, published
    compliance_tags:  { type: DataTypes.JSON, defaultValue: [] },  // ['ISO 27001','SOC2','PCI DSS']
    category:         { type: DataTypes.STRING(100) },
    thumbnail_url:    { type: DataTypes.STRING(512) },
    pass_mark:        { type: DataTypes.INTEGER, defaultValue: 70 },
    certificate_enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    certificate_name: { type: DataTypes.STRING(255) },
    deadline_days:    { type: DataTypes.INTEGER },
    reminder_days:    { type: DataTypes.INTEGER, defaultValue: 3 },
    created_by:       { type: DataTypes.STRING(100), defaultValue: 'creator@cyberapexlms.io' },
    reviewer_note:    { type: DataTypes.TEXT },
    approved_by:      { type: DataTypes.STRING(100) },
    published_at:     { type: DataTypes.DATE },
    version:          { type: DataTypes.INTEGER, defaultValue: 1 },
}, { tableName: 'studio_courses', underscored: true });

const StudioModule = sequelize.define('StudioModule', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    course_id: { type: DataTypes.UUID, allowNull: false },
    title:     { type: DataTypes.STRING(255), allowNull: false },
    order:     { type: DataTypes.INTEGER, defaultValue: 0 },
    description: { type: DataTypes.TEXT },
}, { tableName: 'studio_modules', underscored: true });

const StudioLesson = sequelize.define('StudioLesson', {
    id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    module_id:       { type: DataTypes.UUID, allowNull: false },
    title:           { type: DataTypes.STRING(255), allowNull: false },
    order:           { type: DataTypes.INTEGER, defaultValue: 0 },
    unlock_condition: { type: DataTypes.STRING(50), defaultValue: 'previous' }, // previous, free
    completion_rule:  { type: DataTypes.STRING(50), defaultValue: 'any' },      // any, video_watch, quiz_pass
    video_watch_pct:  { type: DataTypes.INTEGER, defaultValue: 80 },
}, { tableName: 'studio_lessons', underscored: true });

const ContentBlock = sequelize.define('ContentBlock', {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    lesson_id:    { type: DataTypes.UUID, allowNull: false },
    type:         { type: DataTypes.STRING(50), allowNull: false }, // video, notes, quiz, file, scenario, quick_question
    content_json: { type: DataTypes.JSON, defaultValue: {} },
    order:        { type: DataTypes.INTEGER, defaultValue: 0 },
    title:        { type: DataTypes.STRING(255) },
}, { tableName: 'content_blocks', underscored: true });

const StudioQuiz = sequelize.define('StudioQuiz', {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    lesson_id:    { type: DataTypes.UUID, allowNull: false },
    title:        { type: DataTypes.STRING(255), defaultValue: 'Quiz' },
    pass_mark:    { type: DataTypes.INTEGER, defaultValue: 70 },
    max_attempts: { type: DataTypes.INTEGER, defaultValue: 3 },
    show_hints:   { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'studio_quizzes', underscored: true });

const StudioQuestion = sequelize.define('StudioQuestion', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    quiz_id:        { type: DataTypes.UUID, allowNull: false },
    question:       { type: DataTypes.TEXT, allowNull: false },
    options:        { type: DataTypes.JSON, defaultValue: [] },   // ['option A', 'option B', ...]
    correct_answer: { type: DataTypes.INTEGER },                  // index of correct option
    explanation:    { type: DataTypes.TEXT },
    order:          { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'studio_questions', underscored: true });

// Content Studio associations
StudioCourse.hasMany(StudioModule,   { foreignKey: 'course_id', as: 'modules',   onDelete: 'CASCADE' });
StudioModule.belongsTo(StudioCourse, { foreignKey: 'course_id' });
StudioModule.hasMany(StudioLesson,   { foreignKey: 'module_id', as: 'lessons',   onDelete: 'CASCADE' });
StudioLesson.belongsTo(StudioModule, { foreignKey: 'module_id' });
StudioLesson.hasMany(ContentBlock,   { foreignKey: 'lesson_id', as: 'blocks',    onDelete: 'CASCADE' });
ContentBlock.belongsTo(StudioLesson, { foreignKey: 'lesson_id' });
StudioLesson.hasMany(StudioQuiz,     { foreignKey: 'lesson_id', as: 'quizzes',   onDelete: 'CASCADE' });
StudioQuiz.belongsTo(StudioLesson,   { foreignKey: 'lesson_id' });
StudioQuiz.hasMany(StudioQuestion,   { foreignKey: 'quiz_id',   as: 'questions', onDelete: 'CASCADE' });
StudioQuestion.belongsTo(StudioQuiz, { foreignKey: 'quiz_id' });

// ─── Phase X: Adaptive Rules Engine ────────────────────────────────────────────
const Rule = sequelize.define('Rule', {
    id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:        { type: DataTypes.STRING(50), allowNull: false },
    name:             { type: DataTypes.STRING(255), allowNull: false },
    trigger_type:     { type: DataTypes.STRING(100), allowNull: false },
    conditions_json:  { type: DataTypes.JSON, defaultValue: {} },
    actions_json:     { type: DataTypes.JSON, defaultValue: [] },
    status:           { type: DataTypes.STRING(20), defaultValue: 'active' }, // active, paused
    fires_30d:        { type: DataTypes.INTEGER, defaultValue: 0 },
    last_fired:       { type: DataTypes.DATE },
}, { tableName: 'rules', underscored: true });

const RuleExecution = sequelize.define('RuleExecution', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    rule_id:   { type: DataTypes.UUID, allowNull: false },
    user_id:   { type: DataTypes.STRING(100) },
    status:    { type: DataTypes.STRING(20) }, // success, failed, skipped
    result:    { type: DataTypes.TEXT },       // JSON stringified action results
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'rule_executions', underscored: true });

const RuleLog = sequelize.define('RuleLog', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    rule_id:   { type: DataTypes.UUID, allowNull: false },
    message:   { type: DataTypes.TEXT },
    severity:  { type: DataTypes.STRING(20), defaultValue: 'info' }, // info, warning, error
    timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'rule_logs', underscored: true });

// Rule associations
Rule.hasMany(RuleExecution, { foreignKey: 'rule_id', as: 'executions', onDelete: 'CASCADE' });
RuleExecution.belongsTo(Rule, { foreignKey: 'rule_id' });
Rule.hasMany(RuleLog, { foreignKey: 'rule_id', as: 'logs', onDelete: 'CASCADE' });
RuleLog.belongsTo(Rule, { foreignKey: 'rule_id' });

const CampaignTarget = sequelize.define('CampaignTarget', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    campaign_id: { type: DataTypes.UUID, allowNull: false },
    user_id:     { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'campaign_targets', underscored: true });

const PhishingEvent = sequelize.define('PhishingEvent', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    campaign_id: { type: DataTypes.UUID, allowNull: false },
    user_id:     { type: DataTypes.UUID, allowNull: false },
    event_type:  { type: DataTypes.ENUM('sent', 'delivered', 'opened', 'clicked', 'submitted', 'reported'), allowNull: false },
    timestamp:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'phishing_events', underscored: true });

/* ─── Escalations ───────────────────────── */
const Escalation = sequelize.define('Escalation', {
    escalation_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:     { type: DataTypes.STRING(50) },
    severity:      { type: DataTypes.ENUM('critical','high','medium','low'), defaultValue: 'medium' },
    issue_type:    { type: DataTypes.STRING(100) },
    description:   { type: DataTypes.TEXT, allowNull: false },
    status:        { type: DataTypes.ENUM('open','in_progress','resolved'), defaultValue: 'open' },
    assigned_to:   { type: DataTypes.STRING(255) },
    resolved_at:   { type: DataTypes.DATE },
    resolution_note: { type: DataTypes.TEXT },
}, { tableName: 'escalations', underscored: true });

/* ─── Audit Logs ────────────────────────── */
const AuditLog = sequelize.define('AuditLog', {
    log_id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    actor_user_id:   { type: DataTypes.STRING(100) },
    actor_email:     { type: DataTypes.STRING(255) },
    actor_role:      { type: DataTypes.STRING(50) },
    tenant_id:       { type: DataTypes.STRING(50) },
    action_type:     { type: DataTypes.STRING(100), allowNull: false },
    target_resource: { type: DataTypes.STRING(255) },
    ip_address:      { type: DataTypes.STRING(50) },
    result:          { type: DataTypes.ENUM('success','failure'), defaultValue: 'success' },
}, { tableName: 'audit_logs', underscored: true });

// --- AuditLog Encryption Hooks ---
AuditLog.beforeSave(async (log) => {
    if (log.changed('actor_email')) log.actor_email = encrypt(log.actor_email);
    if (log.changed('ip_address')) log.ip_address = encrypt(log.ip_address);
});

AuditLog.afterFind(async (results) => {
    if (!results) return;
    const items = Array.isArray(results) ? results : [results];
    items.forEach(item => {
        if (item.actor_email) item.actor_email = decrypt(item.actor_email);
        if (item.ip_address) item.ip_address = decrypt(item.ip_address);
    });
});

/* ─── Notifications ─────────────────────── */
const Notification = sequelize.define('Notification', {
    notification_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    type:            { type: DataTypes.STRING(50) },
    title:           { type: DataTypes.STRING(255), allowNull: false },
    message:         { type: DataTypes.TEXT, allowNull: false },
    tenant_id:       { type: DataTypes.STRING(50) },
    severity:        { type: DataTypes.ENUM('critical','high','medium','low','info'), defaultValue: 'info' },
    read:            { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'notifications', underscored: true });

/* ─── Industry Packs ────────────────────── */
const IndustryPack = sequelize.define('IndustryPack', {
    pack_id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    pack_name:        { type: DataTypes.STRING(255), allowNull: false },
    industry:         { type: DataTypes.STRING(100), allowNull: false },
    included_courses: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    description:      { type: DataTypes.TEXT },
    tenant_count:     { type: DataTypes.INTEGER, defaultValue: 0 },
    status:           { type: DataTypes.ENUM('active','inactive'), defaultValue: 'active' },
}, { tableName: 'industry_packs', underscored: true });

/* ─── SSO Providers ─────────────────────── */
const SsoProvider = sequelize.define('SsoProvider', {
    provider_id:   { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    provider_name: { type: DataTypes.STRING(100), allowNull: false },
    provider_type: { type: DataTypes.ENUM('SAML','OIDC','SCIM'), defaultValue: 'SAML' },
    tenant_id:     { type: DataTypes.STRING(50), allowNull: false },
    metadata_url:  { type: DataTypes.STRING(1000) },
    client_id:     { type: DataTypes.STRING(500) },
    status:        { type: DataTypes.ENUM('active','inactive','pending_verification'), defaultValue: 'pending_verification' },
}, { tableName: 'sso_providers', underscored: true });

// --- SSO Encryption Hooks ---
SsoProvider.beforeSave(async (provider) => {
    if (provider.changed('client_id')) provider.client_id = encrypt(provider.client_id);
    if (provider.changed('metadata_url')) provider.metadata_url = encrypt(provider.metadata_url);
});

SsoProvider.afterFind(async (results) => {
    if (!results) return;
    const items = Array.isArray(results) ? results : [results];
    items.forEach(item => {
        if (item.client_id) item.client_id = decrypt(item.client_id);
        if (item.metadata_url) item.metadata_url = decrypt(item.metadata_url);
    });
});

/* ─── Email Logs ────────────────────────── */
const EmailLog = sequelize.define('EmailLog', {
    log_id:    { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.STRING(50) },
    recipient: { type: DataTypes.STRING(255), allowNull: false },
    subject:   { type: DataTypes.STRING(500) },
    status:    { type: DataTypes.ENUM('pending','delivered','bounced','spam','opened','clicked'), defaultValue: 'pending' },
    type:      { type: DataTypes.STRING(100) },
    sent_at:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'email_logs', underscored: true });

// --- EmailLog Encryption Hooks ---
EmailLog.beforeSave(async (log) => {
    if (log.changed('recipient')) log.recipient = encrypt(log.recipient);
    if (log.changed('subject')) log.subject = encrypt(log.subject);
});

EmailLog.afterFind(async (results) => {
    if (!results) return;
    const items = Array.isArray(results) ? results : [results];
    items.forEach(item => {
        if (item.recipient) item.recipient = decrypt(item.recipient);
        if (item.subject) item.subject = decrypt(item.subject);
    });
});

/* ─── Compliance Frameworks & Evidence ────────── */
const Framework = sequelize.define('Framework', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:   { type: DataTypes.STRING(50) },
    name:        { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT },
}, { tableName: 'frameworks', underscored: true });

const Control = sequelize.define('Control', {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    framework_id: { type: DataTypes.UUID, allowNull: false },
    name:         { type: DataTypes.STRING(255), allowNull: false },
    requirement:  { type: DataTypes.TEXT },
}, { tableName: 'controls', underscored: true });

const Evidence = sequelize.define('Evidence', {
    id:                    { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    control_id:            { type: DataTypes.UUID, allowNull: false },
    user_id:               { type: DataTypes.UUID },
    status:                { type: DataTypes.ENUM('Complete','Partial','In Progress','At Risk'), defaultValue: 'In Progress' },
    completion_percentage: { type: DataTypes.INTEGER, defaultValue: 0 },
    last_updated:          { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'evidence', underscored: true });

const ComplianceScore = sequelize.define('ComplianceScore', {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:    { type: DataTypes.STRING(50), allowNull: false },
    framework_id: { type: DataTypes.UUID, allowNull: false },
    score:        { type: DataTypes.DECIMAL(5,2), defaultValue: 0 },
    status:       { type: DataTypes.ENUM('Good','On Track','Review','Urgent'), defaultValue: 'Review' },
}, { tableName: 'compliance_scores', underscored: true });

/* ─── Board Report Models ───────────────── */
const BoardReport = sequelize.define('BoardReport', {
    id:                { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:         { type: DataTypes.STRING(50), allowNull: false },
    quarter:           { type: DataTypes.STRING(20), allowNull: false },
    executive_summary: { type: DataTypes.TEXT },
    generated_at:      { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'board_reports', underscored: true });

const BoardMetric = sequelize.define('BoardMetric', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    report_id:   { type: DataTypes.UUID, allowNull: false },
    tenant_id:   { type: DataTypes.STRING(50), allowNull: false },
    metric_name: { type: DataTypes.STRING(100), allowNull: false },
    value:       { type: DataTypes.STRING(50) },
    target:      { type: DataTypes.STRING(50) },
    quarter:     { type: DataTypes.STRING(20) },
}, { tableName: 'board_metrics', underscored: true });

const BoardRisk = sequelize.define('BoardRisk', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    report_id:   { type: DataTypes.UUID, allowNull: false },
    tenant_id:   { type: DataTypes.STRING(50), allowNull: false },
    type:        { type: DataTypes.STRING(50) },
    description: { type: DataTypes.TEXT },
    severity:    { type: DataTypes.ENUM('Critical','Warning','Positive'), defaultValue: 'Warning' },
}, { tableName: 'board_risks', underscored: true });

const BoardRecommendation = sequelize.define('BoardRecommendation', {
    id:        { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    report_id: { type: DataTypes.UUID, allowNull: false },
    tenant_id: { type: DataTypes.STRING(50), allowNull: false },
    action:    { type: DataTypes.STRING(255), allowNull: false },
    owner:     { type: DataTypes.STRING(100) },
    timeline:  { type: DataTypes.STRING(50) },
}, { tableName: 'board_recommendations', underscored: true });

/* ─── Associations ──────────────────────── */
Escalation.belongsTo(Tenant, { foreignKey: 'tenant_id', as: 'tenant' });
Tenant.hasMany(Escalation, { foreignKey: 'tenant_id' });

Framework.hasMany(Control, { foreignKey: 'framework_id', as: 'controls' });
Control.belongsTo(Framework, { foreignKey: 'framework_id' });

Control.hasMany(Evidence, { foreignKey: 'control_id', as: 'evidence' });
Evidence.belongsTo(Control, { foreignKey: 'control_id' });

Framework.hasMany(ComplianceScore, { foreignKey: 'framework_id', as: 'scores' });
ComplianceScore.belongsTo(Framework, { foreignKey: 'framework_id' });

BoardReport.hasMany(BoardMetric, { foreignKey: 'report_id', as: 'metrics' });
BoardMetric.belongsTo(BoardReport, { foreignKey: 'report_id' });

BoardReport.hasMany(BoardRisk, { foreignKey: 'report_id', as: 'risks' });
BoardRisk.belongsTo(BoardReport, { foreignKey: 'report_id' });

BoardReport.hasMany(BoardRecommendation, { foreignKey: 'report_id', as: 'recommendations' });
BoardRecommendation.belongsTo(BoardReport, { foreignKey: 'report_id' });

PhishingCampaign.hasMany(CampaignTarget, { foreignKey: 'campaign_id', as: 'targets' });
CampaignTarget.belongsTo(PhishingCampaign, { foreignKey: 'campaign_id' });

PhishingCampaign.hasMany(PhishingEvent, { foreignKey: 'campaign_id', as: 'events' });
PhishingEvent.belongsTo(PhishingCampaign, { foreignKey: 'campaign_id' });

PhishingCampaign.hasOne(PhishingTemplate, { foreignKey: 'campaign_id', as: 'phishing_template' });
PhishingTemplate.belongsTo(PhishingCampaign, { foreignKey: 'campaign_id' });

PhishingCampaign.hasOne(PhishingLandingPage, { foreignKey: 'campaign_id', as: 'landing_page' });
PhishingLandingPage.belongsTo(PhishingCampaign, { foreignKey: 'campaign_id' });

// EmailTemplate - TemplateUsage
EmailTemplate.hasMany(TemplateUsage, { foreignKey: 'template_id', as: 'usages', onDelete: 'CASCADE' });
TemplateUsage.belongsTo(EmailTemplate, { foreignKey: 'template_id' });

/* ─── Export ────────────────────────────── */
module.exports = {
    User, Tenant, IndividualStudent, Course, TrainingRecord, Certificate,
    PhishingCampaign, PhishingTemplate, PhishingLandingPage, CampaignTarget, PhishingEvent,
    EmailTemplate, TemplateUsage,
    SsoConfig, ScimConfig, ScimLog,
    Integration, IntegrationLog, SyncData,
    Escalation, AuditLog, Notification,
    IndustryPack, SsoProvider, EmailLog,
    Framework, Control, Evidence, ComplianceScore,
    BoardReport, BoardMetric, BoardRisk, BoardRecommendation,
    Rule, RuleExecution, RuleLog,
    StudioCourse, StudioModule, StudioLesson, ContentBlock, StudioQuiz, StudioQuestion,
};
