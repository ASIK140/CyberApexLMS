'use client';

import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { apiFetch } from '@/utils/api';

export default function AuditLogPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        role: '',
        actor: '',
        action: '',
        result: '',
        date_from: '',
        date_to: ''
    });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams(filters as any).toString();
            const res = await apiFetch(`/admin/audit-log?${query}`);
            const json = await res.json();
            if (json.success) {
                setLogs(json.data);
            }
        } catch (err) {
            console.error('Failed to fetch audit logs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [filters]);

    const handleExport = (format: string) => {
        const url = `/api/admin/audit-log/export/${format}`;
        window.open(url, '_blank');
    };

    const getResultBadge = (result: string) => {
        switch (result) {
            case 'Success': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'Warning': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'Failed': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-neutral-500/10 text-slate-600 border-neutral-500/20';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'SuperAdmin': return '👑';
            case 'CISO': return '🛡️';
            case 'TenantAdmin': return '🏢';
            case 'Automated': return '🤖';
            default: return '👤';
        }
    };

    return (
        <SuperAdminLayout title="Platform Audit Log">
            <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">System Audit Trail</h3>
                        <p className="text-slate-600 text-sm font-medium tracking-wide">Tamper-proof record of all platform activities and administrative actions.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
                            <button onClick={() => handleExport('csv')} className="px-6 py-3 text-[10px] font-black text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all border-r border-slate-200 uppercase tracking-widest">CSV</button>
                            <button onClick={() => handleExport('excel')} className="px-6 py-3 text-[10px] font-black text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all border-r border-slate-200 uppercase tracking-widest">Excel</button>
                            <button onClick={() => handleExport('pdf')} className="px-6 py-3 text-[10px] font-black text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all uppercase tracking-widest">PDF</button>
                        </div>
                        <button onClick={fetchLogs} className="px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black tracking-widest hover:scale-[1.03] active:scale-[0.97] transition-all uppercase shadow-[0_10px_30px_rgba(255,255,255,0.1)]">Refresh Feed</button>
                    </div>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 bg-white shadow-sm/50 p-6 rounded-[2rem] border border-slate-100 backdrop-blur-xl">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Actor Role</label>
                        <select 
                            value={filters.role}
                            onChange={(e) => setFilters({...filters, role: e.target.value})}
                            className="w-full bg-white/40 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-red-500/50 transition-colors appearance-none"
                        >
                            <option value="">All Roles</option>
                            <option value="SuperAdmin">Super Admin</option>
                            <option value="CISO">CISO</option>
                            <option value="TenantAdmin">Tenant Admin</option>
                            <option value="Employee">Employee</option>
                            <option value="Automated">Automated</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Search Actor</label>
                        <input 
                            type="text" 
                            placeholder="Name..."
                            value={filters.actor}
                            onChange={(e) => setFilters({...filters, actor: e.target.value})}
                            className="w-full bg-white/40 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-red-500/50 transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Action Type</label>
                        <select 
                             value={filters.action}
                             onChange={(e) => setFilters({...filters, action: e.target.value})}
                            className="w-full bg-white/40 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-red-500/50 transition-colors appearance-none"
                        >
                            <option value="">All Actions</option>
                            <option value="TenantOnboarded">Tenant Onboarded</option>
                            <option value="CoursePublished">Course Published</option>
                            <option value="SecurityAlert">Security Alert</option>
                            <option value="LoginEvent">Login Event</option>
                            <option value="BillingEvent">Billing Event</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Event Result</label>
                        <select 
                             value={filters.result}
                             onChange={(e) => setFilters({...filters, result: e.target.value})}
                            className="w-full bg-white/40 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-red-500/50 transition-colors appearance-none"
                        >
                            <option value="">All Results</option>
                            <option value="Success">Success</option>
                            <option value="Warning">Warning</option>
                            <option value="Failed">Failed</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">Start Date</label>
                        <input 
                            type="date" 
                            value={filters.date_from}
                            onChange={(e) => setFilters({...filters, date_from: e.target.value})}
                            className="w-full bg-white/40 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-red-500/50 transition-colors invert"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-neutral-600 uppercase tracking-widest ml-1">End Date</label>
                        <input 
                            type="date" 
                            value={filters.date_to}
                            onChange={(e) => setFilters({...filters, date_to: e.target.value})}
                            className="w-full bg-white/40 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 outline-none focus:border-red-500/50 transition-colors invert"
                        />
                    </div>
                </div>

                {/* Logs Table */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/50 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200">
                                    <th className="px-8 py-6">Timestamp</th>
                                    <th className="px-6 py-6">Actor</th>
                                    <th className="px-6 py-6">Action</th>
                                    <th className="px-6 py-6">Entity / Target</th>
                                    <th className="px-6 py-6 text-center">Origin (IP)</th>
                                    <th className="px-8 py-6 text-right">Result</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/30">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-32 text-center text-slate-500 font-medium animate-pulse tracking-widest italic uppercase">Syncing with encrypted event stream...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-20 text-center text-neutral-600 font-medium">No activity matching your search criteria.</td></tr>
                                ) : logs.map((log) => (
                                    <tr key={log.log_id} className="group hover:bg-slate-100/20 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">{new Date(log.timestamp).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-neutral-600 font-mono mt-0.5">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-xs grayscale group-hover:grayscale-0 transition-all">
                                                    {getRoleIcon(log.actor_role)}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900 group-hover:text-red-400 transition-all">{log.actor_name}</p>
                                                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-0.5 opacity-60">{log.actor_role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-6">
                                            <p className="text-xs font-medium text-slate-700 italic">“{log.target}”</p>
                                            {log.tenant_id && <p className="text-[9px] text-neutral-600 font-mono mt-0.5">TN: {log.tenant_id}</p>}
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className="text-[10px] font-mono text-slate-500 bg-slate-50 p-1 px-2 rounded-md">{log.ip_address}</span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <span className={`px-3 py-1 text-[9px] font-black rounded-full border uppercase tracking-widest shadow-lg ${getResultBadge(log.result)}`}>
                                                {log.result}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Insight */}
                <div className="flex items-center justify-between p-6 bg-red-500/5 rounded-[2rem] border border-red-500/10">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-2xl">
                             <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m-3-3h12M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Retention Compliance</p>
                            <p className="text-[10px] text-slate-500 font-medium tracking-wide">All logs are strictly immutable and retained for a minimum of 60 months to meet PCI-DSS and SOC2 requirements.</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-black text-red-400 italic italic">{logs.length}</p>
                        <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Total Events Recorded</p>
                    </div>
                </div>

            </div>
        </SuperAdminLayout>
    );
}
