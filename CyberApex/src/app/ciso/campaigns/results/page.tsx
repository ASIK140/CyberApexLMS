'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/api';

export default function CampaignResultsRouter() {
    const [campaign, setCampaign] = useState<any>(null);
    const [funnel, setFunnel] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [allCampaigns, setAllCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string>('');

    useEffect(() => {
        async function fetchInitial() {
            try {
                // Fetch all to get the latest completed campaign
                const resList = await apiFetch('/ciso/phishing/list');
                const dList = await resList.json();
                
                if (dList.success && dList.data.length > 0) {
                    setAllCampaigns(dList.data);
                    
                    // Default to 'All Staff Baseline' or first completed
                    const target = dList.data.find((c: any) => c.name === 'All Staff Baseline') || dList.data[0];
                    setSelectedId(target.campaign_id);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        }
        fetchInitial();
    }, []);

    useEffect(() => {
        if (!selectedId) return;

        async function fetchDetails() {
            setLoading(true);
            try {
                const [resCmd, resFun, resDept] = await Promise.all([
                    apiFetch(`/ciso/phishing/${selectedId}/results`),
                    apiFetch(`/ciso/phishing/${selectedId}/funnel`),
                    apiFetch(`/ciso/phishing/${selectedId}/departments`)
                ]);

                const dCmd = await resCmd.json();
                const dFun = await resFun.json();
                const dDept = await resDept.json();

                if (dCmd.success) setCampaign(dCmd.data);
                if (dFun.success) setFunnel(dFun.funnel);
                if (dDept.success) setDepartments(dDept.departments);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchDetails();
    }, [selectedId]);

    const exportData = (format: string) => {
        if (!selectedId) return;
        const token = localStorage.getItem('token');
        window.open(`http://localhost:5000/api/ciso/phishing/${selectedId}/export/${format.toLowerCase()}?token=${token}`, '_blank');
    };

    if (loading && !campaign) return <div className="p-10 text-slate-900 text-center">Loading Analytics...</div>;
    if (!campaign) return <div className="p-10 text-slate-900 text-center">Campaign Not Found</div>;

    const maxFunnel = funnel.length > 0 ? Math.max(...funnel.map(f => f.count)) : 1;

    return (
        <div className="flex flex-col gap-8 max-w-[1200px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <select 
                            value={selectedId} 
                            onChange={e => setSelectedId(e.target.value)}
                            className="bg-white shadow-sm border border-slate-300 text-slate-900 text-xl font-bold rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                        >
                            {allCampaigns.map(c => (
                                <option key={c.campaign_id} value={c.campaign_id}>
                                    {c.name} — Results
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex gap-4 text-sm text-slate-600 mt-2">
                        <span>🏷️ Template: <span className="text-slate-900">{campaign.template_id || 'Unknown'}</span></span>
                        <span>📅 Sent: <span className="text-slate-900">{campaign.started_at ? new Date(campaign.started_at).toLocaleDateString() : 'N/A'}</span></span>
                        <span>👥 Target Users: <span className="text-slate-900">{campaign.emails_sent}</span></span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => exportData('CSV')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition">CSV</button>
                    <button onClick={() => exportData('Excel')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition">Excel</button>
                    <button onClick={() => exportData('PDF')} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition">PDF</button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-xl shadow-lg border-l-4 border-l-blue-500">
                    <div className="text-slate-600 text-sm font-semibold mb-2 uppercase tracking-widest text-[10px]">Sent</div>
                    <div className="text-3xl font-black text-slate-900">{campaign.emails_sent}</div>
                </div>
                <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-xl shadow-lg border-l-4 border-l-orange-500">
                    <div className="text-slate-600 text-sm font-semibold mb-2 uppercase tracking-widest text-[10px]">Clicked Link</div>
                    <div className="text-3xl font-black text-slate-900">{campaign.emails_clicked}</div>
                </div>
                <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-xl shadow-lg border-l-4 border-l-red-500">
                    <div className="text-slate-600 text-sm font-semibold mb-2 uppercase tracking-widest text-[10px]">Submitted Credentials</div>
                    <div className="text-3xl font-black text-slate-900">{campaign.credentials_submitted}</div>
                </div>
                <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-xl shadow-lg border-l-4 border-l-green-500">
                    <div className="text-slate-600 text-sm font-semibold mb-2 uppercase tracking-widest text-[10px]">Reported Sim</div>
                    <div className="text-3xl font-black text-slate-900">{campaign.reported_count}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Visual Funnel (7 columns wide) */}
                <div className="lg:col-span-7 bg-white shadow-sm border border-slate-200 rounded-xl p-6 shadow-xl">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Engagement Funnel</h3>
                    <div className="flex flex-col gap-5">
                        {funnel.map((stage, idx) => {
                            const pct = maxFunnel > 0 ? (stage.count / maxFunnel) * 100 : 0;
                            const colors: Record<string, string> = {
                                'Sent': 'bg-blue-500',
                                'Delivered': 'bg-blue-500',
                                'Opened': 'bg-orange-500',
                                'Clicked': 'bg-red-500',
                                'Credentials Submitted': 'bg-red-500',
                                'Reported': 'bg-green-500'
                            };
                            return (
                                <div key={stage.stage} className="flex flex-col gap-1 relative group">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-700 font-bold">{stage.stage}</span>
                                        <span className="text-slate-900 font-mono">{stage.count}</span>
                                    </div>
                                    <div className="w-full bg-slate-50 rounded-full h-8 overflow-hidden group-hover:ring-2 ring-neutral-700 transition-all">
                                        <div 
                                            className={`h-full ${colors[stage.stage] || 'bg-neutral-600'} flex items-center px-3 text-xs font-bold text-slate-900 whitespace-nowrap overflow-hidden transition-all duration-1000 ease-out`}
                                            style={{ width: `${Math.max(pct, 2)}%` }}
                                        >
                                            {pct.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Department Analytics Table (5 columns wide) */}
                <div className="lg:col-span-5 bg-white shadow-sm border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-slate-900">Department Risk</h3>
                    </div>
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left table-fixed">
                            <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 w-[30%]">Dept</th>
                                    <th className="px-2 py-3 text-center">Sent</th>
                                    <th className="px-2 py-3 text-center">Click %</th>
                                    <th className="px-2 py-3 text-center">Cred %</th>
                                    <th className="px-4 py-3 text-right">Risk</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800 text-sm">
                                {departments.map(d => {
                                    return (
                                        <tr key={d.name} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-3 text-slate-900 font-medium truncate" title={d.name}>{d.name}</td>
                                            <td className="px-2 py-3 text-center text-slate-600">{d.sent}</td>
                                            <td className="px-2 py-3 text-center text-orange-400 font-bold">{d.clickRate}</td>
                                            <td className="px-2 py-3 text-center text-red-500 font-bold">{d.credRate}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${d.riskLevel === 'Critical Risk' ? 'bg-red-600/20 text-red-500 border border-red-500/30' : (d.riskLevel === 'High Risk' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' : 'bg-green-500/10 text-green-500')}`}>
                                                    {d.riskLevel}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {departments.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-6 text-slate-500">No departmental data available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
        </div>
    );
}
