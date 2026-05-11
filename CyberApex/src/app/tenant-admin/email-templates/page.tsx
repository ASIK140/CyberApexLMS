'use client';
import React, { useState, useEffect } from 'react';
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

const TYPES = ['Awareness', 'Overdue', 'Certificate', 'Welcome', 'Simulation', 'Custom'];

const TYPE_COLORS: Record<string, string> = {
    Awareness: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    Overdue: 'bg-red-500/20 text-red-300 border-red-500/30',
    Certificate: 'bg-green-500/20 text-green-300 border-green-500/30',
    Welcome: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    Simulation: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    Custom: 'bg-neutral-500/20 text-slate-700 border-neutral-500/30',
};

const DEFAULT_BODY: Record<string, string> = {
    Awareness: '<html><body style="font-family:Arial,sans-serif;padding:32px;background:#eff6ff"><div style="max-width:600px;margin:auto;background:#fff;padding:28px;border-radius:10px"><h2 style="color:#1d4ed8">🛡️ Security Awareness</h2><p>Hi {{first_name}},</p><p>Your current risk score is <strong>{{risk_score}}</strong>.</p><p>Completion: <strong>{{completion_pct}}</strong></p><a href="{{training_link}}" style="background:#1d4ed8;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px">View Training →</a></div></body></html>',
    Overdue: '<html><body style="font-family:Arial,sans-serif;padding:32px;background:#fef2f2"><div style="max-width:600px;margin:auto;background:#fff;padding:28px;border-radius:10px;border:2px solid #ef4444"><h2 style="color:#ef4444">⚠️ Training Overdue</h2><p>Hi {{first_name}},</p><p><strong>{{course_name}}</strong> was due on <strong>{{deadline_date}}</strong>.</p><a href="{{training_link}}" style="background:#ef4444;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px">Complete Now →</a></div></body></html>',
    Certificate: '<html><body style="font-family:Georgia,serif;padding:32px;background:#f0fdf4"><div style="max-width:600px;margin:auto;background:#fff;padding:32px;border-radius:10px;border:2px solid #16a34a;text-align:center"><h2 style="color:#16a34a">🏆 Congratulations, {{first_name}}!</h2><p>You have completed <strong>{{course_name}}</strong> with <strong>{{completion_pct}}</strong> completion.</p><a href="{{cert_link}}" style="background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px">Download Certificate →</a></div></body></html>',
    Welcome: '<html><body style="font-family:Arial,sans-serif;padding:32px;background:#f5f5f5"><div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden"><div style="background:#1d4ed8;padding:28px;text-align:center"><h1 style="color:#fff;margin:0">Welcome, {{first_name}}! 👋</h1></div><div style="padding:28px"><p>You have been enrolled in <strong>{{course_name}}</strong>.</p><p>Deadline: <strong>{{deadline_date}}</strong></p><a href="{{training_link}}" style="background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">Start Training →</a></div></div></body></html>',
    Simulation: '<html><body style="font-family:Arial,sans-serif;background:#f3f4f6;padding:32px"><div style="max-width:600px;margin:auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.15)"><div style="background:#1f2937;padding:18px 28px"><h3 style="color:#fff;margin:0">IT Security Notice</h3></div><div style="padding:28px"><p>Dear {{first_name}},</p><p>We detected unusual activity on your account. Immediate action is required.</p><a href="{{training_link}}" style="background:#dc2626;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;display:inline-block;margin:16px 0">Verify Your Account</a><p style="font-size:11px;color:#9ca3af">This is an automated security notification.</p></div></div></body></html>',
    Custom: '<html><body style="font-family:Arial,sans-serif;padding:32px"><p>Hi {{first_name}},</p><p>Your message here.</p><p>Risk Score: {{risk_score}} | Completion: {{completion_pct}}</p><a href="{{training_link}}" style="background:#2563eb;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px">Take Action →</a></body></html>',
};

