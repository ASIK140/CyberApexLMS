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

const STAT_CARDS = [
    { label: 'Total Master Courses', value: '142', sub: '+12 this month', icon: <Ic d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />, color: 'text-blue-400' },
    { label: 'Published & Active', value: '94', sub: '66.2% of library', icon: <Ic d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />, color: 'text-green-400' },
    { label: 'Deployment Rate', value: '78%', sub: 'Avg 42 tenants/course', icon: <Ic d="M13 10V3L4 14h7v7l9-11h-7z" />, color: 'text-yellow-400' },
    { label: 'CPD Credits Issued', value: '4.2k', sub: 'Last 30 days', icon: <Ic d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />, color: 'text-purple-400' },
];

type Course = {
    course_id: string;
    course_title: string;
    subtitle?: string;
    course_code: string;
    audience: string;
    duration_minutes: number;
    cpd_credits: number;
    status: 'Draft' | 'InReview' | 'Published';
    frameworks: string[];
    tenants_using: number;
    created_at: string;
};

export default function ContentLibraryPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [createModal, setCreateModal] = useState(false);
    const [previewModal, setPreviewModal] = useState<any>(null);

    useEffect(() => {
        fetchCourses();
    }, [statusFilter]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const url = statusFilter === 'all' ? '/admin/content-library' : `/admin/content-library?status=${statusFilter}`;
            const res = await apiFetch(url);
            const json = await res.json();
            if (json.success) setCourses(json.data);
        } catch (err) {
            console.error('Failed to fetch courses', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCourse = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const frameworksString = formData.get('frameworks')?.toString() || '';
        const frameworks = frameworksString.split(',').map(s => s.trim()).filter(Boolean);
        
        const payload = {
            course_title: formData.get('course_title'),
            course_code: formData.get('course_code'),
            audience: formData.get('audience'),
            duration_minutes: formData.get('duration_minutes'),
            cpd_credits: formData.get('cpd_credits'),
            frameworks: frameworks
        };

        try {
            const res = await apiFetch('/admin/courses/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setCreateModal(false);
                fetchCourses();
            }
        } catch (err) {
            console.error('Failed to create course', err);
        }
    };

    const handlePublish = async (course_id: string) => {
        try {
            const res = await apiFetch('/admin/courses/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ course_id })
            });
            if (res.ok) fetchCourses();
        } catch (err) {
            console.error('Failed to publish', err);
        }
    };

    const handlePreview = async (course_id: string) => {
        try {
            const res = await apiFetch(`/admin/courses/preview/${course_id}`);
            const json = await res.json();
            if (json.success) setPreviewModal(json.data);
        } catch (err) {
            console.error('Failed to preview', err);
        }
    };

    const filteredCourses = courses.filter(c => 
        c.course_title?.toLowerCase().includes(search.toLowerCase()) ||
        c.course_code?.toLowerCase().includes(search.toLowerCase())
    );

    const handleExport = async (type: string) => {
        alert(`Exporting course library as ${type.toUpperCase()}...`);
    };

    return (
        <SuperAdminLayout title="Global Content Library">
            <div className="space-y-6">
                
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {STAT_CARDS.map(s => (
                        <div key={s.label} className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5 hover:border-slate-300 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-xl bg-slate-50 border border-slate-200 ${s.color}`}>
                                    {s.icon}
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{s.label}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-black text-slate-900">{s.value}</h3>
                                <span className="text-[10px] font-medium text-slate-500">{s.sub}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white shadow-sm/50 p-4 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Search courses..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500/50 transition-colors pl-9"
                            />
                            <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-red-500/50"
                        >
                            <option value="all">All Status</option>
                            <option value="Published">Published</option>
                            <option value="InReview">In Review</option>
                            <option value="Draft">Draft</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => handleExport('csv')} className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 transition-all">CSV</button>
                        <button onClick={() => handleExport('excel')} className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 transition-all">EXCEL</button>
                        <button 
                            onClick={() => setCreateModal(true)}
                            className="ml-2 px-5 py-2 text-xs font-black bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-slate-900 rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.2)] transition-all flex items-center gap-2 uppercase tracking-wide"
                        >
                            <Ic d="M12 4v16m8-8H4" />
                            Create Master Course
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Course</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Code</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Audience</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Duration</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">CPD</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Frameworks</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Tenants</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {loading ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium tracking-widest uppercase text-[10px]">Syncing with global repository...</td></tr>
                            ) : filteredCourses.length === 0 ? (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500 font-medium">No courses found matching your criteria.</td></tr>
                            ) : filteredCourses.map((c) => (
                                <tr key={c.course_id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="max-w-[280px]">
                                            <p className="text-xs font-bold text-slate-900 group-hover:text-red-400 transition-colors tracking-tight">{c.course_title}</p>
                                            {c.subtitle && <p className="text-[10px] text-slate-500 font-medium lowercase tracking-tight opacity-70 mt-0.5">{c.subtitle}</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-[10px] font-mono font-bold text-slate-600">{c.course_code}</p>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-600 font-medium">{c.audience}</td>
                                    <td className="px-6 py-4 text-xs text-slate-700 font-bold text-center">{c.duration_minutes}m</td>
                                    <td className="px-6 py-4 text-xs text-slate-900 font-black text-center">{c.cpd_credits.toFixed(1)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {c.frameworks.map(f => (
                                                <span key={f} className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-300">{f}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-center">
                                        <span className="text-slate-900 font-bold">{c.tenants_using}</span>
                                        <span className="text-[10px] text-neutral-600 block">units</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${
                                            c.status === 'Published' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                            c.status === 'InReview' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                                            'bg-neutral-500/10 text-slate-500 border border-neutral-500/20'
                                        }`}>
                                            {c.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => handlePreview(c.course_id)} className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors" title="Preview"><Ic d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><Ic d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></button>
                                            {c.status !== 'Published' && (
                                                <button onClick={() => handlePublish(c.course_id)} className="p-1.5 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white transition-all" title="Publish"><Ic d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {createModal && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setCreateModal(false)}>
                    <div className="bg-white shadow-sm border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white/20">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Create Master Course</h3>
                            <button onClick={() => setCreateModal(false)} className="text-slate-500 hover:text-slate-900 transition-colors"><Ic d="M6 18L18 6M6 6l12 12" /></button>
                        </div>
                        <form onSubmit={handleCreateCourse} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4 text-left">
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Course Title</label>
                                    <input required name="course_title" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-red-500" placeholder="e.g. Advanced Phishing Defense" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Course Code</label>
                                    <input required name="course_code" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-red-500" placeholder="CS-PHISH-01" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Audience</label>
                                    <select name="audience" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-red-500">
                                        <option>All Employees</option>
                                        <option>Executives & Finance</option>
                                        <option>Technical Staff</option>
                                        <option>Compliance Officers</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Duration (Min)</label>
                                    <input type="number" name="duration_minutes" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-red-500" defaultValue={30} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CPD Credits</label>
                                    <input type="number" step="0.5" name="cpd_credits" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-red-500" defaultValue={1.0} />
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Frameworks (Comma separated)</label>
                                    <input name="frameworks" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:outline-none focus:border-red-500" placeholder="ISO27001, NIS2, SOC2" />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                                <button type="button" onClick={() => setCreateModal(false)} className="px-6 py-3 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                                <button type="submit" className="px-8 py-3 text-xs font-black bg-white text-black hover:bg-neutral-200 rounded-xl transition-all uppercase tracking-wide">Initialize Course</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewModal && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setPreviewModal(null)}>
                    <div className="bg-white shadow-sm border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-200 flex justify-between items-center bg-white/40">
                            <div className="text-left">
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{previewModal.course_title}</h3>
                                <p className="text-[10px] text-red-500 font-bold uppercase mt-1 tracking-widest">Master Preview Mode</p>
                            </div>
                            <button onClick={() => setPreviewModal(null)} className="text-slate-500 hover:text-slate-900 transition-colors"><Ic d="M6 18L18 6M6 6l12 12" /></button>
                        </div>
                        <div className="p-8 space-y-6 text-left">
                            <div className="p-4 bg-white/50 border border-slate-200 rounded-xl">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Description</p>
                                <p className="text-xs text-slate-700 leading-relaxed font-medium">{previewModal.description}</p>
                            </div>
                            
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Framework Alignment</p>
                                <div className="flex flex-wrap gap-2">
                                    {previewModal.frameworks?.map((f: any) => (
                                        <div key={f} className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-900 uppercase">{f}</div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Module Structure</p>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {previewModal.modules?.map((m: any) => (
                                        <div key={m.module_id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-4">
                                            <span className="text-[10px] font-black text-red-500">{m.order}</span>
                                            <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">{m.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 flex justify-between items-center">
                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-[9px] font-black text-neutral-600 uppercase">Duration</p>
                                        <p className="text-xs font-bold text-slate-900 uppercase">{previewModal.duration_minutes} Minutes</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-neutral-600 uppercase">Interactive Elements</p>
                                        <p className="text-xs font-bold text-slate-900 uppercase">Video, Quiz, Slides</p>
                                    </div>
                                </div>
                                <button onClick={() => setPreviewModal(null)} className="px-10 py-3 text-xs font-black bg-red-600 text-white rounded-xl hover:bg-red-500 transition-all uppercase tracking-wide">Close Preview</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}
