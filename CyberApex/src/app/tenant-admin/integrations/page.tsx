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

const PROVIDER_META: Record<string, { icon: string; color: string; authType: string; authFields: { key: string; label: string; type: string; placeholder: string }[] }> = {
    'Microsoft 365':    { icon: '🪟', color: '#0078d4', authType: 'OAuth', authFields: [{ key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'Azure App Client ID' }, { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: '••••••••' }, { key: 'workspace', label: 'Tenant Domain', type: 'text', placeholder: 'acme.onmicrosoft.com' }] },
    'BambooHR':         { icon: '🎋', color: '#73c41d', authType: 'API Key', authFields: [{ key: 'api_key', label: 'API Key', type: 'password', placeholder: 'BambooHR API Key' }, { key: 'workspace', label: 'Subdomain', type: 'text', placeholder: 'acme' }] },
    'Slack':            { icon: '💬', color: '#4a154b', authType: 'OAuth', authFields: [{ key: 'client_id', label: 'App Client ID', type: 'text', placeholder: 'Slack App Client ID' }, { key: 'client_secret', label: 'App Secret', type: 'password', placeholder: '••••••••' }, { key: 'channel', label: 'Nudge Channel', type: 'text', placeholder: '#security-alerts' }] },
    'Workday':          { icon: '🏢', color: '#f5a623', authType: 'OAuth', authFields: [{ key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'Workday Integration Client ID' }, { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: '••••••••' }, { key: 'workspace', label: 'Tenant URL', type: 'text', placeholder: 'https://wd3.myworkday.com/acme' }] },
    'ServiceNow':       { icon: '🎫', color: '#62d84e', authType: 'API Key', authFields: [{ key: 'api_key', label: 'API Key / Token', type: 'password', placeholder: 'ServiceNow API Key' }, { key: 'workspace', label: 'Instance URL', type: 'text', placeholder: 'https://acme.service-now.com' }] },
    'Google Workspace': { icon: '🔵', color: '#4285f4', authType: 'OAuth', authFields: [{ key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'Google Client ID' }, { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: '••••••••' }, { key: 'workspace', label: 'Domain', type: 'text', placeholder: 'acme.com' }] },
};

const AUTOMATION_TRIGGERS = [
    { key: 'phishing_fail',    label: '🎣 Phishing Simulation Failed', desc: 'Create ServiceNow ticket automatically', icon: '🎫' },
    { key: 'training_overdue', label: '⏰ Training Overdue',           desc: 'Send Slack DM to user + supervisor alert', icon: '💬' },
    { key: 'new_hire',         label: '👤 New Hire Detected',          desc: 'Auto-enroll in Security Awareness 101', icon: '🎋' },
];

