'use strict';
const { v4: uuidv4 } = require('uuid');

// ─── Mock Database ────────────────────────────────────────────────────────────

let SSO_INTEGRATIONS = [
    {
        integration_id: '8a2b1c4d-e5f6-4a3b-8c9d-1e0f2a3b4c5d',
        tenant_id: 'tenant_001',
        tenant_name: 'Acme Corp',
        provider_name: 'Okta',
        protocol: 'SAML',
        jit_enabled: true,
        scim_enabled: true,
        mfa_required: true,
        certificate_expiry: '2026-04-15',
        status: 'Healthy',
        created_at: '2025-01-10T08:00:00Z',
        updated_at: '2026-01-10T12:00:00Z'
    },
    {
        integration_id: '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e',
        tenant_id: 'tenant_002',
        tenant_name: 'MedGroup Ltd',
        provider_name: 'Azure AD',
        protocol: 'OIDC',
        jit_enabled: true,
        scim_enabled: false,
        mfa_required: true,
        certificate_expiry: '2026-06-20',
        status: 'Healthy',
        created_at: '2025-03-15T10:00:00Z',
        updated_at: '2026-02-15T14:00:00Z'
    },
    {
        integration_id: '3c4d5e6f-7a8b-4c9d-0e1f-2a3b4c5d6e7f',
        tenant_id: 'tenant_003',
        tenant_name: 'HealthCo',
        provider_name: 'Auth0',
        protocol: 'SAML',
        jit_enabled: false,
        scim_enabled: true,
        mfa_required: false,
        certificate_expiry: '2026-03-10', 
        status: 'Expired',
        created_at: '2025-05-20T09:00:00Z',
        updated_at: '2026-01-20T11:00:00Z'
    },
    {
        integration_id: '4d5e6f7a-8b9c-4d0e-1f2a-3b4c5d6e7f8a',
        tenant_id: 'tenant_004',
        tenant_name: 'RetailCo',
        provider_name: 'Google Workspace',
        protocol: 'OIDC',
        jit_enabled: false,
        scim_enabled: false,
        mfa_required: true,
        certificate_expiry: '2026-12-31',
        status: 'Broken',
        created_at: '2025-06-10T14:00:00Z',
        updated_at: '2026-03-10T15:00:00Z'
    },
];

let SCIM_SYNC_LOGS = [
    { log_id: 'log_001', tenant_id: 'tenant_001', user_email: 'john.doe@acme.com', action: 'User Created', timestamp: '2026-03-15T10:30:00Z' },
    { log_id: 'log_002', tenant_id: 'tenant_001', user_email: 'jane.smith@acme.com', action: 'User Updated', timestamp: '2026-03-15T11:15:00Z' },
    { log_id: 'log_003', tenant_id: 'tenant_003', user_email: 'dr.brown@healthco.com', action: 'User Disabled', timestamp: '2026-03-14T16:45:00Z' },
];

// ─── Helper Logic ─────────────────────────────────────────────────────────────

const calculateStatus = (integration) => {
    const today = new Date();
    const expiryDate = new Date(integration.certificate_expiry);
    
    if (!integration.provider_name || integration.provider_name === 'None') return 'NoSSO';
    if (expiryDate < today) return 'Expired';
    if (integration.status === 'Broken') return 'Broken'; 
    return 'Healthy';
};

// ─── Controller Methods ───────────────────────────────────────────────────────

exports.getIntegrations = (req, res) => {
    const updatedIntegrations = SSO_INTEGRATIONS.map(i => ({
        ...i,
        status: calculateStatus(i)
    }));
    res.json({ success: true, count: updatedIntegrations.length, data: updatedIntegrations });
};

exports.getAlerts = (req, res) => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const alerts = SSO_INTEGRATIONS.filter(i => {
        const expiryDate = new Date(i.certificate_expiry);
        return expiryDate < thirtyDaysFromNow;
    }).map(i => {
        const expiryDate = new Date(i.certificate_expiry);
        let message = '';
        if (expiryDate < today) {
            message = `${i.tenant_name} ${i.provider_name} certificate expired — 89 users cannot login. Immediate remediation required.`;
        } else {
            const daysLeft = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
            message = `${i.tenant_name} ${i.provider_name} certificate expires in ${daysLeft} days. Update required.`;
        }
        return {
            id: i.integration_id,
            tenant: i.tenant_name,
            severity: expiryDate < today ? 'critical' : 'warning',
            message
        };
    });

    res.json({ success: true, alerts });
};

exports.diagnose = (req, res) => {
    const { id } = req.body;
    const integration = SSO_INTEGRATIONS.find(i => i.integration_id === id);
    if (!integration) return res.status(404).json({ success: false, message: 'Integration not found.' });

    const report = {
        timestamp: new Date().toISOString(),
        overall_status: integration.status === 'Broken' ? 'Fail' : 'Pass',
        checks: [
            { name: 'SAML Metadata Fetch', status: 'Success', details: 'Successfully retrieved metadata from IdP.' },
            { name: 'Certificate Validity', status: integration.status === 'Expired' ? 'Fail' : 'Success', details: `Expires: ${integration.certificate_expiry}` },
            { name: 'IdP Connectivity', status: 'Success', details: 'Connection to identity provider established.' },
            { name: 'User Login Simulation', status: integration.status === 'Broken' ? 'Fail' : 'Success', details: integration.status === 'Broken' ? 'Error: Response signature mismatch.' : 'Authentication successful.' }
        ]
    };

    res.json({ success: true, report });
};

exports.fix = (req, res) => {
    const { id, certificate } = req.body;
    const integration = SSO_INTEGRATIONS.find(i => i.integration_id === id);
    if (!integration) return res.status(404).json({ success: false, message: 'Integration not found.' });

    if (certificate) {
        integration.certificate_expiry = '2027-12-31'; 
        integration.status = 'Healthy';
    }
    
    integration.updated_at = new Date().toISOString();

    res.json({ success: true, message: 'SSO configuration updated and verified.', data: integration });
};

exports.setup = (req, res) => {
    const { tenant_id, provider_name, protocol } = req.body;
    
    const newIntegration = {
        integration_id: uuidv4(),
        tenant_id: tenant_id || uuidv4(),
        tenant_name: (provider_name || 'New') + ' Org',
        provider_name: provider_name || 'Generic IdP',
        protocol: protocol || 'SAML',
        jit_enabled: true,
        scim_enabled: false,
        mfa_required: true,
        certificate_expiry: '2027-01-01',
        status: 'Healthy',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    SSO_INTEGRATIONS.push(newIntegration);
    res.json({ success: true, message: 'SSO Integration created successfully.', data: newIntegration });
};

exports.exportCSV = (req, res) => {
    const header = 'Tenant,Provider,Protocol,JIT,SCIM,MFA,Cert Expiry,Status\n';
    const rows = SSO_INTEGRATIONS.map(i => {
        return `${i.tenant_name},${i.provider_name},${i.protocol},${i.jit_enabled},${i.scim_enabled},${i.mfa_required},${i.certificate_expiry},${i.status}`;
    }).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=sso_integrations.csv');
    res.send(header + rows);
};

exports.exportExcel = (req, res) => {
    res.json({ success: true, message: 'Excel export generated.', download_url: '#' });
};
