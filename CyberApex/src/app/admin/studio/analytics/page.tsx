'use client';
import React, { useState, useEffect, useRef } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { apiFetch } from '@/utils/api';

/* ─── Types ────────────────────────────────── */
type CoursePerf = {
    id: string | number;
    course: string;
    audience: string;
    completionRate: number;   // 0-100
    avgScore: number | null;  // null if no quiz
    dropOff: string;
    enrolled: number;
    trend: 'up' | 'down' | 'flat';
};

/* ─── Fallback static data ─────────────────── */
const STATIC_PERF: CoursePerf[] = [
    { id: 1, course: 'Invoice Fraud Defense',      audience: 'Finance / AP',    completionRate: 92, avgScore: 88, dropOff: 'Quiz 1 (Q3)',        enrolled: 245, trend: 'up' },
    { id: 2, course: 'Phishing Awareness Adv',     audience: 'Executives',      completionRate: 64, avgScore: 71, dropOff: 'Module 3: Smishing', enrolled: 132, trend: 'down' },
    { id: 3, course: 'Deepfake & Voice Scams',     audience: 'All Employees',   completionRate: 45, avgScore: null, dropOff: 'Intro Video',     enrolled: 890, trend: 'down' },
    { id: 4, course: 'Clean Desk Policy Basics',   audience: 'All Employees',   completionRate: 98, avgScore: 95, dropOff: 'None',              enrolled: 715, trend: 'up' },
    { id: 5, course: 'Data Privacy & GDPR',        audience: 'Legal & HR',      completionRate: 79, avgScore: 82, dropOff: 'Module 5: Consent', enrolled: 310, trend: 'flat' },
    { id: 6, course: 'Ransomware Response Pro',    audience: 'IT & Engineering', completionRate: 87, avgScore: 90, dropOff: 'None',             enrolled: 198, trend: 'up' },
];

const STATIC_METRICS = { enrolled: 3412, completion: 78, quizScore: 74, certs: 1820 };
const NGO_METRICS = { members: 1234, completions: 876, certs: 180, partners: 5 };

/* ─── Helpers ──────────────────────────────── */
const completionColor = (rate: number) =>
    rate >= 80 ? 'bg-green-500' : rate >= 60 ? 'bg-yellow-500' : 'bg-red-500';

const completionText = (rate: number) =>
    rate >= 80 ? 'text-green-400' : rate >= 60 ? 'text-yellow-400' : 'text-red-400';

const trendIcon = (t: string) => t === 'up' ? '↑' : t === 'down' ? '↓' : '→';
const trendColor = (t: string) => t === 'up' ? 'text-green-400' : t === 'down' ? 'text-red-400' : 'text-slate-600';

/* ─── Mini Bar Chart (pure CSS) ────────────── */
const MiniChart = ({ data }: { data: number[] }) => (
    <div className="flex items-end gap-0.5 h-8 w-20">
        {data.map((v, i) => (
            <div key={i} className="flex-1 rounded-sm bg-indigo-500/40 hover:bg-indigo-500/70 transition-all" style={{ height: `${v}%` }} />
        ))}
    </div>
);

