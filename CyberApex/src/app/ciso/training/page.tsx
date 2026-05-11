'use client';
import React, { useState } from 'react';

const courses = [
    { name: 'PHISH-01: Phishing, Smishing & Vishing', enrolled: 340, completed: 252, inProgress: 41, notStarted: 47, avgScore: '77%', passRate: '89%', overdue: 47 },
    { name: 'GDPR-01: GDPR & Data Protection', enrolled: 340, completed: 188, inProgress: 92, notStarted: 60, avgScore: '82%', passRate: '91%', overdue: 21 },
    { name: 'BEC-01: Business Email Compromise', enrolled: 180, completed: 102, inProgress: 48, notStarted: 30, avgScore: '74%', passRate: '83%', overdue: 12 },
    { name: 'EXEC-01: Executive Targeted Attacks', enrolled: 45, completed: 28, inProgress: 10, notStarted: 7, avgScore: '88%', passRate: '96%', overdue: 3 },
];

export default function TrainingStatusPage() {
    const [msg, setMsg] = useState('');
    const act = (m: string) => { 
        setMsg(m); 
        setTimeout(() => setMsg(''), 3000); 
    };

    const handleNudge = (courseName: string) => {
        alert(`Nudge emails successfully queued for all overdue learners in ${courseName}.`);
        act(`📬 Nudged all overdue learners for: ${courseName.split(':')[0]}`);
    };

    const handleExport = (courseName: string) => {
        const csvContent = `data:text/csv;charset=utf-8,Course,Status\n${courseName},Exported`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${courseName.split(':')[0]}_Report.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        act(`📄 Exported report for: ${courseName.split(':')[0]}`);
    };

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Training Status</h2>
                    <p className="text-sm text-slate-600 mt-1">Completion across all training programmes in Acme Corp.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => act('📬 Nudge sent to all 47 overdue learners…')} className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-sm font-semibold rounded-lg border border-orange-500/30 transition-colors">Nudge Overdue</button>
                    <button onClick={() => act('📄 Exporting training data as CSV…')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors">Export CSV</button>
                    <button onClick={() => act('📊 Exporting training data as Excel…')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors">Export Excel</button>
                </div>
            </div>

            {msg && <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold">{msg}</div>}

            {/* Summary KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Enrolled', value: '340', color: 'text-slate-900' },
                    { label: 'Overall Completion', value: '68%', color: 'text-blue-400' },
                    { label: 'Overdue Learners', value: '47', color: 'text-red-400' },
                    { label: 'Avg Pass Rate', value: '90%', color: 'text-green-400' },
                ].map(k => (
                    <div key={k.label} className="rounded-xl bg-white shadow-sm border border-slate-200 p-4 text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{k.label}</p>
                        <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/40 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-4">Course</th>
                                <th className="px-5 py-4 text-center">Enrolled</th>
                                <th className="px-5 py-4 text-center">Completed</th>
                                <th className="px-5 py-4 text-center">In Progress</th>
                                <th className="px-5 py-4 text-center">Not Started</th>
                                <th className="px-5 py-4 text-center">Avg Score</th>
                                <th className="px-5 py-4 text-center">Pass Rate</th>
                                <th className="px-5 py-4 text-center">Overdue</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {courses.map((c, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-5 py-4 text-sm font-bold text-slate-900 max-w-xs">{c.name}</td>
                                    <td className="px-5 py-4 text-center text-sm text-slate-700">{c.enrolled}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className="text-sm font-bold text-green-400">{c.completed}</span>
                                    </td>
                                    <td className="px-5 py-4 text-center text-sm text-blue-400 font-semibold">{c.inProgress}</td>
                                    <td className="px-5 py-4 text-center text-sm text-slate-500">{c.notStarted}</td>
                                    <td className="px-5 py-4 text-center text-sm font-bold text-cyan-400">{c.avgScore}</td>
                                    <td className="px-5 py-4 text-center text-sm font-bold text-green-400">{c.passRate}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded font-bold text-sm ${c.overdue > 20 ? 'text-red-400' : c.overdue > 5 ? 'text-orange-400' : 'text-yellow-400'}`}>{c.overdue}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex gap-1.5 justify-end">
                                            <button onClick={() => handleNudge(c.name)} className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-white border border-orange-500 rounded text-xs font-semibold shadow-md transition-colors">Nudge</button>
                                            <button onClick={() => handleExport(c.name)} className="px-2 py-1 bg-slate-100 hover:bg-slate-100 text-slate-900 border border-slate-300 rounded text-xs font-semibold shadow-md transition-colors">Export</button>
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
