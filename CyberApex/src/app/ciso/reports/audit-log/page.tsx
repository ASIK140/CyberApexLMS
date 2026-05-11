'use client';
import React, { useState } from 'react';

const auditLogs = [
    { time: '2026-03-12 18:47', actor: 'CISO User', role: 'CISO', action: 'Assigned Remedial', target: 'Dan Brown', ip: '10.0.1.14', result: 'Success' },
    { time: '2026-03-12 17:30', actor: 'CISO User', role: 'CISO', action: 'Launched Campaign', target: 'Q2 Phishing Wave', ip: '10.0.1.14', result: 'Success' },
    { time: '2026-03-12 15:12', actor: 'Tenant Admin', role: 'Tenant Admin', action: 'User Import', target: '12 new users', ip: '10.0.1.22', result: 'Success' },
    { time: '2026-03-12 14:05', actor: 'CISO User', role: 'CISO', action: 'Board Report Generated', target: 'Q1 2026 Briefing', ip: '10.0.1.14', result: 'Success' },
    { time: '2026-03-11 11:20', actor: 'CISO User', role: 'CISO', action: 'Evidence Pack Downloaded', target: 'ISO 27001 ZIP', ip: '10.0.1.14', result: 'Success' },
    { time: '2026-03-11 09:45', actor: 'CISO User', role: 'CISO', action: 'Notify Manager', target: 'Lisa Chen', ip: '10.0.1.14', result: 'Success' },
    { time: '2026-03-10 16:33', actor: 'CISO User', role: 'CISO', action: 'Escalate HR', target: 'Mike Torres', ip: '10.0.1.14', result: 'Success' },
    { time: '2026-03-10 14:00', actor: 'System', role: 'System', action: 'Certificate Auto-Issued', target: 'Alice Johnson — PHISH-01', ip: 'system', result: 'Success' },
];

const actionColor = (a: string) => {
    if (a.includes('Escalate') || a.includes('Assigned')) return 'text-red-400';
    if (a.includes('Campaign') || a.includes('Launched')) return 'text-orange-400';
    if (a.includes('Report') || a.includes('Evidence')) return 'text-blue-400';
    if (a.includes('Certificate')) return 'text-yellow-400';
    return 'text-slate-700';
};

export default function AuditLogPage() {
    const [search, setSearch] = useState('');
    const [msg, setMsg] = useState('');
    const act = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

    const filtered = auditLogs.filter(l =>
        l.actor.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.target.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Audit Log</h2>
                    <p className="text-sm text-slate-600 mt-1">All CISO-level actions and system events for Acme Corp.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => { alert('Downloading full CISO audit log as CSV.'); act('📄 Exporting audit log as CSV…'); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 shadow-md transition-colors">Export CSV</button>
                    <button onClick={() => { alert('Downloading full CISO audit log as Excel Worksheet.'); act('📊 Exporting audit log as Excel…'); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 shadow-md transition-colors">Export Excel</button>
                    <button onClick={() => { alert('Generating secure CISO audit log PDF report.'); act('📥 Generating audit log PDF…'); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md transition-colors">Export PDF</button>
                </div>
            </div>

            {msg && <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold">{msg}</div>}

            <div className="flex gap-3">
                <div className="relative">
                    <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="Search logs…" className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500/50 w-72" />
                    <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <p className="self-center text-xs text-slate-500">{filtered.length} entries shown</p>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/40 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-4">Timestamp</th>
                                <th className="px-5 py-4">Actor</th>
                                <th className="px-5 py-4">Role</th>
                                <th className="px-5 py-4">Action</th>
                                <th className="px-5 py-4">Target</th>
                                <th className="px-5 py-4">IP Address</th>
                                <th className="px-5 py-4 text-center">Result</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {filtered.map((log, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-3.5 text-xs font-mono text-slate-600 whitespace-nowrap">{log.time}</td>
                                    <td className="px-5 py-3.5 text-sm font-bold text-slate-900">{log.actor}</td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-xs bg-slate-100 border border-slate-300 px-2 py-0.5 rounded font-mono text-slate-600">{log.role}</span>
                                    </td>
                                    <td className={`px-5 py-3.5 text-sm font-semibold ${actionColor(log.action)}`}>{log.action}</td>
                                    <td className="px-5 py-3.5 text-sm text-slate-600">{log.target}</td>
                                    <td className="px-5 py-3.5 text-xs font-mono text-slate-500">{log.ip}</td>
                                    <td className="px-5 py-3.5 text-center">
                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-green-500/10 text-green-400 border-green-500/20">{log.result}</span>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} className="p-10 text-center text-slate-500">No log entries match your search.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
