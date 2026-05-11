'use client';
import React, { useState } from 'react';

const certs = [
    { name: 'Alice Johnson', course: 'PHISH-01', score: '91%', issued: '10 Jan 2026', expiry: '10 Jan 2027', cpd: '2.0h', framework: 'ISO 27001', status: 'Valid' },
    { name: 'Dan Brown', course: 'PHISH-01', score: '41%', issued: '-', expiry: '-', cpd: '0h', framework: 'ISO 27001', status: 'Failed' },
    { name: 'Grace Williams', course: 'GDPR-01', score: '88%', issued: '15 Jan 2026', expiry: '15 Jan 2027', cpd: '3.0h', framework: 'GDPR', status: 'Valid' },
    { name: 'Mark Evans', course: 'GDPR-01', score: '79%', issued: '20 Feb 2025', expiry: '20 Feb 2026', cpd: '3.0h', framework: 'GDPR', status: 'Expiring Soon' },
    { name: 'Sarah Park', course: 'BEC-01', score: '84%', issued: '05 Mar 2026', expiry: '05 Mar 2027', cpd: '1.5h', framework: 'ISO 27001', status: 'Valid' },
    { name: 'Tom Reeves', course: 'EXEC-01', score: '96%', issued: '01 Feb 2026', expiry: '01 Feb 2027', cpd: '2.5h', framework: 'DORA', status: 'Valid' },
];

const statusColor = (s: string) => ({
    'Valid': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Failed': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Expiring Soon': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}[s] || '');

export default function CertificatesPage() {
    const [msg, setMsg] = useState('');
    const act = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Certificates</h2>
                    <p className="text-sm text-slate-600 mt-1">All certificates issued across Acme Corp.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => act('📄 Exporting certificates CSV…')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors">Export CSV</button>
                    <button onClick={() => act('📥 Downloading all certificates as PDF bundle…')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">Download All</button>
                </div>
            </div>

            {msg && <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold">{msg}</div>}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Valid Certificates', value: '218', color: 'text-green-400', bg: 'bg-green-500/10' },
                    { label: 'Expiring in 30 days', value: '14', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                    { label: 'Expired', value: '8', color: 'text-red-400', bg: 'bg-red-500/10' },
                    { label: 'Never Earned', value: '100', color: 'text-slate-600', bg: 'bg-neutral-500/10' },
                ].map(k => (
                    <div key={k.label} className={`rounded-xl bg-white shadow-sm border border-slate-200 p-4 flex items-center gap-3`}>
                        <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center text-xl flex-shrink-0`}>🏆</div>
                        <div>
                            <p className="text-xs text-slate-500">{k.label}</p>
                            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/40 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-4">Employee</th>
                                <th className="px-5 py-4">Course</th>
                                <th className="px-5 py-4 text-center">Score</th>
                                <th className="px-5 py-4">Issued</th>
                                <th className="px-5 py-4">Expiry</th>
                                <th className="px-5 py-4 text-center">CPD Hours</th>
                                <th className="px-5 py-4">Framework</th>
                                <th className="px-5 py-4 text-center">Status</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {certs.map((c, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-5 py-4 text-sm font-bold text-slate-900">{c.name}</td>
                                    <td className="px-5 py-4"><span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">{c.course}</span></td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`text-sm font-black ${c.score === '-' || parseFloat(c.score) < 60 ? 'text-red-400' : parseFloat(c.score) >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>{c.score}</span>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-slate-600">{c.issued}</td>
                                    <td className="px-5 py-4 text-xs text-slate-600">{c.expiry}</td>
                                    <td className="px-5 py-4 text-center text-sm font-bold text-blue-400">{c.cpd}</td>
                                    <td className="px-5 py-4 text-xs font-mono text-cyan-400">{c.framework}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColor(c.status)}`}>{c.status}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex gap-1.5 justify-end">
                                            {c.status === 'Failed' ? (
                                                <button onClick={() => { alert('A mandatory retake exam link has been dispatched to ' + c.name); act(`📨 Sent retake exam link to ${c.name}`); }} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white border border-red-500 rounded text-xs font-semibold shadow-md transition-colors">Retake</button>
                                            ) : c.status === 'Expiring Soon' ? (
                                                <button onClick={() => { alert('Renewal reminder successfully delivered to ' + c.name); act(`📬 Sent renewal reminder to ${c.name}`); }} className="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white border border-yellow-500 rounded text-xs font-semibold shadow-md transition-colors">Remind</button>
                                            ) : (
                                                <button onClick={() => { alert('Downloading official ' + c.framework + ' Certificate PDF for ' + c.name); act(`📥 Downloading certificate PDF for ${c.name}`); }} className="px-2 py-1 bg-slate-100 hover:bg-slate-100 text-slate-900 border border-slate-300 rounded text-xs font-semibold shadow-md transition-colors">PDF</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
