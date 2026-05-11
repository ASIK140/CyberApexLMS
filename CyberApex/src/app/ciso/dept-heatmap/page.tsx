'use client';
import React, { useState } from 'react';
import { apiFetch } from '@/utils/api';

const depts = [
    { name: 'Finance', score: 74, users: 62, phishRate: '22%', training: 48 },
    { name: 'Sales', score: 61, users: 95, phishRate: '18%', training: 62 },
    { name: 'Operations', score: 55, users: 120, phishRate: '12%', training: 72 },
    { name: 'Marketing', score: 52, users: 45, phishRate: '11%', training: 74 },
    { name: 'HR', score: 48, users: 30, phishRate: '9%', training: 79 },
    { name: 'Legal', score: 44, users: 18, phishRate: '8%', training: 82 },
    { name: 'IT Engineering', score: 22, users: 70, phishRate: '3%', training: 96 },
];

function getRiskColor(score: number) {
    if (score >= 70) return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', bar: 'bg-red-500', label: 'Critical' };
    if (score >= 55) return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', bar: 'bg-orange-500', label: 'Elevated' };
    if (score >= 40) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', bar: 'bg-yellow-500', label: 'Medium' };
    return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', bar: 'bg-green-500', label: 'Low' };
}

export default function DeptHeatmapPage() {
    const [actionState, setActionState] = useState<Record<string, string>>({});

    const handleAction = async (deptName: string, actionType: string) => {
        setActionState(prev => ({ ...prev, [deptName]: 'loading' }));
        try {
            if (actionType !== 'View Details') {
                await apiFetch('/ciso/compliance/deploy-training', {
                    method: 'POST',
                    body: JSON.stringify({ target_id: deptName, target_type: 'department' })
                });
            } else {
                await new Promise(r => setTimeout(r, 400)); // Simulate quick load for view details
            }
            setActionState(prev => ({ ...prev, [deptName]: 'success' }));
        } catch {
            setActionState(prev => ({ ...prev, [deptName]: 'error' }));
        }
        setTimeout(() => setActionState(prev => ({ ...prev, [deptName]: '' })), 3000);
    };

    return (
        <div className="flex flex-col gap-6 max-w-[1200px] mx-auto">
            <div className="flex justify-end gap-3 empty:hidden">
                <div className="flex gap-3">
                    <button onClick={() => alert('Exporting department heatmap as CSV…')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors">Export CSV</button>
                    <button onClick={() => alert('Generating PDF Report…')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]">PDF Report</button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-xs font-bold flex-wrap">
                {[
                    { label: '🟢 Low (0–39)', color: 'text-green-400' },
                    { label: '🟡 Medium (40–54)', color: 'text-yellow-400' },
                    { label: '🟠 Elevated (55–69)', color: 'text-orange-400' },
                    { label: '🔴 Critical (70+)', color: 'text-red-400' },
                ].map(l => <span key={l.label} className={l.color}>{l.label}</span>)}
            </div>

            {/* Heatmap visual grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {depts.map(dept => {
                    const c = getRiskColor(dept.score);
                    return (
                        <div key={dept.name} className={`rounded-2xl bg-white shadow-sm border ${c.border} p-5 flex flex-col gap-4 hover:-translate-y-1 transition-transform shadow-lg`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">{dept.name}</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">{dept.users} employees</p>
                                </div>
                                <div className={`${c.bg} ${c.text} border ${c.border} rounded-xl px-3 py-1.5 text-center`}>
                                    <p className="text-xs font-bold uppercase tracking-wider">{c.label}</p>
                                    <p className="text-2xl font-black">{dept.score}</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div>
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Risk Score</span><span className={`font-bold ${c.text}`}>{dept.score} / 100</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${c.bar} rounded-full`} style={{ width: `${dept.score}%` }} />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>Training Completion</span><span className="font-bold text-slate-900">{dept.training}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${dept.training}%` }} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between text-xs pt-2 border-t border-slate-200">
                                <span className="text-slate-500">Phishing click rate:</span>
                                <span className={`font-bold ${dept.phishRate > '15%' ? 'text-red-400' : 'text-orange-400'}`}>{dept.phishRate}</span>
                            </div>

                            <button 
                                onClick={() => handleAction(dept.name, dept.score >= 55 ? 'Deploy' : 'View Details')} 
                                disabled={actionState[dept.name] === 'loading' || actionState[dept.name] === 'success'}
                                className={`w-full py-2 text-xs font-semibold rounded-lg border transition-colors ${
                                    actionState[dept.name] === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                    dept.score >= 55 ? `${c.bg} ${c.text} ${c.border} hover:opacity-80 disabled:opacity-50` : 'bg-slate-100 hover:bg-slate-100 text-slate-700 border-slate-300 disabled:opacity-50'
                                }`}
                            >
                                {actionState[dept.name] === 'loading' ? '⏳ Processing...' : 
                                 actionState[dept.name] === 'success' ? '✓ Action Complete' : 
                                 dept.score >= 70 ? '⚡ Urgent — Deploy Training' : 
                                 dept.score >= 55 ? '🎯 Assign Targeted Training' : 'View Details'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
