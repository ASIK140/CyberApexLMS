'use client';
import React, { useState } from 'react';
import Link from 'next/link';

const riskData = [
    { month: 'Oct', score: 44 }, { month: 'Nov', score: 48 }, { month: 'Dec', score: 51 },
    { month: 'Jan', score: 53 }, { month: 'Feb', score: 56 }, { month: 'Mar', score: 58 },
];
const maxScore = Math.max(...riskData.map(d => d.score));

const topRiskUsers = [
    { name: 'Dan Brown', dept: 'Finance', score: 84, triggers: '3 phishing clicks + credentials submitted', action: 'Remedial' },
    { name: 'Lisa Chen', dept: 'Sales', score: 79, triggers: '2 phishing clicks', action: 'HR Escalation' },
    { name: 'Mike Torres', dept: 'Operations', score: 71, triggers: '1 credential submission', action: 'Remedial' },
    { name: 'Sarah Park', dept: 'Finance', score: 68, triggers: '2 phishing clicks', action: 'Reminder' },
];

export default function CISODashboard() {
    const [activeTab, setActiveTab] = useState<'risk' | 'users'>('risk');

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Organisation Risk Posture</h2>
                    <p className="text-sm text-slate-600 mt-1">Acme Corp · CyberApex Security Intelligence Platform</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/ciso/board-report">
                        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors">Board Report</button>
                    </Link>
                    <Link href="/ciso/reports/evidence">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">Evidence Pack</button>
                    </Link>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Organisation Risk Score', value: '58', sub: 'Elevated', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: '🛡️' },
                    { label: 'Critical Risk Users', value: '7', sub: 'Score ≥ 75', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '⚠️' },
                    { label: 'Phishing Click Rate', value: '14%', sub: '+2% this month', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: '🎣' },
                    { label: 'Training Completion', value: '68%', sub: '+5% vs last month', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: '🎓' },
                    { label: 'Average Exam Score', value: '71%', sub: 'Across all courses', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', icon: '📝' },
                    { label: 'Credential Submissions', value: '23', sub: 'In active campaigns', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: '🔑' },
                    { label: 'Overdue Learners', value: '47', sub: 'Past deadline', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: '🕐' },
                    { label: 'Certificates Valid', value: '218', sub: 'Active credentials', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: '🏆' },
                ].map(kpi => (
                    <div key={kpi.label} className={`p-4 rounded-xl bg-white shadow-sm border ${kpi.border} flex items-start gap-3 shadow-sm`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${kpi.bg} flex-shrink-0`}>{kpi.icon}</div>
                        <div className="min-w-0">
                            <p className="text-xs text-slate-500 font-medium truncate">{kpi.label}</p>
                            <p className={`text-2xl font-bold mt-0.5 ${kpi.color}`}>{kpi.value}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">{kpi.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* RISK TREND CHART */}
                <div className="lg:col-span-2 rounded-2xl bg-white shadow-sm border border-slate-200 p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-slate-900">Organisation Risk Score Trend</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Last 6 months — Risk score out of 100</p>
                        </div>
                        <div className="flex gap-2 text-xs">
                            <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">Critical: 75+</span>
                            <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 font-bold">Elevated: 50+</span>
                        </div>
                    </div>
                    <div className="flex items-end gap-3 h-40">
                        {riskData.map((d, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full">
                                <div className="flex-1 w-full flex items-end">
                                    <div
                                        className={`w-full rounded-t-md transition-all duration-700 ${d.score >= 75 ? 'bg-gradient-to-t from-red-700 to-red-400' : d.score >= 50 ? 'bg-gradient-to-t from-yellow-700 to-yellow-400' : 'bg-gradient-to-t from-green-700 to-green-400'}`}
                                        style={{ height: `${(d.score / maxScore) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[11px] text-slate-600 font-bold">{d.score}</span>
                                <span className="text-[10px] text-neutral-600">{d.month}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-between items-center pt-4 border-t border-slate-200">
                        <span className="text-xs text-slate-500">Score increased <span className="text-red-400 font-bold">+14 points</span> over 6 months</span>
                        <Link href="/ciso/reports/gap-analysis">
                            <button className="text-xs text-blue-400 hover:text-blue-300 font-semibold">View Gap Analysis →</button>
                        </Link>
                    </div>
                </div>

                {/* RISK QUICK STATS */}
                <div className="flex flex-col gap-4">
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-5 flex-1">
                        <h3 className="font-bold text-slate-900 mb-4 text-sm">Risk by Department</h3>
                        {[
                            { dept: 'Finance', score: 74, color: 'bg-orange-500' },
                            { dept: 'Sales', score: 61, color: 'bg-yellow-500' },
                            { dept: 'Operations', score: 55, color: 'bg-yellow-400' },
                            { dept: 'HR', score: 48, color: 'bg-green-400' },
                            { dept: 'IT Engineering', score: 22, color: 'bg-green-500' },
                        ].map(d => (
                            <div key={d.dept} className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-slate-700">{d.dept}</span>
                                    <span className="font-bold text-slate-900">{d.score}</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${d.color} rounded-full`} style={{ width: `${d.score}%` }} />
                                </div>
                            </div>
                        ))}
                        <Link href="/ciso/dept-heatmap"><button className="w-full mt-3 py-2 text-xs font-semibold text-blue-400 hover:text-blue-300 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">Full Heatmap →</button></Link>
                    </div>
                </div>
            </div>

            {/* TOP RISK USERS */}
            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden shadow-lg">
                <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200">
                    <h3 className="font-bold text-slate-900">Top Risk Users</h3>
                    <div className="flex gap-3">
                        <Link href="/ciso/risk-users">
                            <button className="text-xs font-semibold text-blue-400 hover:text-blue-300 px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-100 transition-colors">View All →</button>
                        </Link>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/30 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-3">Employee</th>
                                <th className="px-5 py-3">Department</th>
                                <th className="px-5 py-3 text-center">Risk Score</th>
                                <th className="px-5 py-3">Triggers</th>
                                <th className="px-5 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {topRiskUsers.map((u, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold border border-red-500/20">
                                                {u.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-sm text-slate-600">{u.dept}</td>
                                    <td className="px-5 py-3.5 text-center">
                                        <span className={`font-black text-lg ${u.score >= 80 ? 'text-red-400' : u.score >= 65 ? 'text-orange-400' : 'text-yellow-400'}`}>{u.score}</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-slate-600">{u.triggers}</td>
                                    <td className="px-5 py-3.5 text-right">
                                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Link href="/ciso/training/remedial">
                                                <button className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 rounded text-xs font-semibold">Remedial</button>
                                            </Link>
                                            <button className="px-2 py-1 bg-slate-100 hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-semibold">Notify</button>
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
