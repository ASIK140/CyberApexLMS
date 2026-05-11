'use client';
import React, { useState, useEffect, useCallback } from 'react';
import RoleLayout, { NavSection } from '@/components/layout/RoleLayout';
import { apiFetch } from '@/utils/api';

const navSections: NavSection[] = [
    {
        title: 'OVERVIEW',
        items: [
            { label: 'Dashboard', href: '/tenant-admin/dashboard', icon: '📊' },
        ],
    },
    {
        title: 'USERS',
        items: [
            { label: 'User Management', href: '/tenant-admin', icon: '👥' },
            { label: 'Group Management', href: '/tenant-admin/groups', icon: '🏢' },
            { label: 'Import / SCIM Sync', href: '/tenant-admin/import', icon: '📤' },
        ],
    },
    {
        title: 'TRAINING',
        items: [
            { label: 'Courses', href: '/tenant-admin/courses', icon: '📚' },
            { label: 'Reports', href: '/tenant-admin/reports', icon: '📈' },
        ],
    },
    {
        title: 'PHISHING',
        items: [
            { label: 'Phishing Simulator', href: '/tenant-admin/phishing', icon: '🎣' },
            { label: 'Email Templates', href: '/tenant-admin/email-templates', icon: '✉️' },
        ],
    },
    {
        title: 'CONFIGURATION',
        items: [
            { label: 'Settings', href: '/tenant-admin/settings', icon: '⚙️' },
            { label: 'SSO Configuration', href: '/tenant-admin/sso', icon: '🔑' },
        ],
    },
];

const TRIGGERS = [
    { value: 'phishing_click',       label: '🎣 User Clicks Phishing Link' },
    { value: 'credential_submitted', label: '🔑 Credential Submitted' },
    { value: 'training_overdue',     label: '⏰ Training Overdue' },
    { value: 'exam_failed',          label: '❌ Exam Failed' },
    { value: 'new_user_scim',        label: '👤 New User Created (SCIM)' },
    { value: 'high_risk_score',      label: '⚠️ High Risk Score Detected' },
];

const ACTIONS = [
    { value: 'assign_training',   label: '📚 Assign Training Module' },
    { value: 'auto_enroll',       label: '🎓 Auto-Enroll Course' },
    { value: 'slack_dm',          label: '💬 Slack DM to User' },
    { value: 'email_user',        label: '📧 Email User' },
    { value: 'email_hr',          label: '📨 Email HR Team' },
    { value: 'email_supervisor',  label: '👔 Email Supervisor' },
    { value: 'notify_ciso',       label: '🚨 Notify CISO' },
    { value: 'notify_supervisor', label: '📣 Notify Supervisor' },
    { value: 'create_ticket',     label: '🎫 Create ITSM Ticket' },
];

const TRIGGER_COND_FIELDS: Record<string, { key: string; label: string; placeholder: string }[]> = {
    phishing_click:       [{ key: 'click_count', label: 'Min Clicks', placeholder: '1' }],
    training_overdue:     [{ key: 'overdue_days', label: 'Min Days Overdue', placeholder: '7' }],
    exam_failed:          [{ key: 'fail_attempts', label: 'Min Fail Attempts', placeholder: '2' }],
    high_risk_score:      [{ key: 'risk_score', label: 'Min Risk Score', placeholder: '75' }],
    credential_submitted: [],
    new_user_scim:        [],
};

const ACTION_EXTRA: Record<string, { key: string; label: string; placeholder: string }> = {
    assign_training:   { key: 'module',   label: 'Module Code',    placeholder: 'PHISH-01' },
    auto_enroll:       { key: 'course',   label: 'Course Name',    placeholder: 'Security Awareness 101' },
    slack_dm:          { key: 'message',  label: 'DM Message',     placeholder: 'Your training is overdue...' },
    email_user:        { key: 'subject',  label: 'Email Subject',  placeholder: 'Action Required' },
    email_hr:          { key: 'subject',  label: 'Email Subject',  placeholder: 'Compliance Escalation' },
    email_supervisor:  { key: 'subject',  label: 'Email Subject',  placeholder: 'High Risk User Report' },
    notify_ciso:       { key: 'message',  label: 'Alert Message',  placeholder: 'Immediate risk detected' },
    notify_supervisor: { key: 'message',  label: 'Alert Message',  placeholder: 'User needs attention' },
    create_ticket:     { key: 'priority', label: 'Priority',       placeholder: 'critical' },
};

const SEVERITY_COLORS: Record<string, string> = {
    info:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
    warning: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    error:   'text-red-400 bg-red-500/10 border-red-500/20',
};

