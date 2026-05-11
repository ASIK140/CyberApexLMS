'use client';
import React, { useState } from 'react';

const remedialUsers = [
    { name: 'Dan Brown', dept: 'Finance', course: 'Phishing Advanced + BEC', trigger: '3 phishing clicks', assigned: '01 Mar 2026', deadline: '15 Mar 2026', progress: 18, status: 'At Risk' },
    { name: 'Lisa Chen', dept: 'Sales', course: 'Phishing Advanced', trigger: '2 phishing clicks', assigned: '03 Mar 2026', deadline: '17 Mar 2026', progress: 45, status: 'In Progress' },
    { name: 'Mike Torres', dept: 'Operations', course: 'BEC & Wire Fraud', trigger: '1 credential submission', assigned: '05 Mar 2026', deadline: '19 Mar 2026', progress: 60, status: 'In Progress' },
    { name: 'Sarah Park', dept: 'Finance', course: 'Phishing Advanced', trigger: '2 phishing clicks', assigned: '05 Mar 2026', deadline: '19 Mar 2026', progress: 72, status: 'On Track' },
    { name: 'James Okafor', dept: 'Sales', course: 'Phishing Advanced', trigger: '1 phishing click', assigned: '06 Mar 2026', deadline: '20 Mar 2026', progress: 0, status: 'Not Started' },
];

const statusColor = (s: string) => ({
    'At Risk': 'bg-red-500/10 text-red-400 border-red-500/20',
    'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'On Track': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Not Started': 'bg-neutral-500/10 text-slate-600 border-neutral-500/20',
}[s] || '');

export default function RemedialTrackingPage() {
    const [msg, setMsg] = useState('');
    const act = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Remedial Tracking</h2>
                    <p className="text-sm text-slate-600 mt-1">Employees assigned additional training due to risk triggers.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => act('⚡ Escalating all overdue remedial learners to HR…')} className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-semibold rounded-lg border border-red-500/30 transition-colors">Escalate All Overdue</button>
                    <button onClick={() => act('📄 Exporting remedial data as CSV…')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors">CSV Export</button>
                    <button onClick={() => act('📊 Exporting remedial data as Excel…')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors">Excel Export</button>
                </div>
            </div>

            {msg && <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold">{msg}</div>}

            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/40 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-4">Employee</th>
                                <th className="px-5 py-4">Department</th>
                                <th className="px-5 py-4">Remedial Course</th>
                                <th className="px-5 py-4">Trigger</th>
                                <th className="px-5 py-4">Assigned</th>
                                <th className="px-5 py-4">Deadline</th>
                                <th className="px-5 py-4">Progress</th>
                                <th className="px-5 py-4 text-center">Status</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {remedialUsers.map((u, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-700">{u.name.split(' ').map(n => n[0]).join('')}</div>
                                            <span className="text-sm font-bold text-slate-900">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600">{u.dept}</td>
                                    <td className="px-5 py-4 text-sm text-slate-700 max-w-xs">{u.course}</td>
                                    <td className="px-5 py-4 text-xs text-red-400 font-medium">{u.trigger}</td>
                                    <td className="px-5 py-4 text-xs text-slate-500">{u.assigned}</td>
                                    <td className="px-5 py-4 text-xs text-slate-600 font-semibold">{u.deadline}</td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${u.progress > 60 ? 'bg-green-500' : u.progress > 30 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${u.progress}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-900">{u.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusColor(u.status)}`}>{u.status}</span>
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex gap-1.5 justify-end">
                                            <button onClick={() => { alert(`Supervisor and HR inherently notified regarding non-compliance for ${u.name}.`); act(`⚡ Escalated ${u.name} to HR for remedial tracking`) }} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white border border-red-500 rounded text-xs font-semibold shadow-md transition-colors">Escalate</button>
                                            <button onClick={() => { alert(`Automated reminder dispatched to ${u.name}'s inbox.`); act(`📬 Reminder sent to ${u.name}`) }} className="px-2 py-1 bg-slate-100 hover:bg-slate-100 text-slate-900 border border-slate-300 rounded text-xs font-semibold shadow-md transition-colors">Remind</button>
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
