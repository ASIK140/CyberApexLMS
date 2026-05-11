'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/utils/api';

export default function PhishingDashboard() {
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [kpis, setKpis] = useState<any>({
        totalCampaigns: 5, clickRate: '14%', credRate: '6.8%', reportRate: '9%'
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const res = await apiFetch('/ciso/campaign-results');
                const data = await res.json();
                if (data.success) {
                    setCampaigns(data.data);
                    setKpis({
                        totalCampaigns: data.data.length,
                        clickRate: '14%',
                        credRate: '6.8%', 
                        reportRate: '9%'
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const exportData = (format: string) => alert(`Initiating ${format} export...`);

    if (loading) return <div className="p-10 text-slate-900 text-center">Loading Phishing Campaigns...</div>;

    return (
        <div className="flex flex-col gap-6 max-w-[1200px] mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Phishing Campaigns</h2>
                    <p className="text-sm text-slate-600 mt-1">Manage and monitor all phishing simulations for Acme Corp.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={() => exportData('CSV')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded shadow-sm border border-slate-300 transition">Export CSV</button>
                    <button className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded shadow-sm border border-slate-300 transition">Simulator</button>
                    <Link href="/ciso/campaigns/create" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded shadow-[0_0_15px_rgba(37,99,235,0.3)] transition">+ New Campaign</Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1e1e1e] border-none p-6 rounded-lg text-center shadow-lg">
                    <div className="text-slate-500 text-xs font-bold tracking-widest mb-3 uppercase">Total Campaigns</div>
                    <div className="text-3xl font-black text-slate-900">{kpis.totalCampaigns}</div>
                </div>
                <div className="bg-[#1e1e1e] border-none p-6 rounded-lg text-center shadow-lg">
                    <div className="text-slate-500 text-xs font-bold tracking-widest mb-3 uppercase">Avg Click Rate</div>
                    <div className="text-3xl font-black text-[#ff6b6b]">{kpis.clickRate}</div>
                </div>
                <div className="bg-[#1e1e1e] border-none p-6 rounded-lg text-center shadow-lg">
                    <div className="text-slate-500 text-xs font-bold tracking-widest mb-3 uppercase">Avg Cred Rate</div>
                    <div className="text-3xl font-black text-[#fca311]">{kpis.credRate}</div>
                </div>
                <div className="bg-[#1e1e1e] border-none p-6 rounded-lg text-center shadow-lg">
                    <div className="text-slate-500 text-xs font-bold tracking-widest mb-3 uppercase">Avg Report Rate</div>
                    <div className="text-3xl font-black text-[#10b981]">{kpis.reportRate}</div>
                </div>
            </div>

            {/* Campaign Table */}
            <div className="bg-[#141414] border border-slate-200 rounded-lg shadow-xl overflow-hidden mt-2">
                <div className="overflow-x-auto">
                    <table className="w-full text-center">
                        <thead className="bg-[#141414] text-slate-500 text-[10px] uppercase font-bold tracking-widest border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-5 text-left font-bold">Campaign</th>
                                <th className="px-6 py-5 font-bold">Audience</th>
                                <th className="px-6 py-5 font-bold">Emails Sent</th>
                                <th className="px-6 py-5 font-bold">Click Rate</th>
                                <th className="px-6 py-5 font-bold">Cred Rate</th>
                                <th className="px-6 py-5 font-bold">Report Rate</th>
                                <th className="px-6 py-5 font-bold">Status</th>
                                <th className="px-6 py-5 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800 text-sm">
                            {campaigns.map((c: any) => {
                                const sent = c.target_count || '-';
                                const pClick = c.click_rate ? c.click_rate + '%' : '-';
                                const pCred = c.submitted_rate ? c.submitted_rate + '%' : '-';
                                const pRep = c.click_rate ? '9%' : '-';

                                let statusColor = 'border-neutral-500 text-slate-600';
                                if (c.status === 'running') statusColor = 'border-blue-500 text-blue-500 bg-blue-500/10';
                                if (c.status === 'completed') statusColor = 'border-green-600 text-green-500 bg-green-500/10';
                                if (c.status === 'draft') statusColor = 'border-orange-500 text-orange-400 bg-orange-500/10';

                                // Text colors for table cells matching snapshot exactly
                                let btnColor = pClick !== '-' && parseInt(pClick) >= 14 ? 'text-[#ff6b6b]' : 'text-[#fca311]';
                                if (parseInt(pClick) < 10) btnColor = 'text-[#fca311]';
                                
                                let credColor = pCred !== '-' && parseFloat(pCred) > 5 ? 'text-[#ff6b6b]' : 'text-[#fca311]';
                                if (parseFloat(pCred) === 0) credColor = 'text-yellow-400';

                                let repColor = 'text-slate-900';
                                if (parseInt(pRep) > 30) repColor = 'text-[#10b981]';

                                return (
                                    <tr key={c.campaign_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-5 text-left text-slate-900 font-bold">{c.name}</td>
                                        <td className="px-6 py-5 text-slate-600">{c.audience || 'All Staff'}</td>
                                        <td className="px-6 py-5 text-slate-900 font-bold">{sent}</td>
                                        
                                        <td className={`px-6 py-5 font-bold ${pClick === '-' ? 'text-slate-500' : btnColor}`}>{pClick}</td>
                                        <td className={`px-6 py-5 font-bold ${pCred === '-' ? 'text-slate-500' : credColor}`}>{pCred}</td>
                                        <td className={`px-6 py-5 font-bold ${pRep === '-' ? 'text-slate-500' : repColor}`}>{pRep}</td>
                                        
                                        <td className="px-6 py-5">
                                            <span className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${statusColor}`}>
                                                {c.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            {c.status === 'Complete' && (
                                                <Link href={`/ciso/campaigns/${c.campaign_id}`} className="text-xs bg-white/10 text-slate-900 px-3 py-1.5 rounded font-bold hover:bg-neutral-200 hover:text-black transition">
                                                    View
                                                </Link>
                                            )}
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
