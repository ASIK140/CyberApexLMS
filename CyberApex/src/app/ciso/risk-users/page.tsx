'use client';
import React, { useState } from 'react';
import { apiFetch } from '@/utils/api';

const users = [
    { name: 'Dan Brown', dept: 'Finance', score: 84, clicks: 3, creds: true, training: 22, exam: 45 },
    { name: 'Lisa Chen', dept: 'Sales', score: 79, clicks: 2, creds: false, training: 38, exam: 52 },
    { name: 'Mike Torres', dept: 'Operations', score: 71, clicks: 1, creds: true, training: 41, exam: 58 },
    { name: 'Sarah Park', dept: 'Finance', score: 68, clicks: 2, creds: false, training: 55, exam: 61 },
    { name: 'James Okafor', dept: 'Sales', score: 65, clicks: 1, creds: false, training: 60, exam: 63 },
    { name: 'Anna White', dept: 'HR', score: 62, clicks: 1, creds: false, training: 68, exam: 67 },
];

export default function RiskUsersPage() {
    const [actionMsg, setActionMsg] = useState('');
    const [actionState, setActionState] = useState<Record<string, string>>({});

    const handleAction = async (actionType: 'Remedial' | 'Notify Mgr' | 'HR', userName: string, index: number) => {
        const stateKey = `${index}-${actionType}`;
        setActionState(prev => ({ ...prev, [stateKey]: 'loading' }));
        
        try {
            let endpoint = '';
            let payload = {};
            
            if (actionType === 'Remedial') {
                endpoint = '/ciso/compliance/deploy-training';
                payload = { target_id: userName, target_type: 'user' };
            } else if (actionType === 'Notify Mgr') {
                endpoint = '/admin/notifications';
                payload = { type: 'alert', title: 'Risk Alert', message: `Manager notified for ${userName}.`, severity: 'medium' };
            } else if (actionType === 'HR') {
                endpoint = '/admin/notifications';
                payload = { type: 'alert', title: 'HR Review Requested', message: `HR review requested for ${userName}.`, severity: 'high' };
            }

            const res = await apiFetch(endpoint, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            const json = await res.json();
            
            if (json.success || res.ok) {
                setActionState(prev => ({ ...prev, [stateKey]: 'success' }));
                setActionMsg(`✅ Successfully triggered ${actionType} for ${userName}`);
            } else {
                setActionState(prev => ({ ...prev, [stateKey]: 'error' }));
            }
        } catch (err) {
            setActionState(prev => ({ ...prev, [stateKey]: 'error' }));
            setActionMsg(`❌ Network error triggering ${actionType}`);
        }
        
        setTimeout(() => setActionMsg(''), 4000);
        setTimeout(() => setActionState(prev => ({ ...prev, [stateKey]: '' })), 4000);
    };

    const handleBulkAction = async () => {
        setActionMsg('⏳ Processing bulk remedial assignment...');
        try {
            const res = await apiFetch('/ciso/compliance/deploy-training', {
                method: 'POST',
                body: JSON.stringify({ target_id: 'all', target_type: 'high_risk_users' })
            });
            const json = await res.json();
            if (json.success) setActionMsg(`✅ Bulk assignment complete: ${json.message}`);
            else setActionMsg('❌ Failed to process bulk assignment');
        } catch (err) {
            setActionMsg('❌ Network error during bulk assignment');
        }
        setTimeout(() => setActionMsg(''), 5000);
    };

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto">
            <div className="flex justify-end gap-3 empty:hidden">
                <button onClick={handleBulkAction} className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm font-semibold rounded-lg border border-red-500/30 transition-colors">Assign Remedial (All)</button>
                <button onClick={() => alert('Exporting risk users as CSV…')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors">Export CSV</button>
            </div>

            {actionMsg && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-semibold">{actionMsg}</div>
            )}

            {/* Risk stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Critical (≥75)', value: '2', color: 'text-red-400', bg: 'border-red-500/20' },
                    { label: 'Elevated (60–74)', value: '4', color: 'text-orange-400', bg: 'border-orange-500/20' },
                    { label: 'Credential Submitted', value: '2', color: 'text-yellow-400', bg: 'border-yellow-500/20' },
                ].map(s => (
                    <div key={s.label} className={`rounded-xl bg-white shadow-sm border ${s.bg} p-4 text-center`}>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
                        <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-white/40 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-4">Employee</th>
                                <th className="px-5 py-4">Department</th>
                                <th className="px-5 py-4 text-center">Risk Score</th>
                                <th className="px-5 py-4 text-center">Phish Clicks</th>
                                <th className="px-5 py-4 text-center">Cred Submit</th>
                                <th className="px-5 py-4 text-center">Training %</th>
                                <th className="px-5 py-4 text-center">Exam Score</th>
                                <th className="px-5 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {users.map((u, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 border border-red-500/20 flex items-center justify-center text-xs font-bold">
                                                {u.name.split(' ').map(n => n[0]).join('')}
                                            </div>
                                            <span className="text-sm font-bold text-slate-900">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-slate-600">{u.dept}</td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`text-xl font-black ${u.score >= 75 ? 'text-red-400' : 'text-orange-400'}`}>{u.score}</span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`font-bold ${u.clicks >= 2 ? 'text-red-400' : 'text-yellow-400'}`}>{u.clicks}x</span>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        {u.creds ? <span className="px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/20 rounded text-xs font-bold">YES</span>
                                            : <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">NO</span>}
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${u.training}%` }} />
                                            </div>
                                            <span className="text-xs font-semibold text-slate-900">{u.training}%</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-center">
                                        <span className={`text-sm font-bold ${u.exam < 60 ? 'text-red-400' : 'text-yellow-400'}`}>{u.exam}%</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <div className="flex gap-1.5 justify-center">
                                            <button 
                                                onClick={() => handleAction('Remedial', u.name, i)} 
                                                disabled={actionState[`${i}-Remedial`] === 'loading' || actionState[`${i}-Remedial`] === 'success'}
                                                className={`px-2 py-1 border rounded text-xs font-semibold transition-colors ${actionState[`${i}-Remedial`] === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/20 disabled:opacity-50'}`}
                                            >
                                                {actionState[`${i}-Remedial`] === 'loading' ? '⏳...' : actionState[`${i}-Remedial`] === 'success' ? '✓ Assigned' : 'Remedial'}
                                            </button>
                                            <button 
                                                onClick={() => handleAction('Notify Mgr', u.name, i)} 
                                                disabled={actionState[`${i}-Notify Mgr`] === 'loading' || actionState[`${i}-Notify Mgr`] === 'success'}
                                                className={`px-2 py-1 border rounded text-xs font-semibold transition-colors ${actionState[`${i}-Notify Mgr`] === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-100 hover:bg-slate-100 text-slate-700 border-slate-300 disabled:opacity-50'}`}
                                            >
                                                {actionState[`${i}-Notify Mgr`] === 'loading' ? '⏳...' : actionState[`${i}-Notify Mgr`] === 'success' ? '✓ Notified' : 'Notify Mgr'}
                                            </button>
                                            <button 
                                                onClick={() => handleAction('HR', u.name, i)} 
                                                disabled={actionState[`${i}-HR`] === 'loading' || actionState[`${i}-HR`] === 'success'}
                                                className={`px-2 py-1 border rounded text-xs font-semibold transition-colors ${actionState[`${i}-HR`] === 'success' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border-orange-500/20 disabled:opacity-50'}`}
                                            >
                                                {actionState[`${i}-HR`] === 'loading' ? '⏳...' : actionState[`${i}-HR`] === 'success' ? '✓ Escalated' : 'HR'}
                                            </button>
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
