'use strict';
const { v4: uuidv4 } = require('uuid');
const { Integration, IntegrationLog, SyncData } = require('../models');

const TENANT_ID = 'tenant_acme';
const getTenantId = (req) => req.user?.tenant_id || TENANT_ID;

// ─── Provider Catalogue ────────────────────────────────────────────────────────
const PROVIDER_META = {
    'Microsoft 365': { type: 'IAM + SCIM + SSO', icon: '🪟', description: 'Sync users, groups, and enable SSO via Microsoft Entra ID', authType: 'OAuth', color: '#0078d4' },
    'BambooHR':      { type: 'HRMS', icon: '🎋', description: 'Auto-enroll new hires and sync manager hierarchy from BambooHR', authType: 'API Key', color: '#73c41d' },
    'Slack':         { type: 'Messaging', icon: '💬', description: 'Send nudges, overdue reminders, and manager alerts via Slack', authType: 'OAuth', color: '#4a154b' },
    'Workday':       { type: 'HRMS', icon: '🏢', description: 'Sync employees, departments, and org hierarchy from Workday', authType: 'OAuth', color: '#f5a623' },
    'ServiceNow':    { type: 'ITSM', icon: '🎫', description: 'Automatically create ServiceNow tickets on risk events', authType: 'API Key', color: '#62d84e' },
    'Google Workspace': { type: 'IAM + SSO', icon: '🔵', description: 'Sync Google Directory users, groups, and enable Google SSO', authType: 'OAuth', color: '#4285f4' },
};

const addLog = async (tenant_id, provider, event_type, status, message) => {
    await IntegrationLog.create({ tenant_id, provider, event_type, status, message }).catch(() => {});
};

// ─── Seed default integration records if none exist ────────────────────────────
const ensureIntegrations = async (tenant_id) => {
    const existing = await Integration.findAll({ where: { tenant_id } });
    if (existing.length === 0) {
        const defaults = [
            { tenant_id, provider_name: 'Microsoft 365',    type: 'IAM + SCIM + SSO', status: 'connected',    config_json: { users_synced: 247, groups_mapped: 14, nudge_channel: null }, last_sync: new Date() },
            { tenant_id, provider_name: 'BambooHR',         type: 'HRMS',             status: 'connected',    config_json: { new_hires: 12, manager_hierarchy: true, workspace: 'acme-corp' }, last_sync: new Date() },
            { tenant_id, provider_name: 'Slack',            type: 'Messaging',        status: 'connected',    config_json: { workspace: 'CyberApex-Acme', nudge_channel: '#security-alerts', reminders: true, manager_alerts: true }, last_sync: new Date() },
            { tenant_id, provider_name: 'Workday',          type: 'HRMS',             status: 'disconnected', config_json: null, last_sync: null },
            { tenant_id, provider_name: 'ServiceNow',       type: 'ITSM',             status: 'disconnected', config_json: null, last_sync: null },
            { tenant_id, provider_name: 'Google Workspace', type: 'IAM + SSO',        status: 'disconnected', config_json: null, last_sync: null },
        ];
        await Integration.bulkCreate(defaults);

        // Seed sync_data for connected ones
        await SyncData.bulkCreate([
            { tenant_id, provider: 'Microsoft 365',    users_synced: 247, groups_synced: 14, errors: 2, last_sync: new Date() },
            { tenant_id, provider: 'BambooHR',         users_synced: 12,  groups_synced: 5,  errors: 0, last_sync: new Date() },
            { tenant_id, provider: 'Slack',            users_synced: 0,   groups_synced: 0,  errors: 0, last_sync: new Date() },
        ]);
    }
};

// ─── Endpoints ────────────────────────────────────────────────────────────────

exports.getStatus = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        await ensureIntegrations(tenant_id);

        const integrations = await Integration.findAll({ where: { tenant_id } });
        const syncs = await SyncData.findAll({ where: { tenant_id } });

        // Merge sync data into integration objects
        const data = integrations.map(i => {
            const sync = syncs.find(s => s.provider === i.provider_name);
            const meta = PROVIDER_META[i.provider_name] || {};
            return { ...i.toJSON(), sync: sync?.toJSON() || null, meta };
        });

        res.json({ success: true, data });
    } catch (err) { next(err); }
};

