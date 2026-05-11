'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

/* ─── Teams ─────────────────────────────────────────────── */
const Team = sequelize.define('Team', {
    id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:     { type: DataTypes.STRING(50), allowNull: false },
    department_id: { type: DataTypes.UUID, allowNull: false },
    team_name:     { type: DataTypes.STRING(100), allowNull: false },
    manager_id:    { type: DataTypes.UUID },
    member_count:  { type: DataTypes.INTEGER, defaultValue: 0 },
    description:   { type: DataTypes.TEXT },
    status:        { type: DataTypes.ENUM('active','inactive'), defaultValue: 'active' },
}, { tableName: 'teams', underscored: true });

/* ─── User Activity Logs ─────────────────────────────────── */
const UserActivityLog = sequelize.define('UserActivityLog', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:   { type: DataTypes.STRING(50), allowNull: false },
    user_id:     { type: DataTypes.UUID, allowNull: false },
    action:      { type: DataTypes.STRING(100), allowNull: false },
    login_time:  { type: DataTypes.DATE },
    ip_address:  { type: DataTypes.STRING(45) },
    device:      { type: DataTypes.STRING(200) },
    user_agent:  { type: DataTypes.TEXT },
    session_duration_min: { type: DataTypes.INTEGER },
    pages_visited: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'user_activity_logs', underscored: true });

/* ─── Tenant Frameworks ──────────────────────────────────── */
const TenantFramework = sequelize.define('TenantFramework', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:      { type: DataTypes.STRING(50), allowNull: false },
    framework_id:   { type: DataTypes.UUID, allowNull: false },
    framework_name: { type: DataTypes.STRING(100) },
    enabled:        { type: DataTypes.BOOLEAN, defaultValue: true },
    enabled_at:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    enabled_by:     { type: DataTypes.UUID },
    target_coverage:{ type: DataTypes.INTEGER, defaultValue: 100 },
    deadline:       { type: DataTypes.DATEONLY },
}, { tableName: 'tenant_frameworks', underscored: true });

/* ─── Tenant Notification Templates ─────────────────────── */
const TenantNotification = sequelize.define('TenantNotification', {
    id:           { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:    { type: DataTypes.STRING(50), allowNull: false },
    type:         { type: DataTypes.ENUM('training_reminder','overdue_training','cert_expiry','welcome','campaign_alert'), allowNull: false },
    recipient_id: { type: DataTypes.UUID },
    recipient_group: { type: DataTypes.ENUM('all','department','role','individual'), defaultValue: 'individual' },
    subject:      { type: DataTypes.STRING(255) },
    message:      { type: DataTypes.TEXT },
    sent_by:      { type: DataTypes.UUID },
    status:       { type: DataTypes.ENUM('pending','sent','failed'), defaultValue: 'pending' },
    sent_at:      { type: DataTypes.DATE },
    scheduled_at: { type: DataTypes.DATE },
}, { tableName: 'tenant_notifications', underscored: true });

/* ─── User Import Jobs ───────────────────────────────────── */
const UserImportJob = sequelize.define('UserImportJob', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id:      { type: DataTypes.STRING(50), allowNull: false },
    imported_by:    { type: DataTypes.UUID },
    file_name:      { type: DataTypes.STRING(255) },
    file_url:       { type: DataTypes.STRING(1000) },
    total_rows:     { type: DataTypes.INTEGER, defaultValue: 0 },
    successful:     { type: DataTypes.INTEGER, defaultValue: 0 },
    failed:         { type: DataTypes.INTEGER, defaultValue: 0 },
    errors:         { type: DataTypes.JSON },
    status:         { type: DataTypes.ENUM('pending','processing','completed','failed'), defaultValue: 'pending' },
    completed_at:   { type: DataTypes.DATE },
}, { tableName: 'user_import_jobs', underscored: true });

module.exports = { Team, UserActivityLog, TenantFramework, TenantNotification, UserImportJob };
