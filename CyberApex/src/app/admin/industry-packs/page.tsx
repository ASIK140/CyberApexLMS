'use client';
import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { apiFetch } from '@/utils/api';

function Ic({ d }: { d: string }) {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
        </svg>
    );
}

type IndustryPack = {
    pack_id: string;
    pack_name: string;
    industry_category: string;
    description: string;
    courses_count: number;
    templates_count: number;
    frameworks: string[];
    created_at: string;
    updated_at: string;
};

type Tenant = {
    tenant_id: string;
    name: string;
    industry: string;
};

export default function IndustryPacksPage() {
    const [packs, setPacks] = useState<IndustryPack[]>([]);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [assignModal, setAssignModal] = useState<IndustryPack | null>(null);
    const [viewModal, setViewModal] = useState<IndustryPack | null>(null);
    const [selectedTenant, setSelectedTenant] = useState('');
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        fetchPacks();
        fetchTenants();
    }, []);

    const fetchPacks = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/admin/industry-packs');
            const json = await res.json();
            if (json.success) setPacks(json.data);
        } catch (err) {
            console.error('Failed to fetch packs', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTenants = async () => {
        try {
            const res = await apiFetch('/admin/tenants');
            const json = await res.json();
            if (json.success) setTenants(json.data);
        } catch (err) {
            console.error('Failed to fetch tenants', err);
        }
    };

    const handleAssign = async () => {
        if (!assignModal || !selectedTenant) return;
        setAssigning(true);
        try {
            const res = await apiFetch('/admin/industry-packs/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pack_id: assignModal.pack_id,
                    tenant_id: selectedTenant
                })
            });
            const json = await res.json();
            if (json.success) {
                alert(json.message);
                setAssignModal(null);
                setSelectedTenant('');
            }
        } catch (err) {
            console.error('Failed to assign pack', err);
        } finally {
            setAssigning(false);
        }
    };

    const filteredPacks = packs.filter(p => 
        p.pack_name.toLowerCase().includes(search.toLowerCase()) ||
        p.industry_category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <SuperAdminLayout title="Industry Training Packs">
            <div className="space-y-6 text-left">
                
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Packs</p>
                        <h3 className="text-2xl font-black text-slate-900">{packs.length}</h3>
                    </div>
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Industry Categories</p>
                        <h3 className="text-2xl font-black text-slate-900">{new Set(packs.map(p => p.industry_category)).size}</h3>
                    </div>
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Deployments</p>
                        <h3 className="text-2xl font-black text-green-400">124</h3>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white shadow-sm/50 p-4 rounded-2xl border border-slate-200">
                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            placeholder="Filter by industry or pack name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500/50 transition-colors pl-9"
                        />
                        <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <button className="px-5 py-2 text-xs font-black bg-white text-black hover:bg-neutral-200 rounded-xl transition-all uppercase tracking-wide flex items-center gap-2">
                        <Ic d="M12 4v16m8-8H4" />
                        Custom Pack Builder
                    </button>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="py-20 text-center text-slate-500 uppercase text-[10px] font-bold tracking-[0.2em]">Initialising Industry Repositories...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 ultra:grid-cols-3 gap-6">
                        {filteredPacks.map(pack => (
                            <div key={pack.pack_id} className="bg-white shadow-sm border border-slate-200 rounded-3xl p-6 flex flex-col hover:border-red-500/30 transition-all duration-300 group">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-tighter border border-red-500/20">
                                        {pack.industry_category}
                                    </span>
                                    <div className="flex gap-1">
                                        {pack.frameworks.slice(0, 3).map(f => (
                                            <span key={f} className="text-[9px] font-bold text-slate-500">{f}</span>
                                        ))}
                                    </div>
                                </div>
                                <h4 className="text-lg font-black text-slate-900 mb-2 group-hover:text-red-400 transition-colors">{pack.pack_name}</h4>
                                <p className="text-xs text-slate-500 line-clamp-2 mb-6 leading-relaxed font-medium">
                                    {pack.description}
                                </p>
                                
                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="text-center p-3 bg-white/40 rounded-2xl border border-slate-200">
                                        <p className="text-[9px] font-black text-neutral-600 uppercase mb-1">Courses</p>
                                        <p className="text-lg font-black text-slate-900">{pack.courses_count}</p>
                                    </div>
                                    <div className="text-center p-3 bg-white/40 rounded-2xl border border-slate-200">
                                        <p className="text-[9px] font-black text-neutral-600 uppercase mb-1">Templates</p>
                                        <p className="text-lg font-black text-slate-900">{pack.templates_count}</p>
                                    </div>
                                    <div className="text-center p-3 bg-white/40 rounded-2xl border border-slate-200">
                                        <p className="text-[9px] font-black text-neutral-600 uppercase mb-1">Compliance</p>
                                        <p className="text-lg font-black text-slate-900">{pack.frameworks.length}</p>
                                    </div>
                                </div>

                                <div className="mt-auto flex gap-3">
                                    <button 
                                        onClick={() => setViewModal(pack)}
                                        className="flex-1 py-3 text-[10px] font-black bg-slate-100 hover:bg-slate-100 text-slate-800 rounded-xl transition-all uppercase tracking-widest border border-slate-300"
                                    >
                                        View Details
                                    </button>
                                    <button 
                                        onClick={() => setAssignModal(pack)}
                                        className="flex-1 py-3 text-[10px] font-black bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all uppercase tracking-widest shadow-[0_4px_12px_rgba(220,38,38,0.2)]"
                                    >
                                        Assign to Tenant
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* View Modal */}
            {viewModal && (
                <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setViewModal(null)}>
                    <div className="bg-white shadow-sm border border-slate-200 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-white/20">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{viewModal.pack_name}</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">{viewModal.industry_category} Industry Pack</p>
                            </div>
                            <button onClick={() => setViewModal(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-all"><Ic d="M6 18L18 6M6 6l12 12" /></button>
                        </div>
                        <div className="p-10 space-y-8 h-[60vh] overflow-y-auto custom-scrollbar text-left">
                            <div className="space-y-4">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Pack Overview</h5>
                                <p className="text-sm text-slate-700 leading-relaxed">{viewModal.description}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Included Courses ({viewModal.courses_count})</h5>
                                    <div className="space-y-2">
                                        {['Phishing & Social Engineering', 'Data Privacy Fundamentals', 'Remote Work Security'].map(c => (
                                            <div key={c} className="p-3 bg-white/40 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {c}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Phishing Templates ({viewModal.templates_count})</h5>
                                    <div className="space-y-2">
                                        {['Office 365 Password Reset', 'Urgent Invoice', 'IT Support Alert'].map(t => (
                                            <div key={t} className="p-3 bg-white/40 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-700 flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div> {t}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-200">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Compliance Frameworks</h5>
                                <div className="flex flex-wrap gap-2">
                                    {viewModal.frameworks.map(f => (
                                        <span key={f} className="px-4 py-2 rounded-xl bg-slate-100 border border-slate-300 text-[10px] font-black text-slate-900">{f}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-white/40 border-t border-slate-200 flex justify-end">
                            <button onClick={() => setViewModal(null)} className="px-10 py-4 text-[10px] font-black bg-red-600 text-white rounded-2xl hover:bg-red-500 transition-all uppercase tracking-widest">Close Overview</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {assignModal && (
                <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={() => setAssignModal(null)}>
                    <div className="bg-white shadow-sm border border-slate-200 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-slate-200 text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                <Ic d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Assign Industry Pack</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Targeting: {assignModal.pack_name}</p>
                        </div>
                        <div className="p-10 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Select Target Tenant</label>
                                <select 
                                    value={selectedTenant}
                                    onChange={(e) => setSelectedTenant(e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-xs text-slate-900 focus:outline-none focus:border-red-500 appearance-none"
                                >
                                    <option value="">Choose a tenant...</option>
                                    {tenants.map(t => (
                                        <option key={t.tenant_id} value={t.tenant_id}>{t.name} ({t.industry})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-white/40 p-5 rounded-2xl border border-slate-200 space-y-3">
                                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Automated Actions</p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                        <div className="w-1 h-1 rounded-full bg-green-500"></div> Deploy {assignModal.courses_count} Master Courses
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                        <div className="w-1 h-1 rounded-full bg-green-500"></div> Load {assignModal.templates_count} Phishing Templates
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                                        <div className="w-1 h-1 rounded-full bg-green-500"></div> Link {assignModal.frameworks.length} Compliance Frameworks
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-white/40 border-t border-slate-200 flex gap-4">
                            <button 
                                onClick={() => setAssignModal(null)}
                                className="flex-1 py-4 text-[10px] font-black text-slate-500 hover:text-slate-900 transition-all uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button 
                                disabled={!selectedTenant || assigning}
                                onClick={handleAssign}
                                className="flex-1 py-4 text-[10px] font-black bg-white text-black hover:bg-neutral-200 disabled:opacity-30 disabled:hover:bg-white rounded-2xl transition-all uppercase tracking-widest shadow-xl shadow-white/5"
                            >
                                {assigning ? 'Deploying...' : 'Deploy Pack'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}
