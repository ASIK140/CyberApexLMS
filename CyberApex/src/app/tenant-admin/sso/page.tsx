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

const PROVIDERS = ['Microsoft Entra ID', 'Google Workspace', 'Okta', 'ADFS', 'Other SAML 2.0'];

type DiagCheck = { name: string; status: 'pass' | 'fail' | 'warn'; detail: string };

export default function SsoConfigPage() {
    const [sso, setSso] = useState<any>(null);
    const [scim, setScim] = useState<any>(null);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [diagRunning, setDiagRunning] = useState(false);
    const [diagResults, setDiagResults] = useState<{ summary: any; checks: DiagCheck[] } | null>(null);
    const [showDiag, setShowDiag] = useState(false);
    const [newToken, setNewToken] = useState<string | null>(null);
    const [showToken, setShowToken] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [r1, r2, r3] = await Promise.all([
                apiFetch('/tenant/sso/config').then(r => r.json()),
                apiFetch('/tenant/sso/scim/config').then(r => r.json()),
                apiFetch('/tenant/sso/scim/logs').then(r => r.json()),
            ]);
            if (r1.success) setSso(r1.data);
            if (r2.success) setScim(r2.data);
            if (r3.success) setLogs(r3.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await apiFetch('/tenant/sso/config/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sso)
            });
            const d = await res.json();
            if (!d.success) throw new Error(d.message);
            showToast('SSO configuration saved successfully');
            await loadAll();
        } catch (e: any) { showToast(e.message || 'Failed to save', 'error'); }
        finally { setSaving(false); }
    };

    const handleDiagnostic = async () => {
        setDiagRunning(true);
        setShowDiag(true);
        setDiagResults(null);
        try {
            const res = await apiFetch('/tenant/sso/diagnostic', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            const d = await res.json();
            if (d.success) setDiagResults({ summary: d.summary, checks: d.checks });
        } catch (e: any) { showToast(e.message || 'Diagnostic failed', 'error'); }
        finally { setDiagRunning(false); await loadAll(); }
    };

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await apiFetch('/tenant/sso/scim/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            const d = await res.json();
            if (!d.success) throw new Error(d.message);
            showToast(`✅ Sync complete: ${d.synced} users synced, ${d.errors} errors`);
            await loadAll();
        } catch (e: any) { showToast(e.message || 'Sync failed', 'error'); }
        finally { setSyncing(false); }
    };

    const handleRegenToken = async () => {
        if (!confirm('Regenerate SCIM token? The existing token will be IMMEDIATELY invalidated.')) return;
        try {
            const res = await apiFetch('/tenant/sso/scim/token/regenerate', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
            const d = await res.json();
            if (!d.success) throw new Error(d.message);
            setNewToken(d.token);
            setShowToken(true);
            await loadAll();
        } catch (e: any) { showToast(e.message || 'Failed to regenerate token', 'error'); }
    };

    const certDaysLeft = () => {
        if (!sso?.certificate_expiry) return null;
        const diff = new Date(sso.certificate_expiry).getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };
    const certDays = certDaysLeft();

    if (loading) return (
        <RoleLayout title="SSO Configuration" subtitle="Tenant Admin · Acme Corporation" accentColor="purple" avatarText="TA" avatarGradient="bg-gradient-to-tr from-purple-500 to-pink-500" userName="Tenant Admin" userEmail="admin@acmecorp.com" navSections={navSections} currentRole="tenant-admin">
            <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-500">
                <div className="text-center"><div className="text-5xl mb-4 animate-spin">⚙️</div><p>Loading SSO Configuration...</p></div>
            </div>
        </RoleLayout>
    );

    return (
        <RoleLayout title="SSO Configuration" subtitle="Tenant Admin · Acme Corporation" accentColor="purple" avatarText="TA" avatarGradient="bg-gradient-to-tr from-purple-500 to-pink-500" userName="Tenant Admin" userEmail="admin@acmecorp.com" navSections={navSections} currentRole="tenant-admin">
            <div className="min-h-screen bg-slate-50 p-8">

                {/* ─── TOAST ──────────────────────────────────────────── */}
                {toast && (
                    <div className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-sm animate-in slide-in-from-top-2 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {toast.msg}
                    </div>
                )}

                {/* ─── NEW TOKEN MODAL ────────────────────────────────── */}
                {showToken && newToken && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                        <div className="bg-white shadow-sm border border-yellow-500/30 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl">
                            <h2 className="text-xl font-black text-yellow-400 mb-2">⚠️ New SCIM Token Generated</h2>
                            <p className="text-slate-600 text-sm mb-4">Copy this token now — it will be masked after you close this dialog.</p>
                            <div className="bg-slate-50 border border-yellow-500/20 rounded-lg p-4 font-mono text-yellow-300 text-sm break-all select-all mb-6">{newToken}</div>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => { navigator.clipboard?.writeText(newToken); showToast('Token copied to clipboard'); }} className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold text-sm rounded-lg transition">📋 Copy Token</button>
                                <button onClick={() => { setShowToken(false); setNewToken(null); }} className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-slate-900 font-bold text-sm rounded-lg transition">Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── DIAGNOSTIC MODAL ───────────────────────────────── */}
                {showDiag && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                        <div className="bg-white shadow-sm border border-slate-300 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-black text-slate-900">🔬 SSO Diagnostic Report</h2>
                                <button onClick={() => setShowDiag(false)} className="text-slate-500 hover:text-slate-900 text-2xl">×</button>
                            </div>
                            {diagRunning ? (
                                <div className="text-center py-12 text-slate-500">
                                    <div className="text-4xl mb-3 animate-spin">⚙️</div>
                                    <p>Running diagnostic checks...</p>
                                </div>
                            ) : diagResults ? (
                                <>
                                    <div className="grid grid-cols-3 gap-4 mb-6">
                                        {[
                                            { label: 'Passed', val: diagResults.summary.passed, color: 'text-green-400' },
                                            { label: 'Failed', val: diagResults.summary.failed, color: 'text-red-400' },
                                            { label: 'Warnings', val: diagResults.summary.warned, color: 'text-yellow-400' }
                                        ].map(s => (
                                            <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                                                <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
                                                <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        {diagResults.checks.map((c, i) => (
                                            <div key={i} className={`flex items-start gap-3 p-4 rounded-lg border ${c.status === 'pass' ? 'bg-green-500/5 border-green-500/20' : c.status === 'fail' ? 'bg-red-500/5 border-red-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
                                                <span className="text-xl mt-0.5">{c.status === 'pass' ? '✅' : c.status === 'fail' ? '❌' : '⚠️'}</span>
                                                <div>
                                                    <p className="font-bold text-sm text-slate-900">{c.name}</p>
                                                    <p className="text-xs text-slate-600 mt-0.5">{c.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* ─── PAGE HEADER ─────────────────────────────────────── */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">SSO Configuration</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            SSO configured via <span className="text-blue-400 font-semibold">SAML 2.0</span> with SCIM provisioning
                            {sso?.certificate_expiry && <span className="ml-3 text-neutral-600">· Certificate: {sso.certificate_expiry}</span>}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleDiagnostic} disabled={diagRunning} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-100 border border-slate-300 text-slate-900 text-sm font-bold rounded-xl transition flex items-center gap-2">
                            🔬 {diagRunning ? 'Running...' : 'Run Diagnostic'}
                        </button>
                        <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-xl transition shadow-[0_0_20px_rgba(37,99,235,0.35)] flex items-center gap-2">
                            {saving ? '⏳ Saving...' : '💾 Save Changes'}
                        </button>
                    </div>
                </div>

                {/* ─── STATUS BANNER ───────────────────────────────────── */}
                <div className={`mb-6 p-4 rounded-xl border flex items-center gap-6 ${sso?.status === 'active' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex items-center gap-3">
                        <span className={`w-3 h-3 rounded-full ${sso?.status === 'active' ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]' : 'bg-red-400'} animate-pulse`} />
                        <span className="font-bold text-slate-900">SSO Status: <span className={sso?.status === 'active' ? 'text-green-400' : 'text-red-400'}>{sso?.status === 'active' ? 'Active' : 'Error'}</span></span>
                    </div>
                    <div className="text-sm text-slate-600">👤 <strong className="text-slate-900">{sso?.active_users ?? 0}</strong> Active Users</div>
                    <div className="text-sm text-slate-600">🕐 Last Login: <strong className="text-slate-900">{sso?.last_login ? new Date(sso.last_login).toLocaleString() : 'Never'}</strong></div>
                    {certDays !== null && (
                        <div className={`ml-auto text-sm font-bold px-3 py-1 rounded-full ${certDays <= 0 ? 'bg-red-500/20 text-red-400' : certDays <= 30 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/10 text-green-400'}`}>
                            🔐 Cert: {certDays <= 0 ? `Expired ${Math.abs(certDays)}d ago` : `Valid ${certDays}d`}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                    {/* ─── LEFT: SSO PROVIDER SETTINGS ─────────────────── */}
                    <div className="space-y-5">
                        {/* Provider */}
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">🔐 Provider Settings</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">SSO Provider</label>
                                    <select value={sso?.provider || ''} onChange={e => setSso({ ...sso, provider: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:border-blue-500 focus:outline-none">
                                        {PROVIDERS.map(p => <option key={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Protocol</label>
                                    <input readOnly value="SAML 2.0" className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 text-slate-500 text-sm cursor-not-allowed" />
                                </div>
                            </div>
                        </div>

                        {/* SAML Fields */}
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-2">📋 SAML Settings</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Entity ID (from IdP)</label>
                                    <input value={sso?.entity_id || ''} onChange={e => setSso({ ...sso, entity_id: e.target.value })} placeholder="https://sts.windows.net/{tenant-id}/" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:border-blue-500 focus:outline-none font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">SSO Login URL</label>
                                    <input value={sso?.sso_url || ''} onChange={e => setSso({ ...sso, sso_url: e.target.value })} placeholder="https://login.microsoftonline.com/{tenant}/saml2" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:border-blue-500 focus:outline-none font-mono" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Certificate Expiry</label>
                                    <input type="date" value={sso?.certificate_expiry || ''} onChange={e => setSso({ ...sso, certificate_expiry: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:border-blue-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">IdP Certificate (PEM)</label>
                                    <textarea value={sso?.certificate || ''} onChange={e => setSso({ ...sso, certificate: e.target.value })} rows={4} placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-xs font-mono focus:border-blue-500 focus:outline-none resize-none" />
                                </div>
                            </div>
                        </div>

                        {/* Advanced Settings */}
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5">⚙️ Advanced Settings</h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-3">JIT Provisioning</label>
                                    <div className="flex gap-3">
                                        {[{ label: '✅ Enabled', value: true, desc: 'Auto-create user on first login' }, { label: '⛔ Disabled', value: false, desc: 'Require manual provisioning' }].map(opt => (
                                            <button key={String(opt.value)} onClick={() => setSso({ ...sso, jit_enabled: opt.value })} className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition ${sso?.jit_enabled === opt.value ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-50 border-slate-300 text-slate-600 hover:border-neutral-600'}`}>
                                                <div>{opt.label}</div>
                                                <div className="text-[10px] font-normal opacity-70 mt-0.5">{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-3">MFA Requirement</label>
                                    <div className="flex gap-3">
                                        {[{ label: '🔐 Required', value: true, desc: 'Enforced via IdP' }, { label: '🔓 Optional', value: false, desc: 'User choice' }].map(opt => (
                                            <button key={String(opt.value)} onClick={() => setSso({ ...sso, mfa_required: opt.value })} className={`flex-1 py-3 px-4 rounded-xl border text-sm font-bold transition ${sso?.mfa_required === opt.value ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-slate-50 border-slate-300 text-slate-600 hover:border-neutral-600'}`}>
                                                <div>{opt.label}</div>
                                                <div className="text-[10px] font-normal opacity-70 mt-0.5">{opt.desc}</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ─── RIGHT: SCIM PROVISIONING ────────────────────── */}
                    <div className="space-y-5">
                        {/* SCIM Status */}
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">🔄 SCIM Provisioning</h2>
                                <span className={`text-xs font-black px-3 py-1 rounded-full border ${scim?.status === 'enabled' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                                    {scim?.status === 'enabled' ? '● ENABLED' : '○ DISABLED'}
                                </span>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">SCIM Base URL</label>
                                    <div className="flex gap-2">
                                        <input readOnly value={scim?.base_url || ''} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-xs font-mono cursor-default" />
                                        <button onClick={() => { navigator.clipboard?.writeText(scim?.base_url || ''); showToast('URL copied'); }} className="px-3 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-xs rounded-xl transition border border-slate-300">📋</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">SCIM Bearer Token</label>
                                    <div className="flex gap-2">
                                        <input readOnly value={scim?.token || '••••••••••••••••'} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 text-xs font-mono cursor-default" />
                                        <button onClick={handleRegenToken} className="px-3 py-2 bg-orange-900/40 hover:bg-orange-800/60 text-orange-400 text-xs rounded-xl transition border border-orange-800/50 font-bold whitespace-nowrap">🔄 Regenerate</button>
                                    </div>
                                    <p className="text-[10px] text-neutral-600 mt-1">Token is masked. Click Regenerate to issue a new one.</p>
                                </div>
                                <div className="flex items-center justify-between py-3 border-t border-slate-200">
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Map IdP Groups → Departments</p>
                                        <p className="text-xs text-slate-500">Automatically assign departments via group membership</p>
                                    </div>
                                    <button onClick={() => setScim({ ...scim, group_sync: !scim?.group_sync })} className={`w-12 h-6 rounded-full transition-all relative border-2 ${scim?.group_sync ? 'bg-blue-600 border-blue-500' : 'bg-slate-100 border-slate-300'}`}>
                                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${scim?.group_sync ? 'left-6' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sync Metrics */}
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">📊 Sync Metrics</h2>
                                <button onClick={handleSync} disabled={syncing} className="px-5 py-2 bg-green-700 hover:bg-green-600 text-white text-xs font-black rounded-xl transition shadow-[0_0_10px_rgba(22,163,74,0.3)] flex items-center gap-1.5">
                                    {syncing ? '⏳ Syncing...' : '⚡ Sync Now'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {[
                                    { label: 'Users Provisioned', val: scim?.users_provisioned ?? 0, color: 'text-blue-400', icon: '👤' },
                                    { label: 'Last Sync', val: scim?.last_sync ? new Date(scim.last_sync).toLocaleTimeString() : 'Never', color: 'text-green-400', icon: '🕐' },
                                    { label: 'Sync Errors', val: scim?.sync_errors ?? 0, color: 'text-red-400', icon: '⚠️' },
                                    { label: 'Deprovisioned', val: scim?.deprovisioned ?? 0, color: 'text-orange-400', icon: '🗑️' },
                                ].map(m => (
                                    <div key={m.label} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                        <div className="text-lg mb-1">{m.icon}</div>
                                        <div className={`text-2xl font-black ${m.color}`}>{m.val}</div>
                                        <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{m.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Activity Log */}
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">📋 Recent Activity Log</h2>
                            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                                {logs.length === 0 ? (
                                    <p className="text-neutral-600 text-sm text-center py-6">No activity logged yet</p>
                                ) : logs.slice(0, 15).map((log: any) => (
                                    <div key={log.id} className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${log.status === 'success' ? 'bg-green-500/5 border-green-500/10' : log.status === 'error' ? 'bg-red-500/5 border-red-500/10' : 'bg-yellow-500/5 border-yellow-500/10'}`}>
                                        <span>{log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️'}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-slate-700">{log.event_type}</span>
                                                <span className="text-neutral-600 text-[10px] shrink-0 ml-2">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                            <p className="text-slate-600 truncate mt-0.5">{log.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </RoleLayout>
    );
}
