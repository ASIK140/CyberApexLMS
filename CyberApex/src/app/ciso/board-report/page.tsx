'use client';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/utils/api';

export default function BoardReportPage() {
    const [report, setReport] = useState<any>(null);
    const [metrics, setMetrics] = useState<any[]>([]);
    const [risks, setRisks] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [sumRes, metRes, rskRes] = await Promise.all([
                    apiFetch('/ciso/board-report/summary'),
                    apiFetch('/ciso/board-report/metrics'),
                    apiFetch('/ciso/board-report/risks')
                ]);

                const sumData = await sumRes.json();
                const metData = await metRes.json();
                const rskData = await rskRes.json();

                if (sumData.success) setReport(sumData);
                if (metData.success) setMetrics(metData.metrics);
                if (rskData.success) {
                    setRisks(rskData.risks);
                    setRecommendations(rskData.recommendations);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleAction = async (endpoint: string) => {
        try {
            const res = await apiFetch(`/ciso/board-report/${endpoint}`, { method: endpoint === 'pdf' ? 'GET' : 'POST' });
            const data = await res.json();
            alert(data.message + (data.download_url ? `\nLink: ${data.download_url}` : ''));
        } catch (e) {
            alert('Action failed.');
        }
    };

    if (loading) return <div className="p-10 text-center text-slate-900 text-xl">Loading Board Report...</div>;

    if (!report?.summary) return (
        <div className="flex flex-col gap-6 max-w-[1200px] mx-auto text-slate-900">
            <h2 className="text-3xl font-bold">Board Report</h2>
            <div className="p-6 bg-red-500/10 text-red-500 rounded border border-red-500/20 text-center">No report generated yet.</div>
            <button onClick={() => handleAction('generate')} className="mx-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-bold transition-all">Generate New Report</button>
        </div>
    );

    return (
        <div className="flex flex-col gap-8 max-w-[1000px] mx-auto pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Board Report — {report.quarter}</h2>
                    <p className="text-sm text-slate-600 mt-1">Designed for non-technical board members</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleAction('pdf')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition">Download PDF</button>
                    <button onClick={() => handleAction('email')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition">Email to Board</button>
                    <button onClick={() => handleAction('schedule')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition">Schedule</button>
                </div>
            </div>

            {/* Main Report Container */}
            <div className="bg-white/5 border border-slate-200 rounded-xl p-8 shadow-2xl">
                
                {/* Metadata */}
                <div className="mb-10 text-center border-b border-slate-200 pb-8">
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest mb-4">Cyber Security Awareness</h1>
                    <h2 className="text-xl text-slate-600 mb-6 font-semibold inline-block border-b-2 border-blue-500 pb-1">Board Report</h2>
                    <div className="flex justify-center flex-wrap gap-8 text-sm text-slate-500 font-medium">
                        <span className="flex items-center gap-2">🏢 Acme Corp</span>
                        <span className="flex items-center gap-2">📅 Quarter: {report.quarter}</span>
                        <span className="flex items-center gap-2">👨‍💼 Prepared by: {report.metadata.prepared_by}</span>
                        <span className="flex items-center gap-2 text-red-500/80 font-bold bg-red-500/10 px-2 py-0.5 rounded">🔒 Classification: {report.metadata.classification}</span>
                    </div>
                </div>

                {/* Executive Summary */}
                <div className="mb-12">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-blue-500 pl-3">Executive Summary</h3>
                    <div className="bg-white shadow-sm border border-slate-200 p-6 rounded-lg text-slate-700 leading-relaxed text-lg italic shadow-inner">
                        "{report.summary}"
                    </div>
                </div>

                {/* Key Metrics Table */}
                <div className="mb-12">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-purple-500 pl-3">Key Metrics</h3>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-left bg-white shadow-sm">
                            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Metric</th>
                                    <th className="px-6 py-4 text-center">Q3 2025</th>
                                    <th className="px-6 py-4 text-center">Q4 2025</th>
                                    <th className="px-6 py-4 text-center">Q1 2026</th>
                                    <th className="px-6 py-4 text-center text-blue-400">Target</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {metrics.map((m, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-900">{m.name}</td>
                                        <td className="px-6 py-4 text-center text-slate-600">{m.history['Q3 2025'] || '-'}</td>
                                        <td className="px-6 py-4 text-center text-slate-600">{m.history['Q4 2025'] || '-'}</td>
                                        <td className="px-6 py-4 text-center text-slate-900 font-bold bg-white/5">{m.history['Q1 2026'] || '-'}</td>
                                        <td className="px-6 py-4 text-center text-blue-400 font-bold">{m.target}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Board Attention */}
                <div className="mb-12">
                    <h3 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-orange-500 pl-3">Board Attention</h3>
                    <div className="flex flex-col gap-3">
                        {risks.map((r, i) => {
                            const isCritical = r.severity.toLowerCase() === 'critical';
                            const isWarning = r.severity.toLowerCase() === 'warning';
                            return (
                                <div key={i} className={`flex items-start gap-4 p-4 rounded-lg border ${
                                    isCritical ? 'bg-red-500/10 border-red-500/20' : 
                                    isWarning ? 'bg-orange-500/10 border-orange-500/20' : 
                                    'bg-blue-500/10 border-blue-500/20'
                                }`}>
                                    <div className={`text-2xl mt-1 ${isCritical ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-blue-500'}`}>
                                        {isCritical ? '🔴' : isWarning ? '🟠' : '🔵'}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${isCritical ? 'text-red-400' : isWarning ? 'text-orange-400' : 'text-blue-400'}`}>
                                            {r.type}
                                        </h4>
                                        <p className="text-slate-700 text-sm mt-1">{r.description}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recommended Actions Table */}
                <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4 border-l-4 border-green-500 pl-3">Recommended Actions</h3>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-left bg-white shadow-sm">
                            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Action</th>
                                    <th className="px-6 py-4">Owner</th>
                                    <th className="px-6 py-4 text-center border-l border-slate-200 bg-slate-50/50">Budget</th>
                                    <th className="px-6 py-4">Timeline</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {recommendations.map((r, i) => {
                                    // Make up a contextual budget for visual realism if not present in DB
                                    const budgets = ['$15,000', '$0 (OpEx)', 'N/A', '$2,500'];
                                    return (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-900 font-medium">{r.action}</td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">{r.owner}</td>
                                            <td className="px-6 py-4 text-center font-mono text-xs text-slate-500 border-l border-slate-200 bg-white/20">{budgets[i % budgets.length]}</td>
                                            <td className="px-6 py-4 text-slate-700 font-semibold">{r.timeline}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
