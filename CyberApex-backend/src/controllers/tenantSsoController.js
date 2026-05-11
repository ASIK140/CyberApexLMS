'use strict';
const { v4: uuidv4 } = require('uuid');
const { SsoConfig, ScimConfig, ScimLog } = require('../models');

const TENANT_ID = 'tenant_acme'; // extracted from auth token in production

const getTenantId = (req) => req.user?.tenant_id || TENANT_ID;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeScimUrl = (tenantId) => `https://app.cyberapex.io/scim/v2/${tenantId}`;
const makeToken   = () => `scim_${uuidv4().replace(/-/g, '')}_${Date.now()}`;

const addLog = async (tenantId, event_type, status, message, error_message = null) => {
    await ScimLog.create({ tenant_id: tenantId, event_type, status, message, error_message });
};

// ─── SSO Config ───────────────────────────────────────────────────────────────

exports.getSsoConfig = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        let config = await SsoConfig.findOne({ where: { tenant_id } });

        if (!config) {
            // Auto-seed a default SSO config
            config = await SsoConfig.create({
                tenant_id,
                provider: 'Microsoft Entra ID',
                protocol: 'SAML 2.0',
                entity_id: `https://sts.windows.net/${tenant_id}/`,
                sso_url: `https://login.microsoftonline.com/${tenant_id}/saml2`,
                certificate: '-----BEGIN CERTIFICATE-----\nMIIC8DCCAdigAwIBAgIQUsCbMock==\n-----END CERTIFICATE-----',
                certificate_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                jit_enabled: true,
                mfa_required: false,
                status: 'active',
                active_users: 42,
                last_login: new Date(),
            });
        }

        res.json({ success: true, data: config });
    } catch (err) { next(err); }
};

exports.saveSsoConfig = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const { provider, entity_id, sso_url, certificate, certificate_expiry, jit_enabled, mfa_required } = req.body;

        const [config, created] = await SsoConfig.findOrCreate({
            where: { tenant_id },
            defaults: { provider, entity_id, sso_url, certificate, certificate_expiry, jit_enabled, mfa_required }
        });

        if (!created) {
            await config.update({ provider, entity_id, sso_url, certificate, certificate_expiry, jit_enabled, mfa_required });
        }

        await addLog(tenant_id, 'CONFIG_SAVE', 'success', `SSO config saved. Provider: ${provider}`);
        res.json({ success: true, message: 'SSO configuration saved successfully', data: config });
    } catch (err) { next(err); }
};

exports.runDiagnostic = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const sso = await SsoConfig.findOne({ where: { tenant_id } });

        const checks = [];
        const now = new Date();

        // 1. SSO Config check
        checks.push({ name: 'SSO Configuration', status: sso ? 'pass' : 'fail', detail: sso ? 'Configuration record exists' : 'No SSO config found' });

        // 2. Entity ID check
        checks.push({ name: 'Entity ID', status: sso?.entity_id ? 'pass' : 'fail', detail: sso?.entity_id ? `Set to: ${sso.entity_id}` : 'Entity ID is empty' });

        // 3. SSO URL check
        const ssoUrlValid = sso?.sso_url && sso.sso_url.startsWith('https://');
        checks.push({ name: 'SSO URL (HTTPS)', status: ssoUrlValid ? 'pass' : 'fail', detail: ssoUrlValid ? `URL: ${sso.sso_url}` : 'URL missing or not HTTPS' });

        // 4. Certificate check
        const certValid = sso?.certificate && sso.certificate.includes('CERTIFICATE');
        checks.push({ name: 'Certificate Present', status: certValid ? 'pass' : 'fail', detail: certValid ? 'Certificate loaded' : 'Certificate missing or invalid' });

        // 5. Certificate expiry
        let certExpStatus = 'warn', certExpDetail = 'No expiry date set';
        if (sso?.certificate_expiry) {
            const expiry = new Date(sso.certificate_expiry);
            const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
            if (daysLeft <= 0) { certExpStatus = 'fail'; certExpDetail = `Certificate EXPIRED ${Math.abs(daysLeft)} days ago`; }
            else if (daysLeft <= 30) { certExpStatus = 'warn'; certExpDetail = `Certificate expires in ${daysLeft} days – renew soon`; }
            else { certExpStatus = 'pass'; certExpDetail = `Certificate valid for ${daysLeft} more days`; }
        }
        checks.push({ name: 'Certificate Expiry', status: certExpStatus, detail: certExpDetail });

        // 6. JIT Provisioning
        checks.push({ name: 'JIT Provisioning', status: 'pass', detail: sso?.jit_enabled ? 'Enabled – new users auto-created on first login' : 'Disabled' });

        // 7. MFA
        checks.push({ name: 'MFA Enforcement', status: 'pass', detail: sso?.mfa_required ? 'MFA required via IdP' : 'MFA optional' });

        // 8. Mock SAML Endpoint Reachability
        checks.push({ name: 'SAML Endpoint Reachable', status: 'pass', detail: 'IdP endpoint responding (simulated)' });

        const passed = checks.filter(c => c.status === 'pass').length;
        const failed = checks.filter(c => c.status === 'fail').length;
        const warned = checks.filter(c => c.status === 'warn').length;

        await addLog(tenant_id, 'DIAGNOSTIC', failed > 0 ? 'error' : 'success',
            `Diagnostic complete: ${passed} pass, ${failed} fail, ${warned} warn`);

        res.json({ success: true, summary: { passed, failed, warned, total: checks.length }, checks });
    } catch (err) { next(err); }
};

