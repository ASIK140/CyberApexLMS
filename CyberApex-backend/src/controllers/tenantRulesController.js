'use strict';
const { v4: uuidv4 } = require('uuid');
const { Rule, RuleExecution, RuleLog } = require('../models');

const TENANT_ID = 'tenant_acme';
const getTenantId = (req) => req.user?.tenant_id || TENANT_ID;

// ─── Pre-seeded rule templates ─────────────────────────────────────────────────
const SEED_RULES = [
    {
        name: 'Phishing Click – Auto-Enroll Basic Training',
        trigger_type: 'phishing_click',
        conditions_json: { click_count: { gte: 1 }, window_days: 90 },
        actions_json: [{ type: 'assign_training', module: 'PHISH-01', reason: 'Clicked phishing link' }],
        status: 'active',
        fires_30d: 47,
    },
    {
        name: 'Repeat Phishing Clicker – Escalate to Supervisor',
        trigger_type: 'phishing_click',
        conditions_json: { click_count: { gte: 3 }, window_days: 90 },
        actions_json: [{ type: 'notify_supervisor', message: 'User clicked phishing links 3+ times in 90 days' }, { type: 'assign_training', module: 'PHISH-ADVANCED' }],
        status: 'active',
        fires_30d: 12,
    },
    {
        name: 'Training Overdue 7 Days – Slack Reminder',
        trigger_type: 'training_overdue',
        conditions_json: { overdue_days: { gte: 7 } },
        actions_json: [{ type: 'slack_dm', message: 'Your training is overdue. Please complete it now.' }],
        status: 'active',
        fires_30d: 89,
    },
    {
        name: 'Training Overdue 14 Days – HR Escalation',
        trigger_type: 'training_overdue',
        conditions_json: { overdue_days: { gte: 14 } },
        actions_json: [{ type: 'email_hr', subject: 'Training Compliance Escalation' }, { type: 'notify_ciso', message: 'User 14+ days overdue on compliance training' }],
        status: 'active',
        fires_30d: 31,
    },
    {
        name: 'Exam Failed Twice – Assign Remediation Module',
        trigger_type: 'exam_failed',
        conditions_json: { fail_attempts: { gte: 2 } },
        actions_json: [{ type: 'assign_training', module: 'REMEDIATION-01' }, { type: 'email_user', subject: 'Additional Training Required' }],
        status: 'active',
        fires_30d: 18,
    },
    {
        name: 'Credential Submitted – Immediate CISO Alert',
        trigger_type: 'credential_submitted',
        conditions_json: { immediate: true },
        actions_json: [{ type: 'notify_ciso', message: 'User submitted credentials on phishing page – IMMEDIATE RISK' }, { type: 'create_ticket', priority: 'critical' }],
        status: 'active',
        fires_30d: 5,
    },
    {
        name: 'New SCIM User – Auto-Enroll Welcome Course',
        trigger_type: 'new_user_scim',
        conditions_json: { trigger_immediately: true },
        actions_json: [{ type: 'auto_enroll', course: 'Security Awareness 101' }, { type: 'email_user', subject: 'Welcome – Your Security Training is Ready' }],
        status: 'active',
        fires_30d: 24,
    },
    {
        name: 'High Risk Score – Weekly Supervisor Digest',
        trigger_type: 'high_risk_score',
        conditions_json: { risk_score: { gte: 75 }, schedule: 'weekly' },
        actions_json: [{ type: 'email_supervisor', subject: 'High Risk User Report', frequency: 'weekly' }],
        status: 'paused',
        fires_30d: 0,
    },
];

const ACTION_LABELS = {
    assign_training:   'Assign Training',
    notify_supervisor: 'Notify Supervisor',
    notify_ciso:       'Notify CISO',
    email_hr:          'Email HR',
    email_user:        'Email User',
    email_supervisor:  'Email Supervisor',
    slack_dm:          'Slack DM',
    auto_enroll:       'Auto-Enroll Course',
    create_ticket:     'Create ITSM Ticket',
};

const TRIGGER_LABELS = {
    phishing_click:       'User Clicks Phishing Link',
    training_overdue:     'Training Overdue',
    exam_failed:          'Exam Failed',
    credential_submitted: 'Credential Submitted',
    new_user_scim:        'New User Created (SCIM)',
    high_risk_score:      'High Risk Score Detected',
};

const addLog = async (rule_id, message, severity = 'info') => {
    await RuleLog.create({ rule_id, message, severity }).catch(() => {});
};

const ensureRules = async (tenant_id) => {
    const count = await Rule.count({ where: { tenant_id } });
    if (count === 0) {
        await Rule.bulkCreate(SEED_RULES.map(r => ({ ...r, tenant_id })));
    }
};

// ─── List Rules ─────────────────────────────────────────────────────────────
exports.listRules = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        await ensureRules(tenant_id);

        const rules = await Rule.findAll({ where: { tenant_id }, order: [['created_at', 'DESC']] });
        const active = rules.filter(r => r.status === 'active').length;
        const totalFires = rules.reduce((sum, r) => sum + (r.fires_30d || 0), 0);

        res.json({
            success: true,
            data: rules,
            stats: { active, total: rules.length, total_fires_30d: totalFires, schedule_interval: '15 minutes' }
        });
    } catch (err) { next(err); }
};

