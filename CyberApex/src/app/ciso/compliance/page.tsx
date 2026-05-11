'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/utils/api';

export default function ComplianceDashboard() {
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [expandedFW, setExpandedFW] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchSummary = async () => {
        try {
            const res = await apiFetch('/ciso/compliance/summary');
            const json = await res.json();
            if (json.success) {
                setSummary(json);
            } else {
                setError(json.message);
            }
        } catch (err: any) {
            setError(err.message || 'Network error connecting to API');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    const handleExport = async (type: string) => {
        try {
            const res = await apiFetch(`/ciso/compliance/report?type=${type}`);
            const json = await res.json();
            if (json.success) {
                alert(`Export initiated: ${json.message}\nLink: ${json.download_url}`);
            }
        } catch (err) {
            alert('Export failed');
        }
    };

    const toggleFramework = async (id: string) => {
        if (expandedFW && expandedFW.id === id) {
            setExpandedFW(null);
            return;
        }
        
        setLoadingDetails(true);
        try {
            const res = await apiFetch(`/ciso/compliance/framework/${id}`);
            const json = await res.json();
            if (json.success) {
                setExpandedFW(json.framework);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleDeployTraining = async (targetId: string, type: string) => {
        try {
            const res = await apiFetch('/ciso/compliance/deploy-training', {
                method: 'POST',
                body: JSON.stringify({ target_id: targetId, target_type: type })
            });
            const json = await res.json();
            if (json.success) {
                alert(json.message);
                // Refresh data
                if (type === 'framework' && expandedFW && expandedFW.id === targetId) {
                    toggleFramework(targetId); // re-fetch
                }
            }
        } catch (err) {
            alert('Deployment failed');
        }
    };

    if (loading) return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto p-6 text-slate-900 h-screen items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
            <p>Loading Compliance Posture...</p>
        </div>
    );

    if (error) return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto p-6 text-slate-900 h-screen items-center justify-center">
            <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg max-w-lg text-center">
                <h3 className="font-bold mb-2">Error</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded">Retry</button>
            </div>
        </div>
    );

    const statusColors = {
        'Good': 'text-green-400 border-green-500/20 bg-green-500/10',
        'On Track': 'text-blue-400 border-blue-500/20 bg-blue-500/10',
        'Review': 'text-yellow-400 border-yellow-500/20 bg-yellow-500/10',
        'Urgent': 'text-red-400 border-red-500/20 bg-red-500/10',
    };

    return (
        <div className="flex flex-col gap-6 max-w-[1600px] mx-auto pb-10">
            {/* Header Section */}
            <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Compliance Posture</h2>
                    <p className="text-sm text-slate-600 mt-1">Training and awareness evidence mapped to regulatory frameworks</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleExport('pdf')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition">PDF Report</button>
                    <button onClick={() => handleExport('csv')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition">CSV Export</button>
                    <button onClick={() => handleExport('excel')} className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition">Excel Export</button>
                    <button onClick={() => handleExport('evidence-pack')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition">Evidence Pack</button>
                </div>
            </div>

            {/* ALERT BANNER */}
            {summary?.alert && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🚨</span>
                        <div>
                            <h4 className="font-bold text-red-500">Critical Compliance Alert</h4>
                            <p className="text-sm text-red-400 mt-0.5">{summary.alert.message}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Overall Score quick stat */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5">
                    <h3 className="text-sm text-slate-600 mb-2">Overall Compliance Score</h3>
                    <p className="text-3xl font-bold text-slate-900">{summary?.overall_compliance || 0}%</p>
                </div>
            </div>

            {/* FRAMEWORK CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {summary?.frameworks.map((fw: any) => (
                    <div 
                        key={fw.id} 
                        onClick={() => toggleFramework(fw.id)}
                        className={`p-5 rounded-xl border transition-all cursor-pointer ${expandedFW?.id === fw.id ? 'bg-slate-100 border-blue-500/50 shadow-[0_0_15px_rgba(37,99,235,0.1)]' : 'bg-white shadow-sm border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">{fw.name}</h3>
                                <p className="text-xs text-slate-500 truncate mt-0.5">{fw.description}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${(statusColors as any)[fw.status] || statusColors['Review']}`}>
                                {fw.status}
                            </span>
                        </div>
                        
                        <div className="mt-4">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-600">Compliance</span>
                                <span className="font-bold text-slate-900">{fw.score}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                                <div 
                                    className={`h-full rounded-full ${fw.score >= 80 ? 'bg-green-500' : fw.score >= 60 ? 'bg-blue-500' : fw.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${fw.score}%` }} 
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* EXPANDED EVIDENCE SECTION */}
            {loadingDetails && (
                <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
            )}
            
            {expandedFW && !loadingDetails && (
                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-neutral-900 to-neutral-800">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                {expandedFW.name} <span className="text-sm font-normal text-slate-600">Evidence Matrix</span>
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">{expandedFW.description}</p>
                        </div>
                        <button onClick={() => setExpandedFW(null)} className="text-slate-600 hover:text-slate-900">✕</button>
                    </div>

                    {/* DORA or Warning Block inside section if score is low */}
                    {expandedFW.score < 60 && (
                        <div className="m-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div>
                                <h4 className="font-bold text-orange-400">Action Required</h4>
                                <p className="text-sm text-orange-200 mt-0.5">Missing control evidence detected. Assign remedial training to close gaps before audit.</p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button onClick={() => handleExport('evidence-pack')} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-300 transition">Export Evidence</button>
                                <button onClick={() => handleDeployTraining(expandedFW.id, 'framework')} className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold rounded shadow-[0_0_10px_rgba(234,88,12,0.3)] transition">Deploy to Outstanding</button>
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto p-0">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-xs font-bold text-slate-500 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Control Item</th>
                                    <th className="px-6 py-4">Requirement</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Evidence Count</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {expandedFW.controls?.map((c: any) => (
                                    <React.Fragment key={c.id}>
                                        <tr className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900 max-w-[200px] truncate">{c.name}</td>
                                            <td className="px-6 py-4 text-sm text-slate-600 max-w-[300px] truncate" title={c.requirement}>{c.requirement}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-[10px] font-bold rounded border ${
                                                    c.status === 'Complete' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                    c.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm font-semibold text-slate-700">
                                                {c.evidence?.length || 0} files
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {c.status !== 'Complete' && (
                                                    <button onClick={() => handleDeployTraining(c.id, 'control')} className="px-3 py-1.5 text-xs text-blue-400 hover:text-white border border-blue-500/30 hover:bg-blue-600/20 rounded transition font-semibold">
                                                        Deploy Training
                                                    </button>
                                                )}
                                                {c.status === 'Complete' && (
                                                    <span className="text-xs text-green-400 font-bold px-3 py-1.5">✓ Met</span>
                                                )}
                                            </td>
                                        </tr>
                                    </React.Fragment>
                                ))}
                                {(!expandedFW.controls || expandedFW.controls.length === 0) && (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No controls mapped to this framework.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