export default function IntegrationsPage() {
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeProvider, setActiveProvider] = useState<string | null>(null);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [connectForm, setConnectForm] = useState<Record<string, string>>({});
    const [connectingProvider, setConnectingProvider] = useState<string | null>(null);
    const [syncingProvider, setSyncingProvider] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'warning' } | null>(null);
    const [showAutomation, setShowAutomation] = useState(false);
    const [automationRunning, setAutomationRunning] = useState<string | null>(null);
    const [activeLogFilter, setActiveLogFilter] = useState<string>('All');

    const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const loadData = useCallback(async () => {
        try {
            const [r1, r2] = await Promise.all([
                apiFetch('/tenant/integrations/status').then(r => r.json()),
                apiFetch('/tenant/integrations/logs').then(r => r.json()),
            ]);
            if (r1.success) setIntegrations(r1.data);
            if (r2.success) setLogs(r2.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const openConnectModal = (provider: string) => {
        setActiveProvider(provider);
        setConnectForm({});
        setShowConnectModal(true);
    };

    const handleConnect = async () => {
        if (!activeProvider) return;
        setConnectingProvider(activeProvider);
        try {
            const res = await apiFetch('/tenant/integrations/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: activeProvider, ...connectForm })
            });
            const d = await res.json();
            if (!d.success) throw new Error(d.message);
            showToast(`✅ ${activeProvider} connected successfully`);
            setShowConnectModal(false);
            await loadData();
        } catch (e: any) { showToast(e.message, 'error'); }
        finally { setConnectingProvider(null); }
    };

    const handleDisconnect = async (provider: string) => {
        if (!confirm(`Disconnect ${provider}? Tokens will be revoked. Your synced data will be preserved.`)) return;
        try {
            const res = await apiFetch('/tenant/integrations/disconnect', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider })
            });
            const d = await res.json();
            if (!d.success) throw new Error(d.message);
            showToast(`${provider} disconnected. Data preserved.`, 'warning');
            await loadData();
        } catch (e: any) { showToast(e.message, 'error'); }
    };

    const handleSync = async (provider: string) => {
        setSyncingProvider(provider);
        try {
            const res = await apiFetch('/tenant/integrations/sync', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider })
            });
            const d = await res.json();
            if (!d.success) throw new Error(d.message);
            showToast(`✅ ${provider} synced: ${d.users_synced} users, ${d.groups_synced} groups`);
            await loadData();
        } catch (e: any) { showToast(e.message, 'error'); }
        finally { setSyncingProvider(null); }
    };

    const handleAutomation = async (trigger: string) => {
        setAutomationRunning(trigger);
        try {
            const res = await apiFetch('/tenant/integrations/automation', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trigger, target_user: 'john.doe@acme.com' })
            });
            const d = await res.json();
            if (!d.success) throw new Error(d.message);
            showToast(`✅ ${d.message}`);
            await loadData();
        } catch (e: any) { showToast(e.message, 'error'); }
        finally { setAutomationRunning(null); }
    };

    const connected = integrations.filter(i => i.status === 'connected').length;
    const filteredLogs = activeLogFilter === 'All' ? logs : logs.filter(l => l.provider === activeLogFilter);

    const renderProviderCard = (intg: any) => {
        const meta = PROVIDER_META[intg.provider_name] || { icon: '🔌', color: '#666', authType: 'API Key', authFields: [] };
        const isConnected = intg.status === 'connected';
        const isSyncing = syncingProvider === intg.provider_name;
        const cfg = intg.config_json || {};
        const syncData = intg.sync;

        return (
            <div key={intg.id} className={`bg-white shadow-sm border rounded-2xl p-6 flex flex-col gap-4 transition-all ${isConnected ? 'border-slate-300 hover:border-neutral-500' : 'border-slate-200 opacity-80 hover:opacity-100'}`}>
                {/* Card Header */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${meta.color}22`, border: `1px solid ${meta.color}44` }}>
                            {meta.icon}
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-base">{intg.provider_name}</h3>
                            <span className="text-xs text-slate-500 font-medium">{intg.type}</span>
                        </div>
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${isConnected ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-neutral-600'}`} />
                        {isConnected ? 'Connected' : 'Not Connected'}
                    </div>
                </div>

                {/* Metrics (connected only) */}
                {isConnected && syncData && (
                    <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-50 rounded-lg p-2.5 text-center border border-slate-200">
                            <div className="text-lg font-black text-blue-400">{syncData.users_synced}</div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Users Synced</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2.5 text-center border border-slate-200">
                            <div className="text-lg font-black text-purple-400">{syncData.groups_synced}</div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Groups</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2.5 text-center border border-slate-200">
                            <div className={`text-lg font-black ${syncData.errors > 0 ? 'text-red-400' : 'text-green-400'}`}>{syncData.errors}</div>
                            <div className="text-[9px] text-slate-500 uppercase tracking-wider mt-0.5">Errors</div>
                        </div>
                    </div>
                )}

                {/* Config details (connected only) */}
                {isConnected && (
                    <div className="space-y-1">
                        {cfg.workspace && <div className="text-xs text-slate-500 flex gap-2"><span className="text-neutral-600">Workspace:</span><span className="text-slate-700">{cfg.workspace}</span></div>}
                        {cfg.nudge_channel && <div className="text-xs text-slate-500 flex gap-2"><span className="text-neutral-600">Channel:</span><span className="text-green-400">{cfg.nudge_channel}</span></div>}
                        {cfg.manager_hierarchy !== undefined && <div className="text-xs text-slate-500 flex gap-2"><span className="text-neutral-600">Hierarchy:</span><span className={cfg.manager_hierarchy ? 'text-green-400' : 'text-slate-500'}>{cfg.manager_hierarchy ? 'Mapped ✓' : 'Not mapped'}</span></div>}
                        {intg.last_sync && <div className="text-xs text-slate-500 flex gap-2"><span className="text-neutral-600">Last Sync:</span><span className="text-slate-600">{new Date(intg.last_sync).toLocaleString()}</span></div>}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-slate-200">
                    {isConnected ? (
                        <>
                            <button onClick={() => handleSync(intg.provider_name)} disabled={isSyncing} className="flex-1 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5">
                                {isSyncing ? '⏳ Syncing...' : '⚡ Sync Now'}
                            </button>
                            <button onClick={() => openConnectModal(intg.provider_name)} className="px-3 py-2 bg-slate-100 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg transition border border-slate-300">
                                ⚙️ Settings
                            </button>
                            <button onClick={() => handleDisconnect(intg.provider_name)} className="px-3 py-2 bg-red-900/30 hover:bg-red-800/50 text-red-400 text-xs font-bold rounded-lg transition border border-red-800/40">
                                ✕
                            </button>
                        </>
                    ) : (
                        <button onClick={() => openConnectModal(intg.provider_name)} className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-lg transition shadow-[0_0_15px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2">
                            🔗 Connect {intg.provider_name}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return (
        <RoleLayout title="Integrations" subtitle="Tenant Admin · Acme Corporation" accentColor="purple" avatarText="TA" avatarGradient="bg-gradient-to-tr from-purple-500 to-pink-500" userName="Tenant Admin" userEmail="admin@acmecorp.com" navSections={navSections} currentRole="tenant-admin">
            <div className="flex items-center justify-center h-screen bg-slate-50 text-slate-500">
                <div className="text-center"><div className="text-5xl mb-4 animate-spin">🔌</div><p>Loading Integrations Hub...</p></div>
            </div>
        </RoleLayout>
    );

    return (
        <RoleLayout title="Integrations" subtitle="Tenant Admin · Acme Corporation" accentColor="purple" avatarText="TA" avatarGradient="bg-gradient-to-tr from-purple-500 to-pink-500" userName="Tenant Admin" userEmail="admin@acmecorp.com" navSections={navSections} currentRole="tenant-admin">
            <div className="min-h-screen bg-slate-50 p-8">

                {/* ─── TOAST ──────────────────────────────────────────── */}
                {toast && (
                    <div className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-sm max-w-md ${toast.type === 'success' ? 'bg-green-600 text-white' : toast.type === 'warning' ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'}`}>
                        {toast.msg}
                    </div>
                )}

                {/* ─── CONNECT MODAL ──────────────────────────────────── */}
                {showConnectModal && activeProvider && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                        <div className="bg-white shadow-sm border border-slate-300 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
                            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{PROVIDER_META[activeProvider]?.icon}</span>
                                    <div>
                                        <h2 className="text-lg font-black text-slate-900">Connect {activeProvider}</h2>
                                        <p className="text-xs text-slate-500">{PROVIDER_META[activeProvider]?.authType} authentication</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowConnectModal(false)} className="text-2xl text-slate-500 hover:text-slate-900">×</button>
                            </div>
                            <div className="p-6 space-y-4">
                                {(PROVIDER_META[activeProvider]?.authFields || []).map(field => (
                                    <div key={field.key}>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">{field.label}</label>
                                        <input
                                            type={field.type}
                                            value={connectForm[field.key] || ''}
                                            onChange={e => setConnectForm({ ...connectForm, [field.key]: e.target.value })}
                                            placeholder={field.placeholder}
                                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-slate-900 text-sm focus:border-blue-500 focus:outline-none"
                                        />
                                    </div>
                                ))}
                                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300 flex gap-2 mt-2">
                                    <span>ℹ️</span><span>Your credentials are encrypted before storage. They are never logged in plain text.</span>
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-slate-200 flex gap-3 justify-end">
                                <button onClick={() => setShowConnectModal(false)} className="px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl transition border border-slate-300 hover:bg-slate-100">Cancel</button>
                                <button onClick={handleConnect} disabled={!!connectingProvider} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-black rounded-xl transition shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                                    {connectingProvider ? '⏳ Connecting...' : '🔗 Connect'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── HEADER ─────────────────────────────────────────── */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900">Integrations</h1>
                        <p className="text-slate-500 text-sm mt-1">Connect CyberApex to HR, messaging, and productivity tools</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowAutomation(!showAutomation)} className={`px-5 py-2.5 text-sm font-bold rounded-xl border transition ${showAutomation ? 'bg-purple-600/20 border-purple-500 text-purple-300' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-100'}`}>
                            ⚡ Automation Engine
                        </button>
                        <button onClick={loadData} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-100 border border-slate-300 text-slate-900 text-sm font-bold rounded-xl transition">🔄 Refresh</button>
                    </div>
                </div>

                {/* ─── STATUS BAR ─────────────────────────────────────── */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Integrations', val: integrations.length, color: 'text-slate-900', icon: '🔌' },
                        { label: 'Connected', val: connected, color: 'text-green-400', icon: '✅' },
                        { label: 'Disconnected', val: integrations.length - connected, color: 'text-slate-500', icon: '○' },
                        { label: 'Activity Events', val: logs.length, color: 'text-blue-400', icon: '📋' },
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

                {/* ─── AUTOMATION ENGINE (Collapsible) ─────────────────── */}
                {showAutomation && (
                    <div className="mb-8 bg-white shadow-sm border border-purple-500/20 rounded-2xl p-6">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-1">⚡ Automation Engine</h2>
                        <p className="text-xs text-slate-500 mb-5">Trigger cross-integration actions based on system events. Click to simulate.</p>
                        <div className="grid grid-cols-3 gap-4">
                            {AUTOMATION_TRIGGERS.map(t => (
                                <div key={t.key} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="text-2xl">{t.icon}</span>
                                        <span className="text-[9px] font-black text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">AUTO</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 mb-1">{t.label}</p>
                                    <p className="text-xs text-slate-500 mb-4">{t.desc}</p>
                                    <button onClick={() => handleAutomation(t.key)} disabled={automationRunning === t.key} className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-lg transition">
                                        {automationRunning === t.key ? '⏳ Triggering...' : '▶ Trigger Now'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── INTEGRATION CARDS GRID ─────────────────────────── */}
                <div className="grid grid-cols-3 gap-5 mb-8">
                    {integrations.map(renderProviderCard)}
                </div>

                {/* ─── ACTIVITY LOG ───────────────────────────────────── */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">📋 Activity Log</h2>
                        <div className="flex gap-2">
                            {['All', ...Object.keys(PROVIDER_META)].map(f => (
                                <button key={f} onClick={() => setActiveLogFilter(f)} className={`px-3 py-1 text-xs font-bold rounded-lg border transition ${activeLogFilter === f ? 'bg-blue-600/20 border-blue-500/50 text-blue-300' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                    {f === 'All' ? 'All' : f.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                        {filteredLogs.length === 0 ? (
                            <p className="text-neutral-600 text-sm text-center py-8">No activity logged yet</p>
                        ) : filteredLogs.slice(0, 30).map((log: any) => (
                            <div key={log.id} className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs ${log.status === 'success' ? 'bg-green-500/5 border-green-500/10' : log.status === 'error' ? 'bg-red-500/5 border-red-500/10' : 'bg-yellow-500/5 border-yellow-500/10'}`}>
                                <span className="text-sm mt-0.5">{log.status === 'success' ? '✅' : log.status === 'error' ? '❌' : '⚠️'}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-slate-700">{log.provider}</span>
                                            <span className="text-[9px] uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{log.event_type}</span>
                                        </div>
                                        <span className="text-neutral-600 text-[10px] shrink-0">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <p className="text-slate-600 truncate mt-0.5">{log.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </RoleLayout>
    );
}
