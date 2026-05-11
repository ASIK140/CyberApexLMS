'use client';
import React, { useState } from 'react';

const gaps = [
    { framework: 'DORA Article 13', req: 'ICT Security Awareness Training', current: 51, target: 100, deadline: '30 Apr 2026', priority: 'Critical' },
    { framework: 'PCI DSS Req 12.6', req: 'Security Awareness Program', current: 68, target: 100, deadline: '30 Jun 2026', priority: 'High' },
    { framework: 'ISO 27001 A.6.3', req: 'Security Awareness Training', current: 74, target: 100, deadline: '31 Dec 2026', priority: 'Medium' },
    { framework: 'GDPR Article 39', req: 'Data Protection Officer Training', current: 79, target: 100, deadline: '31 Dec 2026', priority: 'Medium' },
    { framework: 'SOC2 CC9.2', req: 'Risk Communication Training', current: 81, target: 100, deadline: '31 Dec 2026', priority: 'Low' },
    { framework: 'Cyber Essentials+', req: 'User Device Security Awareness', current: 82, target: 100, deadline: '31 Dec 2026', priority: 'Low' },
];

const priorityColor = (p: string) => ({
    Critical: 'bg-red-500/10 text-red-400 border-red-500/20',
    High: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    Low: 'bg-green-500/10 text-green-400 border-green-500/20',
}[p] || '');

export default function GapAnalysisPage() {
    const [msg, setMsg] = useState('');
    const act = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Gap Analysis</h2>
                    <p className="text-sm text-slate-600 mt-1">Training compliance gaps vs regulatory framework requirements.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => act('📬 Sending training reminder to all non-compliant employees…')} className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-sm font-semibold rounded-lg border border-orange-500/30 transition-colors">Send Reminder (All)</button>
                    <button onClick={() => act('📄 Exporting gap analysis as CSV…')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors">Export CSV</button>
                    <button onClick={() => act('📥 Generating gap analysis PDF…')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors">PDF Report</button>
                </div>
            </div>

            {msg && <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold">{msg}</div>}

            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/40 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-4">Framework</th>
                                <th className="px-5 py-4">Requirement</th>
                                <th className="px-5 py-4 text-center">Current</th>
                                <th className="px-5 py-4 text-center">Target</th>
                                <th className="px-5 py-4 text-center">Gap</th>
                                <th className="px-5 py-4">Deadline</th>
                                <th className="px-5 py-4 text-center">Priority</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {gaps.map((g, i) => {
                                const gap = g.target - g.current;
                                return (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-5 py-4 text-sm font-mono font-bold text-blue-400">{g.framework}</td>
                                        <td className="px-5 py-4 text-sm text-slate-700">{g.req}</td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${g.current >= 80 ? 'bg-green-500' : g.current >= 65 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${g.current}%` }} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{g.current}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center text-sm font-bold text-slate-500">{g.target}%</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`text-lg font-black ${gap > 30 ? 'text-red-400' : gap > 15 ? 'text-orange-400' : 'text-yellow-400'}`}>−{gap}%</span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-600 font-semibold">{g.deadline}</td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${priorityColor(g.priority)}`}>{g.priority}</span>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex gap-1.5 justify-end">
                                                <button onClick={() => { alert('Targeted remediation training successfully deployed to address ' + g.framework + ' compliance gaps.'); act(`🚀 Deploying targeted training for ${g.framework}…`); }} className={`px-2 py-1 rounded border text-xs font-semibold shadow-md transition-colors text-white ${g.priority === 'Critical' || g.priority === 'High' ? 'bg-red-500 hover:bg-red-600 border-red-500' : 'bg-blue-600 hover:bg-blue-700 border-blue-600'}`}>Deploy Training</button>
                                                <button onClick={() => { alert('Automated compliance reminder dispatched for ' + g.framework + ' requirements.'); act(`📬 Sent reminder for ${g.framework}…`); }} className="px-2 py-1 bg-slate-100 hover:bg-slate-100 text-slate-900 border border-slate-300 rounded text-xs font-semibold shadow-md transition-colors">Remind</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
