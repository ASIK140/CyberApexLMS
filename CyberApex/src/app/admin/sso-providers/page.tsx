'use client';
import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { apiFetch } from '@/utils/api';

export default function SSOProvidersPage() {
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [diagModal, setDiagModal] = useState<{ open: boolean; report: any | null }>({ open: false, report: null });
    const [setupModal, setSetupModal] = useState(false);
    const [fixModal, setFixModal] = useState<{ open: boolean; integration: any | null }>({ open: false, integration: null });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [intRes, alertRes] = await Promise.all([
                apiFetch('/admin/sso-providers'),
                apiFetch('/admin/sso-providers/alerts')
            ]);
            const intJson = await intRes.json();
            const alertJson = await alertRes.json();
            if (intJson.success) setIntegrations(intJson.data);
            if (alertJson.success) setAlerts(alertJson.alerts);
        } catch (err) {
            console.error('Failed to fetch SSO data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleDiagnose = async (id: string) => {
        try {
            const res = await apiFetch('/admin/sso-providers/diagnose', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const json = await res.json();
            if (json.success) setDiagModal({ open: true, report: json.report });
        } catch (err) {
            alert('Failed to run diagnostics');
        }
    };

    const handleFix = async (id: string) => {
        try {
            const res = await apiFetch('/admin/sso-providers/fix', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, certificate: 'NEW_CERT_MOCK' })
            });
            const json = await res.json();
            if (json.success) {
                alert('SSO configuration fixed and renewed.');
                fetchData();
                setFixModal({ open: false, integration: null });
            }
        } catch (err) {
            alert('Failed to fix SSO');
        }
    };

    const handleCreate = async (formData: any) => {
        try {
            const res = await apiFetch('/admin/sso-providers/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const json = await res.json();
            if (json.success) {
                alert('New SSO integration setup successfully.');
                fetchData();
                setSetupModal(false);
            }
        } catch (err) {
            alert('Failed to setup SSO');
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'Healthy': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'Broken': return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_8px_rgba(239,68,68,0.1)]';
            case 'Expired': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'NoSSO': return 'bg-neutral-500/10 text-slate-600 border-neutral-500/20';
            default: return 'bg-neutral-500/10 text-slate-600 border-neutral-500/20';
        }
    };

    const protocolBadge = (protocol: string) => {
        switch (protocol) {
            case 'SAML': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'OIDC': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            case 'ADFS': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
            default: return 'bg-neutral-500/10 text-slate-600 border-neutral-500/20';
        }
    };

    return (
        <SuperAdminLayout title="SSO Providers">
            <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white shadow-sm/40 p-6 rounded-2xl border border-slate-100">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Identity Provider Management</h1>
                        <p className="text-slate-600 text-sm mt-1.5 leading-relaxed tracking-wide">Monitor, configure, and diagnose Single Sign-On integrations across all enterprise tenants.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                            <button onClick={() => window.open('/api/admin/sso-providers/export/csv')} className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm transition-colors border-r border-slate-200 flex items-center gap-2">
                                <IcDownload /> CSV
                            </button>
                            <button className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white shadow-sm transition-colors flex items-center gap-2">
                                <IcExternal /> EXCEL
                            </button>
                        </div>
                        <button onClick={() => setSetupModal(true)} className="px-6 py-2.5 bg-white text-black rounded-xl text-xs font-black shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
                            SETUP NEW SSO
                        </button>
                    </div>
                </div>

                {/* Alert Banners */}
                {alerts.length > 0 && (
                    <div className="space-y-3">
                        {alerts.map(alert => (
                            <div key={alert.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-500 ${alert.severity === 'critical' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-orange-500/5 border-orange-500/20 text-orange-400'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl ${alert.severity === 'critical' ? 'bg-red-500/10' : 'bg-orange-500/10'}`}>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div className="max-w-2xl">
                                        <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-0.5">{alert.severity === 'critical' ? 'Critical Security Event' : 'Maintenance Required'}</p>
                                        <p className="text-sm font-medium tracking-wide">{alert.message}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleFix(alert.id)} className={`px-4 py-1.5 rounded-lg text-xs font-black border transition-all ${alert.severity === 'critical' ? 'border-red-500/30 bg-red-500/10 hover:bg-red-500 text-white' : 'border-orange-500/30 bg-orange-500/10 hover:bg-orange-500 text-white'}`}>FIX NOW</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Main Table Container */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/40 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">
                                    <th className="px-8 py-5">Tenant Information</th>
                                    <th className="px-6 py-5">Identity Source</th>
                                    <th className="px-6 py-5">Protocol</th>
                                    <th className="px-6 py-5 text-center">JIT</th>
                                    <th className="px-6 py-5 text-center">SCIM</th>
                                    <th className="px-6 py-5 text-center">MFA</th>
                                    <th className="px-6 py-5">Cert Expiry</th>
                                    <th className="px-6 py-5 text-center">Status</th>
                                    <th className="px-8 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/30">
                                {loading ? (
                                    <tr><td colSpan={9} className="px-6 py-20 text-center text-slate-600 font-medium animate-pulse">Establishing secure connection to Identity Service...</td></tr>
                                ) : integrations.length === 0 ? (
                                    <tr><td colSpan={9} className="px-6 py-20 text-center text-slate-500">No active identity provider integrations found.</td></tr>
                                ) : integrations.map((i) => (
                                    <tr key={i.integration_id} className="group hover:bg-slate-50/50 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-600 group-hover:bg-slate-100 transition-colors">{i.tenant_name.slice(0, 2)}</div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-red-400 transition-colors">{i.tenant_name}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono mt-1 opacity-60 tracking-tight">{i.tenant_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <p className="text-sm font-semibold text-slate-800">{i.provider_name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">External Auth Source</p>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border tracking-wider ${protocolBadge(i.protocol)}`}>
                                                {i.protocol}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className={`w-3 h-3 rounded-full mx-auto ring-4 ring-black border ${i.jit_enabled ? 'bg-green-500 border-green-400 shadow-[0_0_12px_rgba(34,197,94,0.4)]' : 'bg-slate-100 border-slate-300 opacity-30'}`}></div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className={`w-3 h-3 rounded-full mx-auto ring-4 ring-black border ${i.scim_enabled ? 'bg-blue-500 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.4)]' : 'bg-slate-100 border-slate-300 opacity-30'}`}></div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className={`w-3 h-3 rounded-full mx-auto ring-4 ring-black border ${i.mfa_required ? 'bg-purple-500 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.4)]' : 'bg-slate-100 border-slate-300 opacity-30'}`}></div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <p className="text-sm font-bold font-mono text-slate-600">{i.certificate_expiry}</p>
                                            <p className="text-[10px] text-neutral-600 font-medium">Next Rotation</p>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className={`px-3 py-1.5 text-[9px] font-black rounded-xl border uppercase tracking-[0.15em] shrink-0 inline-block min-w-[90px] ${statusBadge(i.status)}`}>
                                                {i.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2">
                                                {i.status === 'Healthy' && (
                                                    <button onClick={() => handleDiagnose(i.integration_id)} className="px-4 py-2 text-[10px] font-black tracking-widest text-slate-600 hover:text-blue-400 hover:bg-blue-500/10 border border-slate-200 rounded-xl transition-all uppercase">Diagnose</button>
                                                )}
                                                {i.status === 'Broken' && (
                                                    <button onClick={() => handleFix(i.integration_id)} className="px-4 py-2 text-[10px] font-black tracking-widest text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-[0_4px_12px_rgba(220,38,38,0.3)] uppercase">Fix Now</button>
                                                )}
                                                {i.status === 'Expired' && (
                                                    <button onClick={() => handleFix(i.integration_id)} className="px-4 py-2 text-[10px] font-black tracking-widest text-white bg-orange-600 hover:bg-orange-500 rounded-xl transition-all uppercase">Rotate Cert</button>
                                                )}
                                                {i.status === 'NoSSO' && (
                                                    <button onClick={() => setSetupModal(true)} className="px-4 py-2 text-[10px] font-black tracking-widest text-slate-700 border border-slate-200 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all uppercase">Setup Identity</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- MODALS --- */}

                {/* Diagnostic Modal */}
                {diagModal.open && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/95 backdrop-blur-md animate-in fade-in duration-500">
                        <div className="w-full max-w-lg bg-white shadow-sm border border-slate-200 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none"></div>
                            
                            <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">System Diagnostic Report</h3>
                            <p className="text-[10px] text-slate-500 mb-10 font-mono tracking-widest uppercase flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                                Analysis Completion: {new Date(diagModal.report.timestamp).toLocaleString()}
                            </p>
                            
                            <div className="space-y-4 relative z-10">
                                {diagModal.report.checks.map((check: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-slate-100 hover:border-slate-300/50 transition-colors group">
                                        <div className="flex items-center gap-5">
                                            <div className={`p-2.5 rounded-xl border ring-4 ring-black ${check.status === 'Success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                                {check.status === 'Success' ? <IcCheck /> : <IcCross />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:translate-x-1 transition-transform">{check.name}</p>
                                                <p className="text-[11px] text-slate-500 mt-1 font-medium italic opacity-80">{check.details}</p>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${check.status === 'Success' ? 'text-green-400 bg-green-400/5' : 'text-red-400 bg-red-400/5'}`}>{check.status}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 flex justify-end gap-4">
                                <button onClick={() => setDiagModal({ open: false, report: null })} className="px-8 py-3 text-xs font-black tracking-widest text-slate-500 hover:text-slate-900 transition-colors uppercase">Dismiss</button>
                                <button className="px-8 py-3 bg-white text-black rounded-2xl text-[10px] font-black tracking-[0.2em] shadow-2xl hover:bg-neutral-200 active:scale-95 transition-all">DOWNLOAD REPORT</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Setup Modal */}
                {setupModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/95 backdrop-blur-md animate-in zoom-in-95 duration-300">
                        <div className="w-full max-w-2xl bg-white shadow-sm border border-slate-200 rounded-[3rem] shadow-2xl p-12 relative overflow-hidden">
                             <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500/5 blur-[120px] pointer-events-none"></div>

                            <h3 className="text-3xl font-black text-slate-900 mb-2 tracking-tighter italic">Establish Trust</h3>
                            <p className="text-slate-500 text-sm mb-10 tracking-wide font-medium">Link a new enterprise identity provider to the CyberApex Ecosystem.</p>
                            
                            <div className="space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1">Target Tenant ID</label>
                                        <input type="text" id="setup_tenant_id" placeholder="8-4-4-4-12 UUID format" className="w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-sm font-mono focus:border-red-500/50 outline-none transition-all placeholder:text-neutral-700" />
                                    </div>
                                    <div className="space-y-2.5">
                                        <label className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1">Provider Identifier</label>
                                        <input type="text" id="setup_provider_name" placeholder="e.g. OKTA_PROD_1" className="w-full px-5 py-4 bg-white/50 border border-slate-200 rounded-2xl text-sm focus:border-red-500/50 outline-none transition-all placeholder:text-neutral-700" />
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em] ml-1">Communication Protocol</label>
                                    <div className="flex gap-3">
                                        {['SAML 2.0', 'OIDC', 'ADFS'].map(p => (
                                            <button key={p} className="flex-1 py-4 border border-slate-200 rounded-2xl text-xs font-black tracking-widest text-slate-500 hover:border-red-500/40 hover:text-slate-900 transition-all bg-white/30">
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4 bg-white/40 p-6 rounded-3xl border border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">Advanced Orchestration</p>
                                            <p className="text-[10px] text-slate-500 mt-1">Enable specialized user lifecycle management hooks.</p>
                                        </div>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className="w-8 h-4 bg-slate-100 rounded-full relative group-hover:bg-slate-100 transition-colors">
                                                    <div className="absolute left-1 top-1 w-2 h-2 bg-neutral-500 rounded-full"></div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-700 uppercase tracking-widest">JIT</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <div className="w-8 h-4 bg-slate-100 rounded-full relative group-hover:bg-slate-100 transition-colors">
                                                    <div className="absolute left-1 top-1 w-2 h-2 bg-neutral-500 rounded-full"></div>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-500 group-hover:text-slate-700 uppercase tracking-widest">SCIM</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 flex gap-4">
                                <button onClick={() => setSetupModal(false)} className="flex-1 py-4 text-xs font-black tracking-widest text-slate-500 hover:text-slate-900 transition-colors uppercase italic">Abandon Sync</button>
                                <button 
                                    onClick={() => {
                                        const tid = (document.getElementById('setup_tenant_id') as HTMLInputElement)?.value;
                                        const pname = (document.getElementById('setup_provider_name') as HTMLInputElement)?.value;
                                        handleCreate({ tenant_id: tid, provider_name: pname, protocol: 'SAML' });
                                    }} 
                                    className="flex-1 py-4 bg-red-600 text-white rounded-[1.5rem] text-sm font-black tracking-[0.1em] shadow-[0_10px_40px_rgba(220,38,38,0.3)] hover:bg-red-500 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    INITIALIZE IDENTITY
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </SuperAdminLayout>
    );
}

const IcDownload = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>;
const IcExternal = () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const IcCheck = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
const IcCross = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>;
