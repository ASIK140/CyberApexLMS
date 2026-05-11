'use strict';
const { v4: uuidv4 } = require('uuid');

const NOTIFICATIONS = [
    { notification_id: 'notif_001', type: 'escalation', title: 'Critical Escalation: Acme Corp', message: 'Finance dept phishing click rate exceeded 30% threshold.', tenant_id: 'tenant_001', severity: 'critical', read: false, created_at: '2026-03-12T18:47:00Z' },
    { notification_id: 'notif_002', type: 'billing', title: 'Renewal Reminder: MedGroup Ltd', message: 'Subscription renewal due in 5 days. Invoice value: $2,340.', tenant_id: 'tenant_002', severity: 'medium', read: false, created_at: '2026-03-12T12:00:00Z' },
    { notification_id: 'notif_003', type: 'compliance', title: 'Compliance Alert: DORA Gap', message: 'MedGroup Ltd DORA Article 13 compliance at 48% — deadline Apr 30.', tenant_id: 'tenant_002', severity: 'high', read: true, created_at: '2026-03-11T09:15:00Z' },
    { notification_id: 'notif_004', type: 'system', title: 'Platform Health: API Rate Limit', message: '/auth endpoint rate limit exceeded. Auto-throttled.', tenant_id: null, severity: 'high', read: false, created_at: '2026-03-12T17:45:00Z' },
];

exports.list = (req, res) => {
    const { read, type } = req.query;
    let data = [...NOTIFICATIONS];
    if (read !== undefined) data = data.filter(n => n.read === (read === 'true'));
    if (type) data = data.filter(n => n.type === type);
    res.json({ success: true, count: data.length, unread_count: data.filter(n => !n.read).length, data });
};

exports.create = (req, res) => {
    const { type, title, message, tenant_id, severity } = req.body;
    if (!type || !title || !message) return res.status(400).json({ success: false, message: 'type, title and message required.' });
    const notif = { notification_id: 'notif_' + uuidv4().slice(0, 6), type, title, message, tenant_id: tenant_id || null, severity: severity || 'info', read: false, created_at: new Date().toISOString() };
    NOTIFICATIONS.push(notif);
    res.status(201).json({ success: true, message: 'Notification sent.', data: notif });
};

exports.markRead = (req, res) => {
    const idx = NOTIFICATIONS.findIndex(n => n.notification_id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Notification not found.' });
    NOTIFICATIONS[idx].read = true;
    res.json({ success: true, message: 'Marked as read.', data: NOTIFICATIONS[idx] });
};

exports.markAllRead = (req, res) => {
    NOTIFICATIONS.forEach(n => { n.read = true; });
    res.json({ success: true, message: 'All notifications marked as read.' });
};

exports.bulkCreate = (req, res) => {
    const { notifications } = req.body;
    if (!Array.isArray(notifications)) return res.status(400).json({ success: false, message: 'notifications array required.' });
    
    const created = notifications.map(n => {
        const notif = { 
            notification_id: 'notif_' + uuidv4().slice(0, 6), 
            type: n.type || 'info', 
            title: n.title, 
            message: n.message, 
            tenant_id: n.tenant_id || null, 
            severity: n.severity || 'info', 
            read: false, 
            created_at: new Date().toISOString() 
        };
        NOTIFICATIONS.push(notif);
        return notif;
    });
    
    res.status(201).json({ success: true, message: `${created.length} notifications sent.`, data: created });
};