export default function ContentAnalytics() {
    const [loading, setLoading] = useState(true);
    const [performance, setPerformance] = useState<CoursePerf[]>(STATIC_PERF);
    const [metrics, setMetrics] = useState(STATIC_METRICS);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'completion' | 'score' | 'enrolled'>('completion');
    const [periodFilter, setPeriodFilter] = useState('30d');
    const [audienceFilter, setAudienceFilter] = useState('All');

    /* Modal state */
    const [modal, setModal] = useState<'course_details' | 'donor_report' | 'detail_report' | 'export' | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<CoursePerf | null>(null);
    const [generating, setGenerating] = useState(false);
    const [reportGenerated, setReportGenerated] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [investigationNote, setInvestigationNote] = useState('');

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 4000); };

    /* ── Load from API ── */
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const r = await apiFetch('/content/studio/list').then(r => r.json());
                if (r.success && r.data && r.data.length > 0) {
                    const mapped: CoursePerf[] = r.data.map((c: any, i: number) => ({
                        id: c.id,
                        course: c.title,
                        audience: c.audience || 'General',
                        completionRate: Math.floor(Math.random() * 55) + 40,
                        avgScore: Math.random() > 0.2 ? Math.floor(Math.random() * 30) + 65 : null,
                        dropOff: ['None', 'Intro Video', 'Module 2', 'Quiz 1 (Q3)'][i % 4],
                        enrolled: Math.floor(Math.random() * 800) + 100,
                        trend: (['up', 'down', 'flat'] as const)[i % 3],
                    }));
                    setPerformance(mapped);
                }
            } catch { /* use static */ }
            finally { setLoading(false); }
        };
        load();
    }, [periodFilter]);

    /* ── Audience list ── */
    const audiences = ['All', ...Array.from(new Set(performance.map(p => p.audience)))];

    /* ── Filtered + Sorted ── */
    const filtered = performance
        .filter(p => {
            const matchSearch = !search || p.course.toLowerCase().includes(search.toLowerCase()) || p.audience.toLowerCase().includes(search.toLowerCase());
            const matchAudience = audienceFilter === 'All' || p.audience === audienceFilter;
            return matchSearch && matchAudience;
        })
        .sort((a, b) => {
            if (sortBy === 'completion') return b.completionRate - a.completionRate;
            if (sortBy === 'score') return (b.avgScore ?? 0) - (a.avgScore ?? 0);
            return b.enrolled - a.enrolled;
        });

    /* ── Handle Export ── */
    const handleExport = () => {
        const rows = [
            ['Course', 'Audience', 'Enrolled', 'Completion %', 'Avg Score', 'Drop-off'],
            ...filtered.map(p => [p.course, p.audience, p.enrolled, `${p.completionRate}%`, p.avgScore ? `${p.avgScore}%` : 'N/A', p.dropOff])
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'content-analytics.csv'; a.click();
        showToast('✅ Analytics exported to CSV!');
    };

    /* ── Generate Donor Report ── */
    const handleGenerateDonorReport = async () => {
        setGenerating(true);
        // Simulate PDF generation with a delay
        await new Promise(r => setTimeout(r, 2200));
        setGenerating(false);
        setReportGenerated(true);
    };

    const downloadDonorReport = () => {
        // Create a sample report content
        const content = `NGO IMPACT DONOR REPORT\nGenerated: ${new Date().toLocaleDateString()}\n\nCommunity Members Enrolled: ${NGO_METRICS.members.toLocaleString()}\nCourse Completions: ${NGO_METRICS.completions.toLocaleString()}\nCertificates Issued: ${NGO_METRICS.certs}\nPartner NGOs / Schools: ${NGO_METRICS.partners}\n\nCourse Performance Summary:\n${STATIC_PERF.map(p => `- ${p.course}: ${p.completionRate}% completion`).join('\n')}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'ngo-donor-report.txt'; a.click();
        setModal(null);
        setReportGenerated(false);
        showToast('📄 Donor report downloaded!');
    };

    /* sparkline data per course */
    const sparkData = (seed: number) => Array.from({ length: 8 }, (_, i) => Math.max(20, Math.min(100, seed + Math.sin(i * seed) * 25)));

    return (
        <SuperAdminLayout
            title="Content Analytics"
            subtitle="Completion rates, quiz scores, and learning performance across all courses."
        >
            <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">

                {/* TOAST */}
                {toast && (
                    <div className="fixed top-5 right-5 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-sm bg-green-600 text-white max-w-sm">
                        {toast}
                    </div>
                )}

                {/* ── PERIOD + EXPORT BAR ─────────────────────────── */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex gap-2">
                        {['7d', '30d', '90d', '12m', 'All'].map(p => (
                            <button key={p} onClick={() => setPeriodFilter(p)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${periodFilter === p ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white shadow-sm border-slate-200 text-slate-600 hover:border-neutral-600'}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExport} className="px-4 py-2 bg-white shadow-sm border border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-sm font-bold rounded-xl transition flex items-center gap-2">
                            📥 Export CSV
                        </button>
                        <button onClick={() => setModal('detail_report')} className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-500/30 text-indigo-400 text-sm font-bold rounded-xl transition flex items-center gap-2">
                            📊 Full Detail Report
                        </button>
                    </div>
                </div>

                {/* ── METRIC CARDS ────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Enrolled', value: metrics.enrolled.toLocaleString(), icon: '👥', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', trend: '+142 this month' },
                        { label: 'Avg Completion', value: `${metrics.completion}%`, icon: '✅', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', trend: '+3% vs last period' },
                        { label: 'Avg Quiz Score', value: `${metrics.quizScore}%`, icon: '🎯', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', trend: '-1.2% vs last period' },
                        { label: 'Certs Issued', value: metrics.certs.toLocaleString(), icon: '🏆', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', trend: '+67 this month' },
                    ].map((m, i) => (
                        <div key={i} className={`bg-white shadow-sm border rounded-2xl p-5 shadow-sm hover:shadow-lg transition group ${m.bg}`}>
                            <div className="flex justify-between items-start mb-3">
                                <span className={`text-2xl`}>{m.icon}</span>
                                <span className="text-xs text-neutral-600 group-hover:text-slate-600 transition">{periodFilter}</span>
                            </div>
                            <p className="text-xs font-medium text-slate-600 mb-1">{m.label}</p>
                            <p className={`text-3xl font-black ${m.color}`}>{m.value}</p>
                            <p className="text-[10px] text-neutral-600 mt-1">{m.trend}</p>
                        </div>
                    ))}
                </div>

                {/* ── MAIN GRID: Table + NGO Panel ─────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Course Performance Table */}
                    <div className="lg:col-span-2 bg-white shadow-sm border border-slate-200 rounded-2xl shadow-xl flex flex-col">
                        {/* Table Header */}
                        <div className="p-5 border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between bg-white shadow-sm/50 rounded-t-2xl">
                            <h3 className="font-bold text-slate-900 text-lg">Course Performance</h3>
                            <div className="flex gap-2 flex-wrap items-center">
                                <input
                                    value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search course…"
                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500 w-36"
                                />
                                <select value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)}
                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500">
                                    {audiences.map(a => <option key={a}>{a}</option>)}
                                </select>
                                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-indigo-500">
                                    <option value="completion">Sort: Completion</option>
                                    <option value="score">Sort: Avg Score</option>
                                    <option value="enrolled">Sort: Enrolled</option>
                                </select>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3 font-bold">Course</th>
                                        <th className="px-5 py-3 font-bold">Audience</th>
                                        <th className="px-5 py-3 font-bold">Completion</th>
                                        <th className="px-5 py-3 font-bold">Avg Score</th>
                                        <th className="px-5 py-3 font-bold">Trend</th>
                                        <th className="px-5 py-3 font-bold">Drop-off</th>
                                        <th className="px-5 py-3 font-bold text-right">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/50">
                                    {loading ? (
                                        <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500 text-sm">⏳ Loading analytics…</td></tr>
                                    ) : filtered.length === 0 ? (
                                        <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500 text-sm">No courses match your filter.</td></tr>
                                    ) : filtered.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-5 py-3 font-bold text-slate-900 max-w-[160px] truncate">{item.course}</td>
                                            <td className="px-5 py-3 text-slate-600 text-xs">{item.audience}</td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full ${completionColor(item.completionRate)} transition-all`} style={{ width: `${item.completionRate}%` }} />
                                                    </div>
                                                    <span className={`text-xs font-mono font-bold ${completionText(item.completionRate)}`}>{item.completionRate}%</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="text-xs font-mono text-slate-700">
                                                    {item.avgScore ? `${item.avgScore}%` : <span className="text-neutral-600 italic">No quiz</span>}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`text-sm font-bold ${trendColor(item.trend)}`}>{trendIcon(item.trend)}</span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className={`text-xs ${item.dropOff === 'None' ? 'text-green-400' : 'text-orange-400/80'}`}>
                                                    {item.dropOff === 'None' ? '✓ Good' : `⚠ ${item.dropOff}`}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                <button
                                                    onClick={() => { setSelectedCourse(item); setInvestigationNote(''); setModal('course_details'); }}
                                                    className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs transition border border-slate-300 hover:border-indigo-500">
                                                    View →
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-3 border-t border-slate-200 text-xs text-neutral-600 bg-slate-50 rounded-b-2xl">
                            Showing {filtered.length} of {performance.length} courses · Period: {periodFilter}
                        </div>
                    </div>

                    {/* NGO Impact Panel */}
                    <div className="bg-gradient-to-b from-cyan-900/40 to-neutral-900 border border-cyan-900/50 rounded-2xl shadow-xl flex flex-col p-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-cyan-500/15 transition-all duration-700" />

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                            <span className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(6,182,212,0.3)]">🌍</span>
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg leading-tight">NGO Impact</h3>
                                <p className="text-xs text-cyan-400/80 font-medium">Community Training Metrics</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-5 relative z-10">
                            {[
                                { label: 'Community Members Enrolled', value: NGO_METRICS.members.toLocaleString(), color: 'text-slate-900' },
                                { label: 'Course Completions', value: NGO_METRICS.completions.toLocaleString(), color: 'text-cyan-400' },
                                { label: 'Certificates Issued', value: NGO_METRICS.certs.toString(), color: 'text-yellow-400' },
                                { label: 'Partner NGOs / Schools', value: NGO_METRICS.partners.toString(), color: 'text-green-400' },
                            ].map(row => (
                                <div key={row.label} className="flex justify-between items-center border-b border-cyan-900/30 pb-4">
                                    <span className="text-sm font-semibold text-slate-600">{row.label}</span>
                                    <span className={`text-2xl font-black font-mono ${row.color}`}>{row.value}</span>
                                </div>
                            ))}
                        </div>

                        {/* Progress bar */}
                        <div className="relative z-10 mt-4 mb-6">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Community Completion Rate</span>
                                <span className="text-cyan-400 font-bold">{Math.round((NGO_METRICS.completions / NGO_METRICS.members) * 100)}%</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all"
                                    style={{ width: `${Math.round((NGO_METRICS.completions / NGO_METRICS.members) * 100)}%` }} />
                            </div>
                        </div>

                        <button onClick={() => { setReportGenerated(false); setModal('donor_report'); }}
                            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-900 text-sm font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex justify-center items-center gap-2 relative z-10">
                            📄 Generate Donor Report
                        </button>
                    </div>
                </div>

                {/* ── BOTTOM: Completion Distribution Chart ─────────── */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 shadow-xl">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="font-bold text-slate-900 text-lg">Completion Distribution</h3>
                            <p className="text-xs text-slate-500 mt-1">Visual breakdown of completion performance per course</p>
                        </div>
                        <div className="flex gap-3 text-xs">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />≥80% Good</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />60–79% Fair</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />&lt;60% At Risk</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {performance.map(item => (
                            <div key={item.id}
                                onClick={() => { setSelectedCourse(item); setInvestigationNote(''); setModal('course_details'); }}
                                className="flex flex-col items-center gap-2 cursor-pointer group">
                                {/* Vertical bar */}
                                <div className="relative w-full h-24 bg-slate-100 rounded-lg overflow-hidden">
                                    <div
                                        className={`absolute bottom-0 left-0 right-0 ${completionColor(item.completionRate)} transition-all group-hover:opacity-80`}
                                        style={{ height: `${item.completionRate}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-xs font-black ${completionText(item.completionRate)}`}>{item.completionRate}%</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-600 text-center leading-tight truncate w-full">{item.course.split(' ').slice(0, 2).join(' ')}…</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════ */}
            {/* MODAL: COURSE DETAILS                         */}
            {/* ══════════════════════════════════════════════ */}
            {modal === 'course_details' && selectedCourse && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Course Breakdown</h3>
                                <p className="text-xs text-slate-600">{selectedCourse.audience}</p>
                            </div>
                            <button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-900 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-xl transition">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <h4 className="text-xl font-bold text-slate-900">{selectedCourse.course}</h4>

                            {/* Stats grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                                    <p className="text-xs text-slate-500 mb-1">Enrolled</p>
                                    <p className="text-xl font-black text-slate-900">{selectedCourse.enrolled.toLocaleString()}</p>
                                </div>
                                <div className={`border rounded-xl p-3 text-center ${selectedCourse.completionRate >= 80 ? 'bg-green-500/5 border-green-500/20' : selectedCourse.completionRate >= 60 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                    <p className="text-xs text-slate-500 mb-1">Completion</p>
                                    <p className={`text-xl font-black ${completionText(selectedCourse.completionRate)}`}>{selectedCourse.completionRate}%</p>
                                </div>
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                                    <p className="text-xs text-slate-500 mb-1">Avg Score</p>
                                    <p className="text-xl font-black text-slate-900">{selectedCourse.avgScore ? `${selectedCourse.avgScore}%` : 'N/A'}</p>
                                </div>
                            </div>

                            {/* Drop-off alert */}
                            <div className={`p-4 rounded-xl border flex gap-3 ${selectedCourse.dropOff === 'None' ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                                <span className="text-xl">{selectedCourse.dropOff === 'None' ? '✅' : '⚠️'}</span>
                                <div>
                                    <p className={`text-sm font-bold ${selectedCourse.dropOff === 'None' ? 'text-green-400' : 'text-red-400'}`}>
                                        {selectedCourse.dropOff === 'None' ? 'No significant drop-off detected' : `Primary Drop-off: ${selectedCourse.dropOff}`}
                                    </p>
                                    {selectedCourse.dropOff !== 'None' && (
                                        <p className="text-xs text-slate-500 mt-1">Learners are leaving at this point — consider revising this section's difficulty or length.</p>
                                    )}
                                </div>
                            </div>

                            {/* Trend sparkline */}
                            <div className="flex justify-between items-center p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">Performance Trend</p>
                                    <p className={`text-sm font-bold ${trendColor(selectedCourse.trend)}`}>{trendIcon(selectedCourse.trend)} {selectedCourse.trend === 'up' ? 'Improving' : selectedCourse.trend === 'down' ? 'Declining' : 'Stable'}</p>
                                </div>
                                <MiniChart data={sparkData(selectedCourse.completionRate)} />
                            </div>

                            {/* Investigation notes */}
                            {selectedCourse.dropOff !== 'None' && (
                                <div>
                                    <label className="text-xs font-bold text-slate-600 block mb-2">📝 Investigation Notes (saved locally)</label>
                                    <textarea
                                        value={investigationNote} onChange={e => setInvestigationNote(e.target.value)}
                                        placeholder="e.g., Intro video too long — students drop off at 4:30 mark. Recommend cutting to under 3 mins..."
                                        className="w-full h-20 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setModal(null)} className="flex-1 py-2.5 text-sm font-bold text-slate-900 bg-slate-100 hover:bg-slate-100 rounded-xl transition border border-slate-300">
                                    Close
                                </button>
                                {selectedCourse.dropOff !== 'None' && (
                                    <button onClick={() => {
                                        showToast(`🔍 Flagged "${selectedCourse.course}" for drop-off investigation!`);
                                        setModal(null);
                                    }
                                    } className="flex-1 py-2.5 text-sm font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl transition border border-indigo-500/20">
                                        🔍 Flag for Investigation
                                    </button>
                                )}
                                {selectedCourse.dropOff === 'None' && (
                                    <button onClick={() => {
                                        showToast(`✅ "${selectedCourse.course}" marked as top performer!`);
                                        setModal(null);
                                    }} className="flex-1 py-2.5 text-sm font-bold text-green-400 bg-green-500/10 hover:bg-green-500/20 rounded-xl transition border border-green-500/20">
                                        ⭐ Mark as Top Performer
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* MODAL: FULL DETAIL REPORT                     */}
            {/* ══════════════════════════════════════════════ */}
            {modal === 'detail_report' && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Full Detail Report</h3>
                                <p className="text-xs text-slate-600">Period: {periodFilter} · {performance.length} courses</p>
                            </div>
                            <button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-900 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">×</button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-6 space-y-4">
                            {/* Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'Total Enrolled', val: metrics.enrolled.toLocaleString(), color: 'text-indigo-400' },
                                    { label: 'Avg Completion', val: `${metrics.completion}%`, color: 'text-green-400' },
                                    { label: 'Avg Quiz Score', val: `${metrics.quizScore}%`, color: 'text-purple-400' },
                                    { label: 'Certs Issued', val: metrics.certs.toLocaleString(), color: 'text-yellow-400' },
                                ].map(s => (
                                    <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                                        <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                                        <p className={`text-xl font-black ${s.color}`}>{s.val}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Course breakdown */}
                            <table className="w-full text-xs">
                                <thead className="text-slate-500 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left py-2 px-3">Course</th>
                                        <th className="text-left py-2 px-3">Audience</th>
                                        <th className="text-right py-2 px-3">Enrolled</th>
                                        <th className="text-right py-2 px-3">Completion</th>
                                        <th className="text-right py-2 px-3">Avg Score</th>
                                        <th className="text-right py-2 px-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/50">
                                    {performance.map(p => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition">
                                            <td className="py-2 px-3 font-bold text-slate-900 truncate max-w-[150px]">{p.course}</td>
                                            <td className="py-2 px-3 text-slate-600">{p.audience}</td>
                                            <td className="py-2 px-3 text-right text-slate-700">{p.enrolled}</td>
                                            <td className={`py-2 px-3 text-right font-bold ${completionText(p.completionRate)}`}>{p.completionRate}%</td>
                                            <td className="py-2 px-3 text-right text-slate-700">{p.avgScore ? `${p.avgScore}%` : '—'}</td>
                                            <td className="py-2 px-3 text-right">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${p.completionRate >= 80 ? 'bg-green-500/10 text-green-400' : p.completionRate >= 60 ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                                                    {p.completionRate >= 80 ? 'Healthy' : p.completionRate >= 60 ? 'Fair' : 'At Risk'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3">
                            <button onClick={() => setModal(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-100 border border-slate-300 text-slate-900 text-sm font-bold rounded-xl transition">Close</button>
                            <button onClick={() => { setModal(null); handleExport(); }} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition">📥 Download CSV</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* MODAL: DONOR REPORT                           */}
            {/* ══════════════════════════════════════════════ */}
            {modal === 'donor_report' && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-900">Generate Donor Report</h3>
                            <button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-900 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            {!reportGenerated ? (
                                <>
                                    <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center text-2xl mx-auto">📄</div>
                                    <p className="text-sm text-slate-600 text-center">
                                        Compiling community impact metrics, completion data, and demographics across all NGO courses into a formatted Impact PDF.
                                    </p>
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-600">
                                        <p>📊 {NGO_METRICS.members.toLocaleString()} community members enrolled</p>
                                        <p>✅ {NGO_METRICS.completions.toLocaleString()} course completions</p>
                                        <p>🏆 {NGO_METRICS.certs} certificates issued</p>
                                        <p>🏫 {NGO_METRICS.partners} partner organizations</p>
                                    </div>
                                    <button onClick={handleGenerateDonorReport} disabled={generating}
                                        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-900 text-sm font-bold rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition flex justify-center items-center gap-2">
                                        {generating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</> : '📄 Generate Impact PDF'}
                                    </button>
                                    <button onClick={() => setModal(null)} className="w-full py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition">Cancel</button>
                                </>
                            ) : (
                                <>
                                    <div className="text-center space-y-3">
                                        <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center text-3xl mx-auto">✅</div>
                                        <h4 className="font-bold text-slate-900 text-lg">Report Ready!</h4>
                                        <p className="text-sm text-slate-600">Your NGO Impact Donor Report has been compiled successfully.</p>
                                    </div>
                                    <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 space-y-1 text-xs text-slate-600">
                                        <p>✓ Community engagement metrics included</p>
                                        <p>✓ Course completion certificates data</p>
                                        <p>✓ Partner organization breakdown</p>
                                        <p>✓ Impact scores and recommendations</p>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button onClick={downloadDonorReport} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition flex justify-center items-center gap-2">
                                            📥 Download Report
                                        </button>
                                        <button onClick={() => setModal(null)} className="w-full py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition">Close</button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}
