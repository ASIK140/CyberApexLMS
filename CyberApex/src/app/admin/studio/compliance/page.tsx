'use client';
import React, { useState, useMemo } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

/* ─── Types ────────────────────────────────── */
type Status = 'Covered' | 'Partial' | 'Gap';
type MappingRow = {
    id: number;
    framework: string;
    control: string;
    course: string;
    status: Status;
    date: string;
};

/* ─── Data ─────────────────────────────────── */
const FRAMEWORKS = [
    { name: 'ISO 27001',    coverage: 94, icon: '🌐', color: 'from-blue-600 to-indigo-600',   bgGlow: 'bg-blue-500/10' },
    { name: 'SOC2 Security', coverage: 87, icon: '🔒', color: 'from-green-600 to-teal-600',   bgGlow: 'bg-green-500/10' },
    { name: 'PCI DSS',      coverage: 71, icon: '💳', color: 'from-purple-600 to-pink-600',   bgGlow: 'bg-purple-500/10' },
    { name: 'HIPAA',        coverage: 55, icon: '🏥', color: 'from-red-600 to-orange-600',     bgGlow: 'bg-red-500/10' },
    { name: 'NIS2',         coverage: 40, icon: '🛡️', color: 'from-yellow-600 to-amber-600',  bgGlow: 'bg-yellow-500/10' },
];

const INITIAL_MAPPING: MappingRow[] = [
    { id: 1, framework: 'ISO 27001',    control: 'A.8.2.2 Information Awareness',          course: 'Information Security Basics', status: 'Covered', date: '2026-06-01' },
    { id: 2, framework: 'SOC2 Security', control: 'CC1.4 Communication of Security',       course: 'Clean Desk Policy Basics',    status: 'Covered', date: '2026-05-15' },
    { id: 3, framework: 'PCI DSS',      control: 'Req 12.6.1 Security Awareness',          course: 'Invoice Fraud Defense',       status: 'Covered', date: '2026-06-10' },
    { id: 4, framework: 'HIPAA',        control: '164.308(a)(5)(i) Security Awareness',    course: 'Data Privacy Guidelines',     status: 'Partial', date: '2026-04-20' },
    { id: 5, framework: 'NIS2',         control: 'Art 21(2)(g) Human Resources Security',  course: 'Unassigned',                  status: 'Gap',     date: 'N/A' },
    { id: 6, framework: 'ISO 27001',    control: 'A.8.2.3 Handling of Assets',             course: 'Unassigned',                  status: 'Gap',     date: 'N/A' },
    { id: 7, framework: 'SOC2 Security', control: 'CC6.1 Logical Access Controls',         course: 'Access Management Basics',   status: 'Covered', date: '2026-05-20' },
    { id: 8, framework: 'PCI DSS',      control: 'Req 6.4.3 Payment Page Scripts',         course: 'Unassigned',                  status: 'Gap',     date: 'N/A' },
    { id: 9, framework: 'HIPAA',        control: '164.312(a)(2)(i) Unique User ID',        course: 'Unassigned',                  status: 'Gap',     date: 'N/A' },
    { id: 10, framework: 'NIS2',        control: 'Art 21(2)(e) Incident Handling',         course: 'Incident Response Procedures', status: 'Partial', date: '2026-03-10' },
];

const AVAILABLE_COURSES = [
    'Phishing Awareness Adv', 'Deepfake & Voice Scams', 'Remote Work Security',
    'Physical Security Basics', 'Password Management', 'Social Engineering Defense',
    'Zero Trust Architecture', 'Endpoint Protection Basics', 'Cloud Security Fundamentals',
];

