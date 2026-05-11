'use strict';

const { v4: uuidv4 } = require('uuid');
const ExportUtil = require('../utils/exportUtility');

let AUDIT_LOGS = [
    { log_id: uuidv4(), timestamp: '2026-03-15T22:10:00Z', actor_name: 'James Okonkwo', actor_role: 'SuperAdmin', action: 'TenantSuspended', target: 'TechNova Inc.', tenant_id: 'tenant_002', ip_address: '91.22.45.1', result: 'Success', metadata: { reason: 'Policy Violation' } },
    { log_id: uuidv4(), timestamp: '2026-03-15T21:45:00Z', actor_name: 'Robot-X', actor_role: 'Automated', action: 'APIKeyRotated', target: 'System', tenant_id: null, ip_address: '127.0.0.1', result: 'Success', metadata: { key_id: 'key_998' } },
    { log_id: uuidv4(), timestamp: '2026-03-15T20:30:00Z', actor_name: 'Sarah Chen', actor_role: 'CISO', action: 'SecurityAlert', target: 'DMARC Failure: Simulation Domain', tenant_id: 'tenant_001', ip_address: '10.0.4.12', result: 'Critical', metadata: { domain: 'secure-mail.net' } },
    { log_id: uuidv4(), timestamp: '2026-03-15T19:15:00Z', actor_name: 'Michael Hudson', actor_role: 'TenantAdmin', action: 'CoursePublished', target: 'Phishing 101: Advanced Defense', tenant_id: 'tenant_002', ip_address: '192.168.1.5', result: 'Success', metadata: { module_id: 'mod_442' } },
    { log_id: uuidv4(), timestamp: '2026-03-15T18:00:00Z', actor_name: 'James Okonkwo', actor_role: 'SuperAdmin', action: 'NGOApproved', target: 'Global Health Alliance', tenant_id: null, ip_address: '91.22.45.1', result: 'Success', metadata: { subsidy: '80%' } },
];

exports.logEvent = (params) => {
    const newLog = {
        log_id: uuidv4(),
        timestamp: new Date().toISOString(),
        actor_name: params.actor || 'System',
        actor_role: params.role || 'Automated',
        action: params.action || 'SystemEvent',
        target: params.target || 'N/A',
        tenant_id: params.tenant_id || null,
        ip_address: params.ip || '0.0.0.0',
        result: params.result || 'Success',
        metadata: params.metadata || {},
        created_at: new Date().toISOString()
    };
    AUDIT_LOGS.unshift(newLog);
    return newLog;
};

exports.list = (req, res) => {
    const { role, actor, action, result, tenant_id, date_from, date_to } = req.query;
    let filtered = [...AUDIT_LOGS];

    if (role) filtered = filtered.filter(l => l.actor_role === role);
    if (actor) filtered = filtered.filter(l => l.actor_name.toLowerCase().includes(actor.toLowerCase()));
    if (action) filtered = filtered.filter(l => l.action === action);
    if (result) filtered = filtered.filter(l => l.result === result);
    if (tenant_id) filtered = filtered.filter(l => l.tenant_id === tenant_id);
    if (date_from) filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(date_from));
    if (date_to) filtered = filtered.filter(l => new Date(l.timestamp) <= new Date(date_to));

    res.json({ success: true, data: filtered, total: filtered.length });
};

exports.exportLogs = async (req, res) => {
    try {
        const { role, actor, action, result, tenant_id, date_from, date_to, format = 'csv' } = req.query;
        let filtered = [...AUDIT_LOGS];

        if (role) filtered = filtered.filter(l => l.actor_role === role);
        if (actor) filtered = filtered.filter(l => l.actor_name.toLowerCase().includes(actor.toLowerCase()));
        if (action) filtered = filtered.filter(l => l.action === action);
        if (result) filtered = filtered.filter(l => l.result === result);
        if (tenant_id) filtered = filtered.filter(l => l.tenant_id === tenant_id);
        if (date_from) filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(date_from));
        if (date_to) filtered = filtered.filter(l => new Date(l.timestamp) <= new Date(date_to));

        const columns = [
            { header: 'Timestamp', key: 'timestamp', width: 120 },
            { header: 'Actor', key: 'actor_name', width: 100 },
            { header: 'Role', key: 'actor_role', width: 80 },
            { header: 'Action', key: 'action', width: 120 },
            { header: 'Target', key: 'target', width: 150 },
            { header: 'IP Address', key: 'ip_address', width: 100 },
            { header: 'Result', key: 'result', width: 80 }
        ];

        const filename = `platform_audit_log_${new Date().toISOString().split('T')[0]}`;

        if (format === 'pdf') {
            const pdfColumns = columns.filter(c => ['timestamp', 'actor_name', 'action', 'target', 'result'].includes(c.key));
            return await ExportUtil.generatePDF(res, 'Platform Audit Log', pdfColumns, filtered, `${filename}.pdf`);
        } else if (format === 'excel') {
            return await ExportUtil.generateExcel(res, 'Platform Audit Log', columns, filtered, `${filename}.xlsx`);
        } else {
            return ExportUtil.generateCSV(res, columns, filtered, `${filename}.csv`);
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