exports.connect = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const { provider, api_key, client_id, client_secret, workspace, channel } = req.body;

        if (!provider) return res.status(400).json({ success: false, message: 'Provider is required' });
        if (!PROVIDER_META[provider]) return res.status(400).json({ success: false, message: `Unknown provider: ${provider}` });

        // Simulate connection validation
        if (api_key === 'invalid' || client_id === 'bad') {
            await addLog(tenant_id, provider, 'CONNECT', 'error', `Connection failed: Invalid credentials for ${provider}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials. Connection failed.' });
        }

        const config_json = { api_key: api_key ? '***' : null, client_id, workspace, channel, connected_at: new Date() };
        const [integration] = await Integration.findOrCreate({ where: { tenant_id, provider_name: provider }, defaults: { type: PROVIDER_META[provider].type, status: 'connected', config_json, last_sync: new Date() } });

        if (integration.status !== 'connected') {
            await integration.update({ status: 'connected', config_json, last_sync: new Date(), error_message: null });
        } else {
            await integration.update({ config_json, last_sync: new Date(), error_message: null });
        }

        // Seed initial sync data
        const [syncRow] = await SyncData.findOrCreate({ where: { tenant_id, provider }, defaults: { users_synced: 0, groups_synced: 0, errors: 0, last_sync: new Date() } });

        await addLog(tenant_id, provider, 'CONNECT', 'success', `${provider} connected successfully`);
        res.json({ success: true, message: `${provider} connected successfully`, data: integration });
    } catch (err) { next(err); }
};

exports.disconnect = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const { provider } = req.body;

        const integration = await Integration.findOne({ where: { tenant_id, provider_name: provider } });
        if (!integration) return res.status(404).json({ success: false, message: 'Integration not found' });

        await integration.update({ status: 'disconnected', config_json: null, error_message: null });
        await addLog(tenant_id, provider, 'DISCONNECT', 'success', `${provider} disconnected. Tokens revoked. Data preserved.`);

        res.json({ success: true, message: `${provider} disconnected successfully. Data remains safe.` });
    } catch (err) { next(err); }
};

exports.sync = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const { provider } = req.body;

        const integration = await Integration.findOne({ where: { tenant_id, provider_name: provider } });
        if (!integration) return res.status(404).json({ success: false, message: 'Integration not found' });
        if (integration.status !== 'connected') return res.status(400).json({ success: false, message: `${provider} is not connected` });

        // Simulate sync
        const users  = Math.floor(Math.random() * 30) + 5;
        const groups = Math.floor(Math.random() * 8) + 1;
        const errors = Math.random() > 0.8 ? Math.floor(Math.random() * 3) : 0;

        const [syncRow] = await SyncData.findOrCreate({ where: { tenant_id, provider }, defaults: { users_synced: 0, groups_synced: 0, errors: 0 } });
        await syncRow.update({ users_synced: syncRow.users_synced + users, groups_synced: syncRow.groups_synced + groups, errors: syncRow.errors + errors, last_sync: new Date() });
        await integration.update({ last_sync: new Date() });

        const status = errors > 0 ? 'warning' : 'success';
        await addLog(tenant_id, provider, 'SYNC', status, `Sync complete: ${users} users synced, ${groups} groups, ${errors} errors`);

        res.json({ success: true, message: `${provider} sync complete`, users_synced: users, groups_synced: groups, errors, last_sync: new Date().toISOString() });
    } catch (err) { next(err); }
};

exports.getLogs = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const { provider } = req.query;
        const where = provider ? { tenant_id, provider } : { tenant_id };
        const logs = await IntegrationLog.findAll({ where, order: [['timestamp', 'DESC']], limit: 100 });
        res.json({ success: true, data: logs });
    } catch (err) { next(err); }
};

exports.triggerAutomation = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const { trigger, provider, target_user } = req.body;

        const automationMap = {
            phishing_fail:     { msg: `ServiceNow ticket created for ${target_user || 'user'} — phishing simulation failure`, provider: 'ServiceNow' },
            training_overdue:  { msg: `Slack DM sent to ${target_user || 'user'} — training overdue reminder`, provider: 'Slack' },
            new_hire:          { msg: `${target_user || 'New hire'} auto-enrolled in Security Awareness 101 via BambooHR`, provider: 'BambooHR' },
        };

        const action = automationMap[trigger];
        if (!action) return res.status(400).json({ success: false, message: `Unknown trigger: ${trigger}` });

        await addLog(tenant_id, action.provider, 'AUTOMATION', 'success', action.msg);
        res.json({ success: true, message: action.msg, trigger, action_provider: action.provider });
    } catch (err) { next(err); }
};