const STATUS_CONFIG: Record<Status, { label: string; dot: string; text: string; bg: string; border: string }> = {
    Covered: { label: 'COVERED',  dot: 'bg-green-500',              text: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
    Partial: { label: 'PARTIAL',  dot: 'bg-yellow-500',             text: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    Gap:     { label: 'GAP',      dot: 'bg-red-500 animate-pulse',  text: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/20' },
};

export default function ComplianceMap() {
    const [mapping, setMapping] = useState<MappingRow[]>(INITIAL_MAPPING);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'All' | Status>('All');
    const [frameworkFilter, setFrameworkFilter] = useState('All');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

    /* Link course modal */
    const [linkModal, setLinkModal] = useState<MappingRow | null>(null);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [linkProcessing, setLinkProcessing] = useState(false);

    /* Export processing */
    const [exporting, setExporting] = useState(false);

    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    /* ── Stats ── */
    const stats = useMemo(() => ({
        total: mapping.length,
        covered: mapping.filter(m => m.status === 'Covered').length,
        partial: mapping.filter(m => m.status === 'Partial').length,
        gap: mapping.filter(m => m.status === 'Gap').length,
        pct: Math.round((mapping.filter(m => m.status === 'Covered').length / mapping.length) * 100),
    }), [mapping]);

    /* ── Filtered rows ── */
    const filtered = useMemo(() => mapping.filter(item => {
        const matchSearch = !search
            || item.framework.toLowerCase().includes(search.toLowerCase())
            || item.control.toLowerCase().includes(search.toLowerCase())
            || item.course.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || item.status === statusFilter;
        const matchFramework = frameworkFilter === 'All' || item.framework === frameworkFilter;
        return matchSearch && matchStatus && matchFramework;
    }), [mapping, search, statusFilter, frameworkFilter]);

    /* ── Export CSV ── */
    const handleExport = () => {
        setExporting(true);
        const rows = [
            ['Framework', 'Control Requirement', 'Covered By Course', 'Status', 'Last Evidence'],
            ...mapping.map(r => [r.framework, r.control, r.course, r.status, r.date]),
        ];
        const csv = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'compliance-matrix.csv'; a.click();
        URL.revokeObjectURL(url);
        setTimeout(() => { setExporting(false); showToast('✅ Compliance matrix exported to CSV!'); }, 600);
    };

    /* ── Link Course ── */
    const handleSaveLink = () => {
        if (!selectedCourse || !linkModal) {
            showToast('Please select a course to link.', 'error');
            return;
        }
        setLinkProcessing(true);
        setTimeout(() => {
            setMapping(prev => prev.map(r =>
                r.id === linkModal.id
                    ? { ...r, course: selectedCourse, status: 'Partial', date: new Date().toISOString().slice(0, 10) }
                    : r
            ));
            setLinkProcessing(false);
            setLinkModal(null);
            setSelectedCourse('');
            showToast(`🔗 "${selectedCourse}" linked to ${linkModal.framework}!`);
        }, 900);
    };

    const toastColors: Record<string, string> = {
        success: 'bg-green-600', error: 'bg-red-600', info: 'bg-indigo-600',
    };

    const frameworkNames = ['All', ...Array.from(new Set(mapping.map(m => m.framework)))];

    return (
        <SuperAdminLayout
            title="Compliance Coverage Map"
            subtitle="Identify which frameworks are covered by training and spot structural gaps."
        >
            <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">

                {/* TOAST */}
                {toast && (
                    <div className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-sm text-slate-900 max-w-sm ${toastColors[toast.type]}`}>
                        {toast.msg}
                    </div>
                )}

                {/* ── Top Action Bar ─────────────────────────────── */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-slate-900 font-bold text-xl">Framework Overview</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Overall compliance score: <span className="text-indigo-400 font-bold">{stats.pct}%</span> across {stats.total} controls</p>
                    </div>
                    <button onClick={handleExport} disabled={exporting}
                        className="px-5 py-2.5 bg-white shadow-sm border border-slate-300 hover:bg-slate-100 disabled:opacity-50 text-slate-900 text-sm font-bold rounded-xl transition flex items-center gap-2 shadow-sm">
                        {exporting ? <div className="w-4 h-4 border-2 border-neutral-400/30 border-t-white rounded-full animate-spin" /> : '⬇'}
                        {exporting ? 'Exporting...' : 'Export Matrix'}
                    </button>
                </div>

                {/* ── Stats bar ─────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Controls', value: stats.total,   icon: '📋', color: 'text-slate-900',          bg: 'bg-white shadow-sm border-slate-200' },
                        { label: 'Covered',        value: stats.covered, icon: '✅', color: 'text-green-400',      bg: 'bg-green-500/5 border-green-500/20' },
                        { label: 'Partial',        value: stats.partial, icon: '⚠️', color: 'text-yellow-400',    bg: 'bg-yellow-500/5 border-yellow-500/20' },
                        { label: 'Gaps',           value: stats.gap,     icon: '❌', color: 'text-red-400',       bg: 'bg-red-500/5 border-red-500/20' },
                    ].map(s => (
                        <div key={s.label} className={`border rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:opacity-90 transition ${s.bg}`}
                            onClick={() => setStatusFilter(s.label === 'Total Controls' ? 'All' : s.label === 'Gaps' ? 'Gap' : s.label as any)}>
                            <span className="text-2xl">{s.icon}</span>
                            <div>
                                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Framework Coverage Cards ───────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    {FRAMEWORKS.map((fw, i) => (
                        <div key={i}
                            onClick={() => setFrameworkFilter(frameworkFilter === fw.name ? 'All' : fw.name)}
                            className={`bg-white shadow-sm border rounded-2xl p-4 shadow-xl relative overflow-hidden group cursor-pointer transition-all duration-200 ${frameworkFilter === fw.name ? 'border-indigo-500 ring-1 ring-indigo-500/50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${fw.color} opacity-20 rounded-full blur-[30px] pointer-events-none group-hover:opacity-40 transition-opacity duration-500`} />

                            <div className="flex items-center gap-2 mb-3 relative z-10">
                                <span className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-base">
                                    {fw.icon}
                                </span>
                                <h3 className="font-bold text-slate-900 text-sm leading-tight">{fw.name}</h3>
                            </div>

                            <div className="relative z-10">
                                <div className="flex justify-between text-xs mb-1.5">
                                    <span className="text-slate-600 font-medium">Coverage</span>
                                    <span className={`font-black font-mono ${fw.coverage >= 80 ? 'text-green-400' : fw.coverage >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {fw.coverage}%
                                    </span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-200">
                                    <div className={`h-full bg-gradient-to-r ${fw.color} transition-all`} style={{ width: `${fw.coverage}%` }} />
                                </div>
                                {frameworkFilter === fw.name && (
                                    <p className="text-[10px] text-indigo-400 font-bold mt-1.5">● Filtering active</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Mapping Table ─────────────────────────────── */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">

                    {/* Table Toolbar */}
                    <div className="p-4 border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between bg-white shadow-sm/50">
                        {/* Search */}
                        <div className="relative w-72">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                            <input
                                type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search frameworks or controls..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                            />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 text-sm">✕</button>
                            )}
                        </div>

                        {/* Status Filter Pills */}
                        <div className="flex gap-2 flex-wrap">
                            {(['All', 'Covered', 'Partial', 'Gap'] as const).map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                                        statusFilter === s
                                            ? s === 'Covered' ? 'bg-green-600 border-green-500 text-white'
                                            : s === 'Partial' ? 'bg-yellow-600 border-yellow-500 text-white'
                                            : s === 'Gap'     ? 'bg-red-600 border-red-500 text-white'
                                            : 'bg-indigo-600 border-indigo-500 text-white'
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-neutral-600'
                                    }`}>
                                    {s === 'All' ? 'All' : s === 'Covered' ? '✅ Covered' : s === 'Partial' ? '⚠️ Partial' : '❌ Gap'}
                                    {s !== 'All' && (
                                        <span className="ml-1.5 text-[10px] opacity-60">
                                            ({s === 'Covered' ? stats.covered : s === 'Partial' ? stats.partial : stats.gap})
                                        </span>
                                    )}
                                </button>
                            ))}
                            {(statusFilter !== 'All' || frameworkFilter !== 'All' || search) && (
                                <button onClick={() => { setStatusFilter('All'); setFrameworkFilter('All'); setSearch(''); }}
                                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 text-slate-600 hover:text-slate-900 hover:border-neutral-600 transition">
                                    ✕ Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Active filter hint */}
                    {(statusFilter !== 'All' || frameworkFilter !== 'All') && (
                        <div className="px-5 py-2 bg-indigo-500/5 border-b border-indigo-500/10 text-xs text-indigo-400 font-medium flex items-center gap-2">
                            <span>🔎</span>
                            Showing {filtered.length} of {mapping.length} controls
                            {statusFilter !== 'All' && <span className="ml-1">· Status: <strong>{statusFilter}</strong></span>}
                            {frameworkFilter !== 'All' && <span className="ml-1">· Framework: <strong>{frameworkFilter}</strong></span>}
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Framework</th>
                                    <th className="px-6 py-4 font-bold w-1/3">Control Requirement</th>
                                    <th className="px-6 py-4 font-bold">Covered By Course</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold text-right">Last Evidence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/50">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                                            No controls match your current filter.
                                            <button onClick={() => { setStatusFilter('All'); setFrameworkFilter('All'); setSearch(''); }}
                                                className="ml-2 text-indigo-400 hover:text-indigo-300 underline">Clear filters</button>
                                        </td>
                                    </tr>
                                ) : filtered.map(item => {
                                    const sc = STATUS_CONFIG[item.status];
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <span className="font-bold text-slate-900 text-sm">{item.framework}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-700 text-xs font-mono max-w-xs truncate">{item.control}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.course === 'Unassigned' ? (
                                                    <button
                                                        onClick={() => { setLinkModal(item); setSelectedCourse(''); }}
                                                        className="text-xs font-bold text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:border-indigo-500 transition">
                                                        + Link Course
                                                    </button>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-900 text-xs bg-slate-100 px-3 py-1.5 rounded-full border border-slate-300 max-w-[200px] truncate block">
                                                            {item.course}
                                                        </span>
                                                        <button
                                                            onClick={() => { setLinkModal(item); setSelectedCourse(item.course); }}
                                                            className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-500 hover:text-indigo-400 transition">
                                                            ✎
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${sc.bg} ${sc.border} ${sc.text}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                                    {sc.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-slate-500 font-mono text-xs">{item.date}</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-slate-200 text-xs text-neutral-600 bg-slate-50 flex justify-between items-center rounded-b-2xl">
                        <span>Showing {filtered.length} of {mapping.length} controls</span>
                        <span className="text-slate-500">
                            {stats.gap} gap{stats.gap !== 1 ? 's' : ''} need attention
                        </span>
                    </div>
                </div>

            </div>

            {/* ══════════════════════════════════════════════ */}
            {/* MODAL: LINK COURSE                            */}
            {/* ══════════════════════════════════════════════ */}
            {linkModal && (
                <div className="fixed inset-0 bg-white/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Link Course to Control</h3>
                                <p className="text-xs text-slate-600">Assign a training course to satisfy this requirement</p>
                            </div>
                            <button onClick={() => setLinkModal(null)} className="text-slate-500 hover:text-slate-900 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">×</button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5">
                            {/* Control info */}
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${STATUS_CONFIG[linkModal.status].bg} ${STATUS_CONFIG[linkModal.status].border} ${STATUS_CONFIG[linkModal.status].text}`}>
                                        {linkModal.framework}
                                    </span>
                                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[linkModal.status].dot}`} />
                                    <span className={`text-xs font-bold ${STATUS_CONFIG[linkModal.status].text}`}>{linkModal.status}</span>
                                </div>
                                <p className="text-slate-900 font-mono text-sm font-bold">{linkModal.control}</p>
                            </div>

                            {/* Course selector */}
                            <div>
                                <label className="text-sm font-bold text-slate-700 block mb-2">
                                    Select Existing Course <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-sm text-slate-900 focus:outline-none transition">
                                    <option value="">— Choose a course —</option>
                                    {AVAILABLE_COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Note */}
                            <div className="flex items-start gap-2 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-xs text-slate-600">
                                <span>💡</span>
                                <span>Linking a course will change status to <strong className="text-yellow-400">Partial</strong> until fully validated. Full coverage is confirmed after audit review.</span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between gap-3 pt-2">
                                <span className="text-xs text-slate-500">
                                    No course?{' '}
                                    <a href="/admin/studio/new-course" className="text-indigo-400 hover:text-indigo-300 underline">Create a new one →</a>
                                </span>
                                <div className="flex gap-3">
                                    <button onClick={() => setLinkModal(null)} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white shadow-sm border border-slate-200 rounded-xl transition">
                                        Cancel
                                    </button>
                                    <button onClick={handleSaveLink} disabled={linkProcessing || !selectedCourse}
                                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-bold rounded-xl shadow transition flex items-center gap-2">
                                        {linkProcessing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : '🔗 Save Link'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}
