'use client';
import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { apiFetch } from '@/utils/api';

export default function EmailDeliverabilityPage() {
    const [domains, setDomains] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fixModal, setFixModal] = useState<{ open: boolean; title: string; record: string; instructions: string }>({ 
        open: false, title: '', record: '', instructions: '' 
    });
    const [settingsModal, setSettingsModal] = useState<{ open: boolean; domain: any }>({ open: false, domain: null });
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [dataRes, alertRes] = await Promise.all([
                apiFetch('/admin/email-deliverability'),
                apiFetch('/admin/email-deliverability/alerts')
            ]);
            const dataJson = await dataRes.json();
            const alertJson = await alertRes.json();
            if (dataJson.success) setDomains(dataJson.data);
            if (alertJson.success) setAlerts(alertJson.alerts);
        } catch (err) {
            console.error('Failed to fetch email deliverability data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFixSPF = async (id: string) => {
        setActionLoading(id + '-spf');
        try {
            const res = await apiFetch('/admin/email-deliverability/fix-spf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain_id: id })
            });
            const json = await res.json();
            if (json.success) {
                setFixModal({ 
                    open: true, 
                    title: 'Fix SPF Configuration', 
                    record: json.recommended_record, 
                    instructions: json.instructions 
                });
            }
        } catch (err) {
            alert('Failed to get SPF fix');
        } finally {
            setActionLoading(null);
        }
    };

    const handleFixDMARC = async (id: string) => {
        setActionLoading(id + '-dmarc');
        try {
            const res = await apiFetch('/admin/email-deliverability/fix-dmarc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain_id: id })
            });
            const json = await res.json();
            if (json.success) {
                setFixModal({ 
                    open: true, 
                    title: 'Fix DMARC Policy', 
                    record: json.recommended_record, 
                    instructions: json.instructions 
                });
            }
        } catch (err) {
            alert('Failed to get DMARC fix');
        } finally {
            setActionLoading(null);
        }
    };
    
    const handleFixIssue = (alertObj: any) => {
        if (alertObj.type === 'spf') handleFixSPF(alertObj.id);
        else if (alertObj.type === 'dmarc') handleFixDMARC(alertObj.id);
        else window.alert('Professional DNS intervention required for this delivery optimization.');
    };

    const handleGenerateDKIM = async (id: string) => {
        setActionLoading(id + '-dkim');
        try {
            const res = await apiFetch('/admin/email-deliverability/generate-dkim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain_id: id })
            });
            const json = await res.json();
            if (json.success) {
                setFixModal({ 
                    open: true, 
                    title: 'Generate DKIM Key', 
                    record: json.public_key, 
                    instructions: `${json.instructions} (Selector: ${json.selector})`
                });
            }
        } catch (err) {
            alert('Failed to generate DKIM');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSettings = (domain: any) => {
        setSettingsModal({ open: true, domain });
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Healthy': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'Degraded': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'ActionNeeded': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'Critical': return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]';
            default: return 'bg-neutral-500/10 text-slate-600 border-neutral-500/20';
        }
    };

    return (
        <SuperAdminLayout title="Email Deliverability">
            <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
                
                {/* Header Card */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white shadow-sm/40 p-6 rounded-2xl border border-slate-100">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight italic">Deliverability Command Center</h1>
                        <p className="text-slate-600 text-sm mt-1.5 leading-relaxed tracking-wide">Monitor email authentication and inbox placement metrics for simulation domains.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-2xl">
                            <button onClick={() => window.open('/api/admin/email-deliverability/export/csv')} className="px-4 py-2.5 text-[10px] font-black text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm transition-all border-r border-slate-200 uppercase tracking-widest">CSV</button>
                            <button onClick={() => window.open('/api/admin/email-deliverability/export/excel')} className="px-4 py-2.5 text-[10px] font-black text-slate-500 hover:text-slate-900 hover:bg-white shadow-sm transition-all uppercase tracking-widest">EXCEL</button>
                        </div>
                        <button onClick={fetchData} className="px-5 py-2.5 bg-slate-100 text-slate-900 rounded-xl text-[10px] font-black tracking-widest hover:bg-slate-100 transition-all uppercase border border-slate-300">Refresh Data</button>
                    </div>
                </div>

                {/* Warning Banners */}
                {alerts.length > 0 && (
                    <div className="space-y-3">
                        {alerts.map((alert: any, idx: number) => (
                            <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500 ${alert.severity === 'critical' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-orange-500/5 border-orange-500/20 text-orange-400'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl ${alert.severity === 'critical' ? 'bg-red-500/10' : 'bg-orange-500/10'}`}>
                                        <svg className="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-0.5">{alert.severity === 'critical' ? 'Security Failure' : 'Domain Misconfiguration'}</p>
                                        <p className="text-sm font-medium tracking-wide">{alert.message}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleFixIssue(alert)}
                                    className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    {actionLoading?.startsWith(alert.id) ? 'Processing...' : 'Fix Issue'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Monitoring Table */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-3xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/50 text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] border-b border-slate-100">
                                    <th className="px-8 py-5">Corporate Entity</th>
                                    <th className="px-6 py-5">Simulation Domain</th>
                                    <th className="px-6 py-5 text-center">SPF</th>
                                    <th className="px-6 py-5 text-center">DKIM</th>
                                    <th className="px-4 py-5">DMARC Policy</th>
                                    <th className="px-4 py-5 text-center">Bounce</th>
                                    <th className="px-4 py-5 text-center">Inbox</th>
                                    <th className="px-6 py-5 text-center">Health Status</th>
                                    <th className="px-8 py-5 text-right">Orchestration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/20">
                                {loading ? (
                                    <tr><td colSpan={9} className="px-6 py-32 text-center text-slate-500 font-medium animate-pulse tracking-widest italic uppercase">Validating DNS records across global infrastructure...</td></tr>
                                ) : domains.length === 0 ? (
                                    <tr><td colSpan={9} className="px-6 py-20 text-center text-neutral-600">No simulation domains found.</td></tr>
                                ) : domains.map((d) => (
                                    <tr key={d.domain_id} className="group hover:bg-slate-100/20 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-black text-neutral-600 text-xs shadow-inner group-hover:border-red-500/30 group-hover:text-red-400 transition-all">{d.tenant_name.slice(0, 2)}</div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-red-400 transition-all">{d.tenant_name}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono tracking-tight mt-0.5 opacity-60">ID: {d.tenant_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-mono text-xs text-slate-600">{d.sim_domain}</td>
                                        <td className="px-6 py-6 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black border ${d.spf_status === 'PASS' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/20 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]'}`}>
                                                {d.spf_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black border ${d.dkim_status === 'PASS' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/20 text-red-500 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.1)]'}`}>
                                                {d.dkim_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-6">
                                            <p className="text-[11px] font-mono text-slate-700 truncate max-w-[120px]">{d.dmarc_policy || 'NONE'}</p>
                                            <p className="text-[9px] text-neutral-600 font-bold uppercase tracking-widest mt-0.5">{d.dmarc_policy ? 'Active Policy' : 'MISSING RECORD'}</p>
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            <p className={`text-xs font-black ${d.bounce_rate > 3 ? 'text-red-400' : 'text-slate-600'}`}>{d.bounce_rate}%</p>
                                        </td>
                                        <td className="px-4 py-6 text-center">
                                            <p className="text-xs font-black text-green-400">{d.inbox_rate}%</p>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className={`px-2.5 py-1.5 text-[9px] font-black rounded-lg border uppercase tracking-[0.15em] shrink-0 inline-block min-w-[100px] shadow-lg ${getStatusStyle(d.status)}`}>
                                                {d.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {d.spf_status === 'FAIL' && (
                                                    <button onClick={() => handleFixSPF(d.domain_id)} className="px-3 py-1.5 text-[10px] font-black text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-lg transition-all uppercase tracking-widest">Fix SPF</button>
                                                )}
                                                {!d.dmarc_policy && (
                                                    <button onClick={() => handleFixDMARC(d.domain_id)} className="px-3 py-1.5 text-[10px] font-black text-orange-400 border border-orange-500/30 hover:bg-orange-500/10 rounded-lg transition-all uppercase tracking-widest">Fix DMARC</button>
                                                )}
                                                {d.status === 'Healthy' && (
                                                    <button onClick={() => handleGenerateDKIM(d.domain_id)} className="px-3 py-1.5 text-[10px] font-black text-blue-400 border border-blue-500/30 hover:bg-blue-500/10 rounded-lg transition-all uppercase tracking-widest">Gen DKIM</button>
                                                )}
                                                <button 
                                                    onClick={() => handleSettings(d)}
                                                    className="p-1.5 text-neutral-600 hover:text-slate-900 transition-colors" 
                                                    title="Settings"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- FIX RECOMMENDATION MODAL --- */}
                {fixModal.open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/90 backdrop-blur-xl animate-in fade-in duration-300">
                        <div className="w-full max-w-xl bg-white shadow-sm border border-slate-200 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] p-12 relative overflow-hidden">
                            <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter mb-2">{fixModal.title}</h2>
                            <p className="text-slate-600 text-sm mb-10 font-medium tracking-wide">Implementation instructions for domain authentication.</p>
                            
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] ml-1">Recommended DNS Value</label>
                                    <div className="group relative">
                                        <div className="w-full px-6 py-5 bg-white/60 border border-slate-200 rounded-2xl text-red-400 font-mono text-xs break-all leading-relaxed shadow-inner select-all">
                                            {fixModal.record}
                                        </div>
                                        <button onClick={() => navigator.clipboard.writeText(fixModal.record)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 8h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 bg-white/40 rounded-3xl border border-slate-100">
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] mb-3">Operator Intelligence</p>
                                    <p className="text-sm text-slate-700 font-medium leading-relaxed italic">{fixModal.instructions}</p>
                                </div>
                            </div>

                            <div className="mt-12 flex justify-end gap-4">
                                <button onClick={() => setFixModal({ ...fixModal, open: false })} className="px-10 py-4 bg-white text-black rounded-2xl text-xs font-black tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all shadow-2xl uppercase">Dismiss</button>
                            </div>
                        </div>
                    </div>
                )}
                {/* --- DOMAIN SETTINGS MODAL --- */}
                {settingsModal.open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/95 backdrop-blur-2xl animate-in fade-in duration-300">
                        <div className="w-full max-w-2xl bg-white shadow-sm border border-slate-200 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.9)] p-12 relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="w-16 h-16 rounded-[2rem] bg-slate-50 border border-slate-200 flex items-center justify-center text-2xl font-black text-neutral-600 shadow-inner italic">
                                    {settingsModal.domain?.tenant_name.slice(0, 2)}
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter">Domain Settings</h2>
                                    <p className="text-slate-500 text-sm font-medium tracking-wide uppercase italic opacity-70 mt-1">{settingsModal.domain?.sim_domain}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-6 mb-12">
                                <div className="p-6 bg-white/40 rounded-3xl border border-slate-100 space-y-4">
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.25em]">Global Configuration</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-600 font-medium tracking-wide">JIT Provisioning</span>
                                            <span className="h-5 w-10 rounded-full bg-green-500/20 border border-green-500/30"></span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-600 font-medium tracking-wide">SCIM Syncing</span>
                                            <span className="h-5 w-10 rounded-full bg-slate-100 border border-slate-300"></span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-white/40 rounded-3xl border border-slate-100 space-y-4">
                                    <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.25em]">Security Parameters</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-600 font-medium tracking-wide">Strict Enforcements</span>
                                            <span className="h-5 w-10 rounded-full bg-red-500/20 border border-red-500/30"></span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-slate-600 font-medium tracking-wide">Login Simulation</span>
                                            <span className="h-5 w-10 rounded-full bg-green-500/20 border border-green-500/30"></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-4 mt-8">
                                <button 
                                    onClick={() => setSettingsModal({ open: false, domain: null })}
                                    className="px-12 py-4 bg-white text-black rounded-3xl text-sm font-black tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all shadow-2xl uppercase"
                                >
                                    Close Engine
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </SuperAdminLayout>
    );
}