// ─── Create Rule ─────────────────────────────────────────────────────────────
exports.createRule = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const { name, trigger_type, conditions_json, actions_json } = req.body;

        if (!name?.trim()) return res.status(400).json({ success: false, message: 'Rule name is required' });
        if (!trigger_type) return res.status(400).json({ success: false, message: 'Trigger type is required' });
        if (!actions_json?.length) return res.status(400).json({ success: false, message: 'At least one action is required' });

        const rule = await Rule.create({
            tenant_id, name, trigger_type,
            conditions_json: conditions_json || {},
            actions_json, status: 'active', fires_30d: 0
        });
        await addLog(rule.id, `Rule "${name}" created`, 'info');

        res.status(201).json({ success: true, message: 'Rule created successfully', data: rule });
    } catch (err) { next(err); }
};

// ─── Update Rule ─────────────────────────────────────────────────────────────
exports.updateRule = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const { id } = req.params;
        const updates = req.body;

        const rule = await Rule.findOne({ where: { id, tenant_id } });
        if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });

        await rule.update(updates);
        await addLog(id, `Rule "${rule.name}" updated`, 'info');

        res.json({ success: true, message: 'Rule updated', data: rule });
    } catch (err) { next(err); }
};

// ─── Toggle Pause / Resume ────────────────────────────────────────────────────
exports.toggleRule = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const { id } = req.body;

        const rule = await Rule.findOne({ where: { id, tenant_id } });
        if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });

        const newStatus = rule.status === 'active' ? 'paused' : 'active';
        await rule.update({ status: newStatus });
        await addLog(id, `Rule "${rule.name}" ${newStatus === 'active' ? 'resumed' : 'paused'}`, 'info');

        res.json({ success: true, message: `Rule ${newStatus}`, status: newStatus });
    } catch (err) { next(err); }
};

// ─── Delete Rule ─────────────────────────────────────────────────────────────
exports.deleteRule = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const { id } = req.params;

        const rule = await Rule.findOne({ where: { id, tenant_id } });
        if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });

        const name = rule.name;
        await rule.destroy();
        res.json({ success: true, message: `Rule "${name}" deleted` });
    } catch (err) { next(err); }
};

// ─── Get Logs ─────────────────────────────────────────────────────────────────
exports.getLogs = async (req, res, next) => {
    try {
        const { rule_id } = req.query;
        const where = rule_id ? { rule_id } : {};
        const logs = await RuleLog.findAll({ where, order: [['timestamp', 'DESC']], limit: 100 });
        res.json({ success: true, data: logs });
    } catch (err) { next(err); }
};

// ─── Simulate Trigger ────────────────────────────────────────────────────────
exports.simulateTrigger = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const { trigger_type, user_id = 'user_demo', context = {} } = req.body;

        if (!trigger_type) return res.status(400).json({ success: false, message: 'trigger_type required' });

        const activeRules = await Rule.findAll({ where: { tenant_id, trigger_type, status: 'active' } });
        if (!activeRules.length) return res.json({ success: true, message: `No active rules for trigger: ${trigger_type}`, executions: [] });

        const executions = [];

        for (const rule of activeRules) {
            const cond = rule.conditions_json || {};
            let met = true;

            if (cond.click_count?.gte && context.click_count !== undefined)
                met = context.click_count >= cond.click_count.gte;
            if (cond.overdue_days?.gte && context.overdue_days !== undefined)
                met = context.overdue_days >= cond.overdue_days.gte;
            if (cond.fail_attempts?.gte && context.fail_attempts !== undefined)
                met = context.fail_attempts >= cond.fail_attempts.gte;
            if (cond.risk_score?.gte && context.risk_score !== undefined)
                met = context.risk_score >= cond.risk_score.gte;

            if (!met) {
                executions.push({ rule_id: rule.id, rule_name: rule.name, status: 'skipped', reason: 'Condition not met' });
                continue;
            }

            const actionResults = (rule.actions_json || []).map(a => ({
                type: a.type, label: ACTION_LABELS[a.type] || a.type, status: 'executed',
                detail: a.module || a.message || a.subject || a.course || ''
            }));

            await RuleExecution.create({ rule_id: rule.id, user_id, status: 'success', result: JSON.stringify(actionResults), timestamp: new Date() });
            await rule.update({ fires_30d: (rule.fires_30d || 0) + 1, last_fired: new Date() });
            await addLog(rule.id, `Triggered for user ${user_id}: ${actionResults.length} action(s) executed`, 'info');

            executions.push({ rule_id: rule.id, rule_name: rule.name, status: 'executed', actions: actionResults });
        }

        res.json({ success: true, trigger_type, user_id, rules_evaluated: activeRules.length, executions });
    } catch (err) { next(err); }
};

// ─── Scheduler Tick ──────────────────────────────────────────────────────────
exports.schedulerTick = async (req, res, next) => {
    try {
        const tenant_id = getTenantId(req);
        const rules = await Rule.findAll({ where: { tenant_id, status: 'active' } });

        const results = [];
        for (const rule of rules) {
            const fires = Math.random() > 0.6;
            if (fires) {
                await rule.update({ fires_30d: (rule.fires_30d || 0) + 1, last_fired: new Date() });
                await addLog(rule.id, 'Scheduler tick: rule auto-evaluated and fired', 'info');
                results.push({ rule_name: rule.name, fired: true });
            } else {
                results.push({ rule_name: rule.name, fired: false });
            }
        }

        res.json({ success: true, message: 'Scheduler tick complete', evaluated: rules.length, fired: results.filter(r => r.fired).length, results });
    } catch (err) { next(err); }
};

// ─── Get Executions ───────────────────────────────────────────────────────────
exports.getExecutions = async (req, res, next) => {
    try {
        const { rule_id } = req.query;
        const where = rule_id ? { rule_id } : {};
        const execs = await RuleExecution.findAll({ where, order: [['timestamp', 'DESC']], limit: 100 });
        res.json({ success: true, data: execs });
    } catch (err) { next(err); }
};
