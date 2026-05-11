'use strict';

// ── Mock Data (Aligned with Frontend) ────────────────────────────────────────
let TENANT_STORAGE = [
    {
        id: 'T-001', name: 'Global Finance Ltd.', plan: 'Enterprise', region: 'EU-West',
        isolationZone: 'tenant-001.eu-west.cyberapex.io',
        database: { used: 8.4, quota: 20 },
        fileStore: { used: 14.2, quota: 50 },
        backups: { used: 6.1, quota: 20 },
        logs: { used: 2.8, quota: 10 },
        totalUsed: 31.5, totalQuota: 100,
        lastBackup: '2025-03-07 02:00', encryptionStatus: 'AES-256', dataResidency: 'EU (GDPR)',
        status: 'Healthy',
    },
    {
        id: 'T-002', name: 'Acme Corporation', plan: 'Enterprise', region: 'US-East',
        isolationZone: 'tenant-002.us-east.cyberapex.io',
        database: { used: 6.1, quota: 20 },
        fileStore: { used: 9.4, quota: 50 },
        backups: { used: 4.2, quota: 20 },
        logs: { used: 1.9, quota: 10 },
        totalUsed: 21.6, totalQuota: 100,
        lastBackup: '2025-03-07 02:15', encryptionStatus: 'AES-256', dataResidency: 'US (SOC2)',
        status: 'Healthy',
    },
    {
        id: 'T-003', name: 'TechNova Inc.', plan: 'Pro', region: 'EU-Central',
        isolationZone: 'tenant-003.eu-central.cyberapex.io',
        database: { used: 3.8, quota: 10 },
        fileStore: { used: 18.1, quota: 20 },
        backups: { used: 4.9, quota: 10 },
        logs: { used: 2.1, quota: 5 },
        totalUsed: 28.9, totalQuota: 45,
        lastBackup: '2025-03-07 03:00', encryptionStatus: 'AES-256', dataResidency: 'EU (GDPR)',
        status: 'Warning',
    },
    {
        id: 'T-004', name: 'MediCare Group', plan: 'Pro', region: 'UK',
        isolationZone: 'tenant-004.uk.cyberapex.io',
        database: { used: 2.1, quota: 10 },
        fileStore: { used: 6.8, quota: 20 },
        backups: { used: 2.4, quota: 10 },
        logs: { used: 0.9, quota: 5 },
        totalUsed: 12.2, totalQuota: 45,
        lastBackup: '2025-03-07 02:30', encryptionStatus: 'AES-256', dataResidency: 'UK (NHS)',
        status: 'Healthy',
    },
    {
        id: 'T-005', name: 'SecureBank PLC', plan: 'Enterprise', region: 'UK',
        isolationZone: 'tenant-005.uk.cyberapex.io',
        database: { used: 17.9, quota: 20 },
        fileStore: { used: 44.2, quota: 50 },
        backups: { used: 18.5, quota: 20 },
        logs: { used: 9.1, quota: 10 },
        totalUsed: 89.7, totalQuota: 100,
        lastBackup: '2025-03-07 01:45', encryptionStatus: 'AES-256', dataResidency: 'UK (DORA)',
        status: 'Critical',
    },
    {
        id: 'T-006', name: 'RetailMax', plan: 'Starter', region: 'EU-West',
        isolationZone: 'tenant-006.eu-west.cyberapex.io',
        database: { used: 0.8, quota: 5 },
        fileStore: { used: 4.1, quota: 10 },
        backups: { used: 0.9, quota: 5 },
        logs: { used: 0.4, quota: 2 },
        totalUsed: 6.2, totalQuota: 22,
        lastBackup: '2025-03-07 04:00', encryptionStatus: 'AES-256', dataResidency: 'EU (GDPR)',
        status: 'Healthy',
    },
    {
        id: 'T-007', name: 'LegalShield', plan: 'Starter', region: 'US-East',
        isolationZone: 'tenant-007.us-east.cyberapex.io',
        database: { used: 0.5, quota: 5 },
        fileStore: { used: 2.2, quota: 10 },
        backups: { used: 0.6, quota: 5 },
        logs: { used: 0.3, quota: 2 },
        totalUsed: 3.6, totalQuota: 22,
        lastBackup: '2025-03-07 04:30', encryptionStatus: 'AES-256', dataResidency: 'US (SOC2)',
        status: 'Healthy',
    },
];

const updateStatus = (tenant) => {
    const pct = (tenant.totalUsed / tenant.totalQuota) * 100;
    if (pct >= 90) tenant.status = 'Critical';
    else if (pct >= 70) tenant.status = 'Warning';
    else tenant.status = 'Healthy';
};

exports.getStorageData = (req, res) => {
    res.json({ success: true, data: TENANT_STORAGE });
};

exports.expandStorage = (req, res) => {
    const { id, amount, notes } = req.body;
    const tenant = TENANT_STORAGE.find(t => t.id === id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found.' });

    // amount example: "+25 GB (£15/mo)" or "+50 GB"
    const match = amount.toString().match(/\+(\d+)/);
    const gbs = match ? parseInt(match[1]) : 0;

    if (gbs > 0) {
        tenant.totalQuota += gbs;
        // Expand individual quotas as well to keep breakdown healthy
        tenant.database.quota += Math.round(gbs * 0.2);
        tenant.fileStore.quota += Math.round(gbs * 0.5);
        tenant.backups.quota += Math.round(gbs * 0.2);
        tenant.logs.quota += Math.round(gbs * 0.1);
        
        updateStatus(tenant);
        res.json({ success: true, message: `Successfully expanded storage for ${tenant.name}. New total: ${tenant.totalQuota} GB`, data: tenant });
    } else {
        res.status(400).json({ success: false, message: 'Invalid expansion amount. Value must be like "+25 GB".' });
    }
};