export default function EmailTemplatesBuilder() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTemplate, setActiveTemplate] = useState<any>(null);
    const [isNewMode, setIsNewMode] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [previewHtml, setPreviewHtml] = useState('');
    const [processing, setProcessing] = useState(false);
    const [showNewModal, setShowNewModal] = useState(false);

    // Modal form state
    const [modalData, setModalData] = useState({ name: '', type: 'Custom', subject: '', from_name: '', from_email: '' });
    const [modalErrors, setModalErrors] = useState<Record<string, string>>({});

    // Editor form state
    const [formData, setFormData] = useState({
        name: '', type: 'Custom', subject: '', from_name: '', from_email: '', body_html: '', body_text: ''
    });

    useEffect(() => { loadTemplates(); }, []);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/tenant/templates');
            const data = await res.json();
            if (data.success) {
                setTemplates(data.data);
                if (data.data.length > 0 && !activeTemplate && !isNewMode) {
                    selectTemplate(data.data[0]);
                }
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const selectTemplate = (t: any) => {
        setActiveTemplate(t);
        setIsNewMode(false);
        setFormData({ name: t.name || '', type: t.type || 'Custom', subject: t.subject || '', from_name: t.from_name || '', from_email: t.from_email || '', body_html: t.body_html || '', body_text: t.body_text || '' });
        setPreviewMode(false);
    };

    // Validate the modal fields
    const validateModal = () => {
        const errs: Record<string, string> = {};
        if (!modalData.name.trim()) errs.name = 'Template name is required';
        if (!modalData.subject.trim()) errs.subject = 'Subject line is required';
        if (!modalData.from_email.trim()) errs.from_email = 'From email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(modalData.from_email)) errs.from_email = 'Enter a valid email address';
        if (!modalData.from_name.trim()) errs.from_name = 'From name is required';
        setModalErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const confirmNewTemplate = () => {
        if (!validateModal()) return;
        setActiveTemplate(null);
        setIsNewMode(true);
        setFormData({
            name: modalData.name,
            type: modalData.type,
            subject: modalData.subject,
            from_name: modalData.from_name,
            from_email: modalData.from_email,
            body_html: DEFAULT_BODY[modalData.type] || DEFAULT_BODY.Custom,
            body_text: `Hi {{first_name}},\n\n${modalData.subject}\n\nLink: {{training_link}}`
        });
        setShowNewModal(false);
        setPreviewMode(false);
    };

    const openNewModal = () => {
        setModalData({ name: '', type: 'Custom', subject: '', from_name: '', from_email: '' });
        setModalErrors({});
        setShowNewModal(true);
    };

    const saveTemplate = async () => {
        if (!formData.name.trim() || !formData.subject.trim()) { alert('Template name and subject are required.'); return; }
        setProcessing(true);
        try {
            const isNew = !activeTemplate?.id;
            const url = isNew ? '/tenant/templates/create' : `/tenant/templates/${activeTemplate.id}`;
            const method = isNew ? 'POST' : 'PUT';
            const res = await apiFetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setIsNewMode(false);
            await loadTemplates();
            if (isNew && data.data) setActiveTemplate(data.data);
            alert(`✅ Template "${formData.name}" ${isNew ? 'created' : 'updated'} successfully`);
        } catch (e: any) {
            alert('❌ ' + (e.message || 'Failed to save template'));
        } finally { setProcessing(false); }
    };

    const deleteTemplate = async () => {
        if (!activeTemplate?.id) return;
        if (!confirm(`Delete "${activeTemplate.name}"? This cannot be undone.`)) return;
        setProcessing(true);
        try {
            const res = await apiFetch(`/tenant/templates/${activeTemplate.id}`, { method: 'DELETE' });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setActiveTemplate(null);
            setIsNewMode(false);
            await loadTemplates();
        } catch (e: any) {
            alert('❌ ' + (e.message || 'Failed to delete template'));
        } finally { setProcessing(false); }
    };

    const generatePreview = async () => {
        setProcessing(true);
        try {
            const res = await apiFetch('/tenant/templates/preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ html_body: formData.body_html }) });
            const data = await res.json();
            if (data.success) { setPreviewHtml(data.previewHtml); setPreviewMode(true); }
        } catch (e: any) { alert('Failed to generate preview'); }
        finally { setProcessing(false); }
    };

    const sendTestEmail = async () => {
        setProcessing(true);
        try {
            const res = await apiFetch('/tenant/templates/test-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to_email: 'admin@local.test', subject: formData.subject, html_body: formData.body_html }) });
            const data = await res.json();
            if (data.success) alert('✅ ' + data.message);
        } catch (e: any) { alert('Failed to send test email'); }
        finally { setProcessing(false); }
    };

    const hasEditor = activeTemplate?.id || isNewMode;

    return (
        <RoleLayout title="Email Templates" subtitle="Tenant Admin · Acme Corporation" accentColor="purple" avatarText="TA" avatarGradient="bg-gradient-to-tr from-purple-500 to-pink-500" userName="Tenant Admin" userEmail="admin@acmecorp.com" navSections={navSections} currentRole="tenant-admin">
            <div className="p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50">

                {/* ─── NEW TEMPLATE MODAL ─── */}
                {showNewModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm">
                        <div className="bg-white shadow-sm border border-slate-300 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                            {/* Modal Header */}
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Create New Template</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">Fill in the required details to start building</p>
                                </div>
                                <button onClick={() => setShowNewModal(false)} className="text-slate-500 hover:text-slate-900 text-2xl leading-none transition">×</button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-5">
                                {/* Template Name */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                        Template Name <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        value={modalData.name}
                                        onChange={e => setModalData({ ...modalData, name: e.target.value })}
                                        className={`w-full bg-slate-50 border rounded-lg px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500 transition ${modalErrors.name ? 'border-red-500' : 'border-slate-300'}`}
                                        placeholder="e.g. Q4 Phishing Lure, Overdue Reminder..."
                                        autoFocus
                                    />
                                    {modalErrors.name && <p className="text-red-400 text-xs mt-1">{modalErrors.name}</p>}
                                </div>

                                {/* Template Type */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                        Template Type <span className="text-red-400">*</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {TYPES.map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setModalData({ ...modalData, type: t })}
                                                className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${modalData.type === t ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-50 border-slate-300 text-slate-600 hover:border-neutral-500'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Subject Line */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                        Subject Line <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        value={modalData.subject}
                                        onChange={e => setModalData({ ...modalData, subject: e.target.value })}
                                        className={`w-full bg-slate-50 border rounded-lg px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500 transition ${modalErrors.subject ? 'border-red-500' : 'border-slate-300'}`}
                                        placeholder="e.g. Action Required: Complete Your Security Training"
                                    />
                                    {modalErrors.subject && <p className="text-red-400 text-xs mt-1">{modalErrors.subject}</p>}
                                </div>

                                {/* From Name & Email */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                            From Name <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            value={modalData.from_name}
                                            onChange={e => setModalData({ ...modalData, from_name: e.target.value })}
                                            className={`w-full bg-slate-50 border rounded-lg px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500 transition ${modalErrors.from_name ? 'border-red-500' : 'border-slate-300'}`}
                                            placeholder="IT Helpdesk"
                                        />
                                        {modalErrors.from_name && <p className="text-red-400 text-xs mt-1">{modalErrors.from_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                                            From Email <span className="text-red-400">*</span>
                                        </label>
                                        <input
                                            value={modalData.from_email}
                                            onChange={e => setModalData({ ...modalData, from_email: e.target.value })}
                                            className={`w-full bg-slate-50 border rounded-lg px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-blue-500 transition ${modalErrors.from_email ? 'border-red-500' : 'border-slate-300'}`}
                                            placeholder="security@acme.com"
                                        />
                                        {modalErrors.from_email && <p className="text-red-400 text-xs mt-1">{modalErrors.from_email}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                                <button onClick={() => setShowNewModal(false)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-700 text-sm font-bold rounded-lg transition border border-slate-300">
                                    Cancel
                                </button>
                                <button onClick={confirmNewTemplate} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-lg transition shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                    ✨ Open Editor →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── PAGE HEADER ─── */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Email Templates</h1>
                        <p className="text-slate-500 text-sm mt-1">Design, preview, and deploy dynamic email templates securely.</p>
                    </div>
                </div>

                <div className="flex gap-6 h-[820px]">
                    {/* ─── LEFT PANEL ─── */}
                    <div className="w-[340px] bg-white shadow-sm border border-slate-200 rounded-xl flex flex-col overflow-hidden shrink-0 shadow-xl">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-900">{templates.length} Templates</span>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-100 text-slate-900 text-xs font-bold rounded transition">CSV Export</button>
                                <button onClick={openNewModal} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded shadow-[0_0_10px_rgba(37,99,235,0.4)] transition">
                                    + New Template
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                            {loading
                                ? <div className="text-center text-slate-500 py-10 text-sm">Loading catalog...</div>
                                : templates.map(t => (
                                    <div
                                        key={t.id}
                                        onClick={() => selectTemplate(t)}
                                        className={`p-4 rounded-lg cursor-pointer border transition-all ${activeTemplate?.id === t.id && !isNewMode ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-50 border-slate-200 hover:border-neutral-600'}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-slate-900 font-bold text-sm truncate pr-3">{t.name}</h3>
                                            <span className={`text-[9px] uppercase tracking-widest font-black px-2 py-0.5 border rounded shrink-0 ${TYPE_COLORS[t.type] || TYPE_COLORS.Custom}`}>{t.type}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate">{t.subject}</p>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* ─── RIGHT PANEL ─── */}
                    <div className="flex-1 bg-white shadow-sm border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-xl">
                        {!hasEditor ? (
                            <div className="flex-1 flex items-center justify-center flex-col gap-4 text-slate-500">
                                <span className="text-7xl opacity-30">✉️</span>
                                <p className="text-lg font-semibold">Select a template or click <span className="text-blue-400">+ New Template</span></p>
                            </div>
                        ) : (
                            <>
                                {/* Editor Header */}
                                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                                    <div>
                                        <h2 className="text-base font-black text-slate-900">{isNewMode ? '✨ New Template' : '✏️ Edit Template'}</h2>
                                        <p className="text-xs text-slate-500">{formData.name}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setPreviewMode(!previewMode)} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg transition border border-slate-300">
                                            {previewMode ? '← Back to Edit' : '👁️ Live Preview'}
                                        </button>
                                        <button onClick={sendTestEmail} disabled={processing} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-xs font-bold rounded-lg transition border border-slate-300">
                                            📨 Send Test
                                        </button>
                                        {activeTemplate?.id && (
                                            <button onClick={deleteTemplate} disabled={processing} className="px-4 py-2 bg-red-900/40 hover:bg-red-800/60 text-red-400 text-xs font-bold rounded-lg transition border border-red-800/50">
                                                🗑️ Delete
                                            </button>
                                        )}
                                        <button onClick={saveTemplate} disabled={processing} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black rounded-lg transition shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                                            {processing ? 'Saving...' : '💾 Save Template'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {previewMode ? (
                                        <div className="p-8 h-full bg-neutral-100 relative">
                                            <div className="absolute top-4 right-4 text-xs font-bold text-green-700 bg-green-200 px-3 py-1 rounded shadow">✔ Merge Tags Evaluated (Sample Data)</div>
                                            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-2xl p-8 border border-neutral-300 min-h-[500px]" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                                        </div>
                                    ) : (
                                        <div className="p-6 grid grid-cols-2 gap-6 h-full">
                                            {/* Config Column */}
                                            <div className="flex flex-col gap-5">
                                                <div className="bg-slate-50 p-5 border border-slate-200 rounded-xl">
                                                    <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-4">Basic Info</h3>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Template Name</label>
                                                            <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white shadow-sm border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:border-blue-500 focus:outline-none" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Template Type</label>
                                                            <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="w-full bg-white shadow-sm border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:border-blue-500 focus:outline-none">
                                                                {TYPES.map(t => <option key={t}>{t}</option>)}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 p-5 border border-slate-200 rounded-xl">
                                                    <h3 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-4">Email Envelope</h3>
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="block text-xs font-bold text-slate-600 mb-1.5">Subject Line</label>
                                                            <input value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full bg-white shadow-sm border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:border-blue-500 focus:outline-none" placeholder="Action Required..." />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-600 mb-1.5">From Name</label>
                                                                <input value={formData.from_name} onChange={e => setFormData({ ...formData, from_name: e.target.value })} className="w-full bg-white shadow-sm border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 text-sm focus:border-blue-500 focus:outline-none" placeholder="IT Helpdesk" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-600 mb-1.5">From Email</label>
                                                                <input value={formData.from_email} onChange={e => setFormData({ ...formData, from_email: e.target.value })} className="w-full bg-white shadow-sm border border-slate-300 rounded-lg px-3 py-2.5 text-slate-900 text-sm focus:border-blue-500 focus:outline-none" placeholder="it@acme.com" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 p-5 border border-slate-200 rounded-xl">
                                                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">Merge Tags</h3>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {['{{first_name}}', '{{course_name}}', '{{deadline_date}}', '{{risk_score}}', '{{completion_pct}}', '{{training_link}}', '{{supervisor_name}}', '{{cert_link}}'].map(tag => (
                                                            <span key={tag} onClick={() => setFormData({ ...formData, body_html: formData.body_html + tag })} className="bg-slate-100 hover:bg-slate-100 px-2 py-1.5 rounded text-xs text-slate-700 font-mono cursor-pointer transition border border-slate-300 hover:border-purple-500 hover:text-purple-300 truncate" title="Click to insert">{tag}</span>
                                                        ))}
                                                    </div>
                                                    <p className="text-[10px] text-neutral-600 mt-2">Click a tag to insert at cursor end</p>
                                                </div>
                                            </div>

                                            {/* HTML Editor Column */}
                                            <div className="flex flex-col rounded-xl overflow-hidden border border-slate-200" style={{ minHeight: '560px' }}>
                                                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                                                    <span className="text-xs font-black text-slate-900 tracking-widest uppercase">HTML Body</span>
                                                    <button onClick={generatePreview} disabled={processing} className="text-xs text-cyan-400 hover:text-cyan-300 font-bold tracking-wide transition">
                                                        Evaluate & Preview →
                                                    </button>
                                                </div>
                                                <textarea
                                                    value={formData.body_html}
                                                    onChange={e => setFormData({ ...formData, body_html: e.target.value })}
                                                    className="flex-1 w-full bg-[#1e1e1e] text-[#d4d4d4] p-5 font-mono text-xs leading-relaxed resize-none focus:outline-none"
                                                    spellCheck={false}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </RoleLayout>
    );
}
