'use strict';

const EMAIL_STATS = {
    emails_sent_today: 12450,
    emails_delivered_today: 12248,
    emails_bounced_today: 98,
    spam_reports_today: 14,
    opens_today: 7840,
    delivery_rate_pct: 98.4,
    bounce_rate_pct: 0.79,
    spam_rate_pct: 0.11,
    open_rate_pct: 63.9,
};

const EMAIL_LOGS = [
    { log_id: 'elog_001', tenant_id: 'tenant_001', recipient: 'alice@acme.com', subject: 'Phishing Campaign: IT Support Alert', status: 'delivered', sent_at: '2026-03-12T14:30:00Z', type: 'phishing_simulation' },
    { log_id: 'elog_002', tenant_id: 'tenant_001', recipient: 'dan@acme.com', subject: 'Phishing Campaign: IT Support Alert', status: 'clicked', sent_at: '2026-03-12T14:31:00Z', type: 'phishing_simulation' },
    { log_id: 'elog_003', tenant_id: 'tenant_002', recipient: 'grace@medgroup.com', subject: 'Training Reminder: GDPR Module Overdue', status: 'delivered', sent_at: '2026-03-12T10:00:00Z', type: 'training_reminder' },
    { log_id: 'elog_004', tenant_id: 'tenant_001', recipient: 'ciso@acme.com', subject: 'Q1 2026 Compliance Report', status: 'opened', sent_at: '2026-03-11T16:00:00Z', type: 'report' },
];

exports.getDeliverability = (req, res) => {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    res.json({
        success: true,
        data: {
            current: EMAIL_STATS,
            monthly_trend: months.map((m, i) => ({
                month: m,
                sent: 8000 + i * 800,
                delivered: Math.round((8000 + i * 800) * 0.984),
                bounced: Math.round((8000 + i * 800) * 0.008),
                opened: Math.round((8000 + i * 800) * 0.62),
            })),
            domain_health: {
                spf: 'pass', dkim: 'pass', dmarc: 'pass',
                blacklist_status: 'clean', reputation_score: 96,
            },
        },
    });
};

exports.getLogs = (req, res) => {
    const { tenant_id, type, status } = req.query;
    let data = [...EMAIL_LOGS];
    if (tenant_id) data = data.filter(l => l.tenant_id === tenant_id);
    if (type) data = data.filter(l => l.type === type);
    if (status) data = data.filter(l => l.status === status);
    res.json({ success: true, count: data.length, data });
};