type Rule = { id: string; name: string; trigger_type: string; conditions_json: any; actions_json: any[]; status: string; fires_30d: number; last_fired?: string };

const EMPTY_FORM = { name: '', trigger_type: 'phishing_click', conditions_json: {} as any, actions_json: [{ type: 'assign_training', module: '' }] as any[] };

export default function AdaptiveRulesPage() {
    const [rules, setRules] = useState<Rule[]>([]);
    const [stats, setStats] = useState<any>({});
    const [logs, setLogs] = useState<any[]>([]);
    const [executions, setExecutions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState<string | null>(null);
    const [simRunning, setSimRunning] = useState(false);
    const [simResult, setSimResult] = useState<any>(null);
    const [tickRunning, setTickRunning] = useState(false);
    const [activeTab, setActiveTab] = useState<'rules' | 'logs' | 'executions'>('rules');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'warning' } | null>(null);
    const [simForm, setSimForm] = useState({ trigger_type: 'phishing_click', user_id: 'alice@acme.com', click_count: '', overdue_days: '', fail_attempts: '', risk_score: '' });

    const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const loadData = useCallback(async () => {
        try {
            const [r1, r2, r3] = await Promise.all([
                apiFetch('/tenant/rules/list').then(r => r.json()),
                apiFetch('/tenant/rules/logs').then(r => r.json()),
                apiFetch('/tenant/rules/executions').then(r => r.json()),
            ]);
            if (r1.success) { setRules(r1.data); setStats(r1.stats); }
            if (r2.success) setLogs(r2.data);
            if (r3.success) setExecutions(r3.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const openNew = () => { setForm(EMPTY_FORM); setEditingRule(null); setShowNewModal(true); };
    const openEdit = (rule: Rule) => {
        setForm({ name: rule.name, trigger_type: rule.trigger_type, conditions_json: rule.conditions_json || {}, actions_json: rule.actions_json || [] });
        setEditingRule(rule);
        setShowNewModal(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { showToast('Rule name is required', 'error'); return; }
        setSaving(true);
        try {
            const isEdit = !!editingRule;
            const url    = isEdit ? `/tenant/rules/update/${editingRule!.id}` : '/tenant/rules/create';
            const method = isEdit ? 'PUT' : 'POST';
            const res    = await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
            const d      = await res.json();
            if (!d.success) throw new Error(d.message);
            showToast(isEdit ? '✅ Rule updated' : '✅ Rule created');
            setShowNewModal(false);
            await loadData();
        } catch (e: any) { showToast(e.message, 'error'); }
        finally { setSaving(false); }
    };

    const handleToggle = async (rule: Rule) => {
        setToggling(rule.id);
        try {
            const res = await apiFetch('/tenant/rules/toggle', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: rule.id }) });
            const d   = await res.json();
            if (!d.success) throw new Error(d.message);
            showToast(d.message, d.status === 'active' ? 'success' : 'warning');
            await loadData();
        } catch (e: any) { showToast(e.message, 'error'); }
        finally { setToggling(null); }
    };

    const handleDelete = async (rule: Rule) => {
        if (!confirm(`Delete rule "${rule.name}"? This cannot be undone.`)) return;
        try {
            const res = await apiFetch(`/tenant/rules/delete/${rule.id}`, { method: 'DELETE' });
            const d   = await res.json();
            if (!d.success) throw new Error(d.message);
            showToast('Rule deleted');
            await loadData();
        } catch (e: any) { showToast(e.message, 'error'); }
    };

    const handleSimulate = async () => {
        setSimRunning(true);
        setSimResult(null);
        try {
            const context: any = {};
            if (simForm.click_count)   context.click_count   = Number(simForm.click_count);
            if (simForm.overdue_days)  context.overdue_days  = Number(simForm.overdue_days);
            if (simForm.fail_attempts) context.fail_attempts = Number(simForm.fail_attempts);
            if (simForm.risk_score)    context.risk_score    = Number(simForm.risk_score);

            const res = await apiFetch('/tenant/rules/simulate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trigger_type: simForm.trigger_type, user_id: simForm.user_id, context })
            });
            const d = await res.json();
            setSimResult(d);
            if (d.success) { showToast(`✅ Simulation complete: ${d.executions?.length || 0} rules evaluated`); await loadData(); }
        } catch (e: any) { showToast(e.message, 'error'); }
        finally { setSimRunning(false); }
    };

    const handleSchedulerTick = async () => {
        setTickRunning(true);
        try {
            const res = await apiFetch('/tenant/rules/scheduler/tick', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            const d   = await res.json();
            if (d.success) { showToast(`⚡ Scheduler tick: ${d.fired}/${d.evaluated} rules fired`); await loadData(); }
        } catch (e: any) { showToast(e.message, 'error'); }
        finally { setTickRunning(false); }
    };

    const updateFormAction = (idx: number, key: string, val: string) => {
        const updated = [...form.actions_json];
        updated[idx] = { ...updated[idx], [key]: val };
        setForm({ ...form, actions_json: updated });
    };

    const addAction    = () => setForm({ ...form, actions_json: [...form.actions_json, { type: 'email_user', subject: '' }] });
    const removeAction = (idx: number) => setForm({ ...form, actions_json: form.actions_json.filter((_, i) => i !== idx) });

    const condFields = TRIGGER_COND_FIELDS[form.trigger_type] || [];

    if (loading) return (
        <RoleLayout title="Adaptive Rules Engine" subtitle="Automated triggers that fire when risk conditions are met" accentColor="purple" avatarText="TA" avatarGradient="bg-gradient-to-tr from-purple-500 to-blue-500" userName="Tenant Admin" userEmail="admin@acme.com" navSections={navSections} currentRole="tenant-admin">
            <div className="flex items-center justify-center h-[60vh] text-slate-500">
                <div className="text-center"><div className="text-5xl mb-4 animate-spin">⚙️</div><p>Loading Rules Engine...</p></div>
            </div>
        </RoleLayout>
    );

    return (
        <RoleLayout title="Adaptive Rules Engine" subtitle="Automated triggers that fire when risk conditions are met" accentColor="purple" avatarText="TA" avatarGradient="bg-gradient-to-tr from-purple-500 to-blue-500" userName="Tenant Admin" userEmail="admin@acme.com" navSections={navSections} currentRole="tenant-admin">
            <div className="min-h-screen bg-slate-50 p-8">

                {/* ─── TOAST ──────────────────────────────────────────── */}
                {toast && (
                    <div className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-sm max-w-md ${toast.type === 'success' ? 'bg-green-600 text-white' : toast.type === 'warning' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'}`}>
                        {toast.msg}
                    </div>
                )}

                {/* ─── NEW / EDIT RULE MODAL ───────────────────────────── */}
                {showNewModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                        <div className="bg-white shadow-sm border border-slate-300 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center z-10">
                                <div>
                                    <h2 className="text-lg font-black text-slate-900">{editingRule ? '✏️ Edit Rule' : '➕ New Rule'}</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Define trigger → condition → actions</p>
                                </div>
                                <button onClick={() => setShowNewModal(false)} className="text-2xl text-slate-500 hover:text-slate-900">×</button>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Rule Name <span className="text-red-400">*</span></label>
                                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Phishing Repeat Offender – Escalate" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:border-blue-500 focus:outline-none" />
                                </div>

                                {/* Trigger */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Trigger Event <span className="text-red-400">*</span></label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TRIGGERS.map(t => (
                                            <button key={t.value} onClick={() => setForm({ ...form, trigger_type: t.value, conditions_json: {} })} className={`py-2.5 px-4 rounded-xl border text-sm font-bold text-left transition ${form.trigger_type === t.value ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-neutral-600'}`}>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Conditions */}
                                {condFields.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Conditions</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {condFields.map(f => (
                                                <div key={f.key}>
                                                    <label className="block text-[10px] text-slate-500 mb-1">{f.label} (≥)</label>
                                                    <input type="number" value={form.conditions_json[f.key]?.gte || ''} onChange={e => setForm({ ...form, conditions_json: { ...form.conditions_json, [f.key]: { gte: Number(e.target.value) } } })} placeholder={f.placeholder} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-blue-500 focus:outline-none" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-slate-600 uppercase">Actions <span className="text-red-400">*</span></label>
                                        <button onClick={addAction} className="text-xs text-blue-400 hover:text-blue-300 font-bold transition">+ Add Action</button>
                                    </div>
                                    <div className="space-y-3">
                                        {form.actions_json.map((action, idx) => {
                                            const extra = ACTION_EXTRA[action.type];
                                            return (
                                                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3">
                                                    <div className="flex-1 space-y-2">
                                                        <select value={action.type} onChange={e => updateFormAction(idx, 'type', e.target.value)} className="w-full bg-white shadow-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-blue-500 focus:outline-none">
                                                            {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                                                        </select>
                                                        {extra && (
                                                            <input value={action[extra.key] || ''} onChange={e => updateFormAction(idx, extra.key, e.target.value)} placeholder={`${extra.label}: ${extra.placeholder}`} className="w-full bg-white shadow-sm border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-sm focus:border-blue-500 focus:outline-none" />
                                                        )}
                                                    </div>
                                                    {form.actions_json.length > 1 && (
                                                        <button onClick={() => removeAction(idx)} className="text-red-500 hover:text-red-400 text-xl self-start">×</button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                                <button onClick={() => setShowNewModal(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl border border-slate-300 hover:bg-slate-100">Cancel</button>
                                <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                    {saving ? '⏳ Saving...' : editingRule ? '💾 Update Rule' : '✨ Create Rule'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── HEADER ─────────────────────────────────────────── */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Adaptive Rules Engine</h1>
                        <p className="text-slate-500 text-sm mt-1">Automated triggers that fire when risk conditions are met</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleSchedulerTick} disabled={tickRunning} className="px-5 py-2.5 bg-purple-700/40 hover:bg-purple-700/60 border border-purple-500/40 text-purple-300 text-sm font-bold rounded-xl transition flex items-center gap-2">
                            ⚡ {tickRunning ? 'Running...' : 'Simulate 15-min Tick'}
                        </button>
                        <button onClick={openNew} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.35)] transition">
                            ➕ New Rule
                        </button>
                    </div>
                </div>

                {/* ─── STATUS BANNER ───────────────────────────────────── */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Rules', val: stats.total || 0, color: 'text-slate-900', icon: '📋' },
                        { label: 'Active Rules', val: stats.active || 0, color: 'text-green-400', icon: '✅' },
                        { label: 'Fires This Month', val: stats.total_fires_30d || 0, color: 'text-blue-400', icon: '🔥' },
                        { label: 'Evaluation Frequency', val: stats.schedule_interval || '15 min', color: 'text-purple-400', icon: '⏱️' },
                    ].map(s => (
                        <div key={s.label} className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 flex items-center gap-4">
                            <span className="text-2xl">{s.icon}</span>
                            <div>
                                <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                                <div className="text-xs text-slate-500">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ─── SIMULATE TRIGGER PANEL ─────────────────────────── */}
                <div className="bg-white shadow-sm border border-orange-500/20 rounded-2xl p-6 mb-8">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">🧪 Simulate Trigger Event</h2>
                    <div className="grid grid-cols-6 gap-4 items-end">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Trigger Type</label>
                            <select value={simForm.trigger_type} onChange={e => setSimForm({ ...simForm, trigger_type: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:border-orange-500 focus:outline-none">
                                {TRIGGERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 uppercase mb-2">User ID</label>
                            <input value={simForm.user_id} onChange={e => setSimForm({ ...simForm, user_id: e.target.value })} placeholder="alice@acme.com" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:border-orange-500 focus:outline-none" />
                        </div>
                        {[{ key: 'click_count', label: 'Clicks' }, { key: 'overdue_days', label: 'Overdue Days' }, { key: 'fail_attempts', label: 'Fail Attempts' }].map(f => (
                            <div key={f.key}>
                                <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{f.label}</label>
                                <input type="number" value={(simForm as any)[f.key]} onChange={e => setSimForm({ ...simForm, [f.key]: e.target.value })} placeholder="0" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 text-sm focus:border-orange-500 focus:outline-none" />
                            </div>
                        ))}
                        <button onClick={handleSimulate} disabled={simRunning} className="py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white text-sm font-black rounded-xl transition shadow-[0_0_10px_rgba(234,88,12,0.4)]">
                            {simRunning ? '⏳...' : '▶ Run'}
                        </button>
                    </div>

                    {/* Sim Results */}
                    {simResult && (
                        <div className="mt-4 border-t border-slate-200 pt-4">
                            <p className="text-xs font-bold text-slate-600 uppercase mb-2">Results — {simResult.rules_evaluated} rules evaluated</p>
                            <div className="space-y-2">
                                {simResult.executions?.map((e: any, i: number) => (
                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border text-xs ${e.status === 'executed' ? 'bg-green-500/5 border-green-500/20' : 'bg-slate-50 border-slate-200'}`}>
                                        <span>{e.status === 'executed' ? '✅' : '⏭️'}</span>
                                        <span className="font-bold text-slate-700">{e.rule_name}</span>
                                        <span className="text-slate-500">{e.status === 'skipped' ? `skipped: ${e.reason}` : `${e.actions?.length || 0} action(s) executed`}</span>
                                        {e.actions && e.actions.map((a: any, ai: number) => (
                                            <span key={ai} className="ml-auto text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">{a.label}</span>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ─── TABS ───────────────────────────────────────────── */}
                <div className="flex gap-1 mb-4 bg-white shadow-sm rounded-xl p-1 w-fit border border-slate-200">
                    {[{ key: 'rules', label: '📋 Rules Table' }, { key: 'logs', label: '🗒️ Rule Logs' }, { key: 'executions', label: '⚡ Executions' }].map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key as any)} className={`px-5 py-2 text-sm font-bold rounded-lg transition ${activeTab === t.key ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>{t.label}</button>
                    ))}
                </div>

                {/* ─── RULES TABLE ────────────────────────────────────── */}
                {activeTab === 'rules' && (
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    {['Rule Name', 'Trigger', 'Actions', 'Fires (30D)', 'Last Fired', 'Status', 'Controls'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {rules.map((rule, i) => (
                                    <tr key={rule.id} className={`border-b border-slate-200 hover:bg-slate-100/40 transition ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-slate-900">{rule.name}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-1 rounded-full font-bold">
                                                {TRIGGERS.find(t => t.value === rule.trigger_type)?.label || rule.trigger_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(rule.actions_json || []).slice(0, 2).map((a: any, ai: number) => (
                                                    <span key={ai} className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded font-bold">
                                                        {ACTIONS.find(ac => ac.value === a.type)?.label?.split(' ').slice(1).join(' ') || a.type}
                                                    </span>
                                                ))}
                                                {rule.actions_json?.length > 2 && <span className="text-[10px] text-slate-500">+{rule.actions_json.length - 2}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`font-black ${(rule.fires_30d || 0) > 50 ? 'text-red-400' : (rule.fires_30d || 0) > 20 ? 'text-yellow-400' : 'text-green-400'}`}>{rule.fires_30d || 0}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {rule.last_fired ? new Date(rule.last_fired).toLocaleString() : 'Never'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-black px-2 py-1 rounded-full border ${rule.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                                                {rule.status === 'active' ? '● Active' : '○ Paused'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => handleToggle(rule)} disabled={toggling === rule.id} className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition ${rule.status === 'active' ? 'bg-amber-900/30 text-amber-400 border-amber-700/40 hover:bg-amber-900/50' : 'bg-green-900/30 text-green-400 border-green-700/40 hover:bg-green-900/50'}`}>
                                                    {toggling === rule.id ? '...' : rule.status === 'active' ? '⏸ Pause' : '▶ Resume'}
                                                </button>
                                                <button onClick={() => openEdit(rule)} className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-100 transition">✏️</button>
                                                <button onClick={() => handleDelete(rule)} className="px-3 py-1.5 text-xs font-bold rounded-lg border bg-red-900/30 text-red-400 border-red-800/40 hover:bg-red-900/50 transition">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ─── LOGS TAB ───────────────────────────────────────── */}
                {activeTab === 'logs' && (
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6">
                        <div className="space-y-2 max-h-[500px] overflow-y-auto">
                            {logs.length === 0 ? <p className="text-slate-500 text-sm text-center py-10">No logs yet. Run a simulation to generate entries.</p>
                                : logs.map((log: any) => (
                                    <div key={log.id} className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.info}`}>
                                        <span>{log.severity === 'info' ? 'ℹ️' : log.severity === 'warning' ? '⚠️' : '❌'}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-slate-700 truncate">{log.message}</p>
                                            <p className="text-neutral-600 text-[10px] mt-0.5">{new Date(log.timestamp).toLocaleString()} · Rule ID: {log.rule_id?.substring(0, 8)}...</p>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* ─── EXECUTIONS TAB ─────────────────────────────────── */}
                {activeTab === 'executions' && (
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
                        {executions.length === 0 ? <p className="text-slate-500 text-sm text-center py-10">No executions yet. Simulate a trigger event to see results here.</p> : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        {['Rule ID', 'User', 'Status', 'Actions Taken', 'Timestamp'].map(h => (
                                            <th key={h} className="text-left px-4 py-3 text-xs font-black text-slate-600 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {executions.map((ex: any) => {
                                        let parsed: any[] = [];
                                        try { parsed = JSON.parse(ex.result || '[]'); } catch {}
                                        return (
                                            <tr key={ex.id} className="border-b border-slate-200 hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-mono text-xs text-slate-600">{ex.rule_id?.substring(0, 12)}...</td>
                                                <td className="px-4 py-3 text-slate-700">{ex.user_id}</td>
                                                <td className="px-4 py-3"><span className={`text-xs font-black px-2 py-0.5 rounded-full border ${ex.status === 'success' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{ex.status}</span></td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {parsed.map((a: any, ai: number) => <span key={ai} className="text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded">{a.label || a.type}</span>)}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-500">{new Date(ex.timestamp).toLocaleString()}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </RoleLayout>
    );
}
