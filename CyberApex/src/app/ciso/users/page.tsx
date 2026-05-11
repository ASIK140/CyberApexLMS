'use client';
import React, { useState } from 'react';

const users = [
    { name: 'Alice Johnson', email: 'alice@acme.com', dept: 'Engineering', role: 'Software Engineer', risk: 18, training: 96, certs: 'Valid', login: '2h ago' },
    { name: 'Dan Brown', email: 'dan@acme.com', dept: 'Finance', role: 'Finance Lead', risk: 84, training: 22, certs: 'Failed', login: '3 days ago' },
    { name: 'Lisa Chen', email: 'lisa@acme.com', dept: 'Sales', role: 'Account Executive', risk: 79, training: 38, certs: 'None', login: '1 day ago' },
    { name: 'Grace Williams', email: 'grace@acme.com', dept: 'HR', role: 'HR Director', risk: 43, training: 88, certs: 'Valid', login: '5h ago' },
    { name: 'Tom Reeves', email: 'tom@acme.com', dept: 'Executives', role: 'CTO', risk: 35, training: 91, certs: 'Valid', login: 'Today' },
    { name: 'James Okafor', email: 'james@acme.com', dept: 'Sales', role: 'SDR', risk: 65, training: 60, certs: 'None', login: '4 days ago' },
    { name: 'Sarah Park', email: 'sarah@acme.com', dept: 'Finance', role: 'Financial Analyst', risk: 68, training: 55, certs: 'None', login: '6 days ago' },
    { name: 'Mike Torres', email: 'mike@acme.com', dept: 'Operations', role: 'Operations Lead', risk: 71, training: 41, certs: 'None', login: '2 days ago' },
];

export default function AllUsersPage() {
    const [search, setSearch] = useState('');
    const [deptFilter, setDeptFilter] = useState('All');
    const [msg, setMsg] = useState('');
    const act = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

    const filtered = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
        const matchDept = deptFilter === 'All' || u.dept === deptFilter;
        return matchSearch && matchDept;
    });

    const depts = ['All', ...Array.from(new Set(users.map(u => u.dept)))];

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">All Users</h2>
                    <p className="text-sm text-slate-600 mt-1">Full employee roster and security posture for Acme Corp.</p>
                </div>
                <button onClick={() => act('📄 Exporting all users as CSV…')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors">Export CSV</button>
            </div>

            {msg && <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold">{msg}</div>}

            <div className="flex flex-wrap gap-3">
                <div className="relative">
                    <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="Search by name or email…" className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-blue-500/50 w-72" />
                    <svg className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500/50">
                    {depts.map(d => <option key={d}>{d}</option>)}
                </select>
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/40 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-4">Employee</th>
                                <th className="px-5 py-4">Department</th>
                                <th className="px-5 py-4">Role</th>
                                <th className="px-5 py-4 text-center">Risk Score</th>
                                <th className="px-5 py-4 text-center">Training %</th>
                                <th className="px-5 py-4 text-center">Certs</th>
                                <th className="px-5 py-4">Last Login</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {filtered.map((u, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${u.risk >= 70 ? 'bg-red-500/20 text-red-400 border-red-500/20' : 'bg-slate-100 text-slate-600 border-slate-300'}`}>
                                                {u.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{u.name}</p>
                                                <p className="text-xs text-slate-500">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600">{u.dept}</td>
                                    <td className="px-5 py-4 text-xs text-slate-500">{u.role}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`text-lg font-black ${u.risk >= 70 ? 'text-red-400' : u.risk >= 50 ? 'text-orange-400' : u.risk >= 30 ? 'text-yellow-400' : 'text-green-400'}`}>{u.risk}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${u.training > 75 ? 'bg-green-500' : u.training > 50 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${u.training}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-900">{u.training}%</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border ${u.certs === 'Valid' ? 'text-green-400 bg-green-500/10 border-green-500/20' : u.certs === 'Failed' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-slate-500 bg-slate-100 border-slate-300'}`}>{u.certs}</span>
                                    </td>
                                    <td className="px-5 py-4 text-xs text-slate-500">{u.login}</td>
                                    <td className="px-5 py-4 text-right">
                                        <div className="flex gap-1.5 justify-end">
                                            <button onClick={() => { alert('Opening full employee security profile for ' + u.name); act(`👤 Viewing profile for ${u.name}…`); }} className="px-2 py-1 bg-slate-100 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold shadow-md transition-colors">Profile</button>
                                            {u.risk >= 60 && <button onClick={() => { alert('Assigned mandatory remedial security training modules to ' + u.name); act(`📚 Assigned remedial training for ${u.name}`); }} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white border border-red-500 rounded text-xs font-semibold shadow-md transition-colors">Remedial</button>}
                                            <button onClick={() => { alert('Automated security reminder successfully dispatched to ' + u.name); act(`📬 Reminder sent to ${u.name}`); }} className="px-2 py-1 bg-slate-100 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold shadow-md transition-colors">Remind</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div className="p-10 text-center text-slate-500">No users match your search.</div>}
                </div>
            </div>
        </div>
    );
}