// ─── SCIM Config ──────────────────────────────────────────────────────────────

exports.getScimConfig = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        let scim = await ScimConfig.findOne({ where: { tenant_id } });

        if (!scim) {
            scim = await ScimConfig.create({
                tenant_id,
                base_url: makeScimUrl(tenant_id),
                token: makeToken(),
                status: 'enabled',
                group_sync: true,
                last_sync: new Date(),
                users_provisioned: 63,
                sync_errors: 2,
                deprovisioned: 5,
            });
        }

        // Mask token for display: show first 12 chars + ****
        const masked = { ...scim.toJSON(), token: scim.token ? scim.token.substring(0, 12) + '••••••••••••••••' : null };
        res.json({ success: true, data: masked });
    } catch (err) { next(err); }
};

exports.regenerateToken = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const scim = await ScimConfig.findOne({ where: { tenant_id } });
        if (!scim) return res.status(404).json({ success: false, message: 'SCIM config not found' });

        const newToken = makeToken();
        await scim.update({ token: newToken });

        await addLog(tenant_id, 'TOKEN_REGEN', 'success', 'SCIM bearer token regenerated. Previous token invalidated.');

        // Return full new token ONCE — admin should copy it
        res.json({ success: true, message: 'Token regenerated. Copy this token — it will be masked after this.', token: newToken });
    } catch (err) { next(err); }
};

exports.syncNow = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const scim = await ScimConfig.findOne({ where: { tenant_id } });
        if (!scim) return res.status(404).json({ success: false, message: 'SCIM config not found' });

        // Simulate sync
        const synced = Math.floor(Math.random() * 20) + 5;
        const errors = Math.floor(Math.random() * 2);
        const deprovisioned = Math.floor(Math.random() * 3);

        await scim.update({
            last_sync: new Date(),
            users_provisioned: (scim.users_provisioned || 0) + synced,
            sync_errors: (scim.sync_errors || 0) + errors,
            deprovisioned: (scim.deprovisioned || 0) + deprovisioned,
        });

        await addLog(tenant_id, 'SYNC', errors > 0 ? 'warning' : 'success',
            `Sync complete: ${synced} users synced, ${deprovisioned} deprovisioned, ${errors} errors`);

        res.json({
            success: true,
            message: `Sync complete`,
            synced, errors, deprovisioned,
            last_sync: new Date().toISOString()
        });
    } catch (err) { next(err); }
};

exports.getScimLogs = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const logs = await ScimLog.findAll({
            where: { tenant_id },
            order: [['timestamp', 'DESC']],
            limit: 50
        });
        res.json({ success: true, data: logs });
    } catch (err) { next(err); }
};
