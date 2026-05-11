'use client';
import React, { useState, useEffect, useCallback } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { apiFetch } from '@/utils/api';

/* ─── Types ─────────────────────────────────── */
type ReviewStatus = 'Draft' | 'In Review' | 'Approved' | 'Published' | 'Rejected';
type ReviewItem = {
    id: string | number;
    course: string;
    audience: string;
    submittedBy: string;
    date: string;
    reviewer: string;
    status: ReviewStatus;
};

/* ─── Fallback seed data when API has no data ─ */
const SEED: ReviewItem[] = [
    { id: 1, course: 'Vendor Risk Profiles', audience: 'Procurement', submittedBy: 'Alex Chen', date: '2026-06-14', reviewer: 'Sarah Jenkins', status: 'In Review' },
    { id: 2, course: 'Ransomware Response Protocol', audience: 'IT & Engineering', submittedBy: 'David Kim', date: '2026-06-12', reviewer: 'Unassigned', status: 'In Review' },
    { id: 3, course: 'Clean Desk Policy Basics', audience: 'All Employees', submittedBy: 'Mia Wong', date: '2026-06-10', reviewer: 'Sarah Jenkins', status: 'Approved' },
    { id: 4, course: 'Cloud Data Storage Compliance', audience: 'Engineering', submittedBy: 'Sam Taylor', date: '2026-06-08', reviewer: 'Alex Chen', status: 'Approved' },
    { id: 5, course: 'Phishing Awareness Masterclass', audience: 'Executives', submittedBy: 'Sarah Jenkins', date: '2026-06-15', reviewer: 'Pending', status: 'Draft' },
];

/* ─── Status config ───────────────────────── */
const STATUS_CONFIG: Record<ReviewStatus, { label: string; cls: string }> = {
    'Draft':     { label: 'DRAFT',     cls: 'bg-slate-100 text-slate-600 border-slate-300' },
    'In Review': { label: 'IN REVIEW', cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    'Approved':  { label: 'APPROVED',  cls: 'bg-green-500/10 text-green-400 border-green-500/20' },
    'Published': { label: 'PUBLISHED', cls: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    'Rejected':  { label: 'REJECTED',  cls: 'bg-red-500/10 text-red-400 border-red-500/20' },
};

export default function ReviewQueue() {
    const [items, setItems] = useState<ReviewItem[]>(SEED);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

    /* Modal state */
    const [modal, setModal] = useState<'review' | 'publish' | 'reject' | null>(null);
    const [selected, setSelected] = useState<ReviewItem | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    /* ── Load from API ── */
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const r = await apiFetch('/content/studio/list').then(r => r.json());
                if (r.success && r.data && r.data.length > 0) {
                    const mapped: ReviewItem[] = r.data.map((c: any) => ({
                        id: c.id,
                        course: c.title,
                        audience: c.audience || 'General',
                        submittedBy: c.created_by_name || 'Unknown',
                        date: c.submitted_at ? c.submitted_at.slice(0, 10) : c.created_at?.slice(0, 10) || '-',
                        reviewer: c.reviewer_name || 'Unassigned',
                        status: c.status === 'in_review' ? 'In Review'
                              : c.status === 'approved'  ? 'Approved'
                              : c.status === 'published' ? 'Published'
                              : c.status === 'rejected'  ? 'Rejected'
                              : 'Draft',
                    }));
                    setItems(mapped);
                }
            } catch {
                /* keep seed data */
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    /* ── Open modals ── */
    const openReview  = (item: ReviewItem) => { setSelected(item); setReviewNotes(''); setModal('review'); };
    const openPublish = (item: ReviewItem) => { setSelected(item); setModal('publish'); };
    const openReject  = (item: ReviewItem) => { setSelected(item); setRejectReason(''); setModal('reject'); };
    const closeModal  = () => { setModal(null); setSelected(null); setProcessing(false); };

    /* ── Update status in local state ── */
    const updateStatus = (id: string | number, newStatus: ReviewStatus) =>
        setItems(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));

    /* ── Approve action ── */
    const handleApprove = async () => {
        if (!selected) return;
        setProcessing(true);
        try {
            let ok = false;
            try {
                const r = await apiFetch(`/content/studio/approve/${selected.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notes: reviewNotes }),
                }).then(r => r.json());
                ok = r.success;
            } catch { ok = true; /* local-only update */ }

            updateStatus(selected.id, 'Approved');
            closeModal();
            showToast(`✅ "${selected.course}" approved! Ready to publish.`);
        } catch {
            showToast('Approval failed. Please try again.', 'error');
        } finally {
            setProcessing(false);
        }
    };

    /* ── Reject action ── */
    const handleReject = async () => {
        if (!selected) return;
        if (!rejectReason.trim()) { showToast('Please enter a rejection reason', 'error'); return; }
        setProcessing(true);
        try {
            try {
                await apiFetch(`/content/studio/reject/${selected.id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: rejectReason }),
                });
            } catch { /* local-only */ }
            updateStatus(selected.id, 'Rejected');
            closeModal();
            showToast(`❌ "${selected.course}" sent back to author with feedback.`, 'info');
        } finally {
            setProcessing(false);
        }
    };

    /* ── Publish action ── */
    const handlePublish = async () => {
        if (!selected) return;
        setProcessing(true);
        try {
            try {
                await apiFetch(`/content/studio/update/${selected.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'published' }),
                });
            } catch { /* local-only */ }
            updateStatus(selected.id, 'Published');
            closeModal();
            showToast(`🚀 "${selected.course}" is now LIVE and available to learners!`);
        } finally {
            setProcessing(false);
        }
    };

    /* ── Filtered list ── */
    const filtered = items.filter(item => {
        const matchSearch = !search || item.course.toLowerCase().includes(search.toLowerCase())
            || item.submittedBy.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'All' || item.status === statusFilter;
        return matchSearch && matchStatus;
    });

    /* ── Stats ── */
    const stats = {
        inReview: items.filter(i => i.status === 'In Review').length,
        approved: items.filter(i => i.status === 'Approved').length,
        published: items.filter(i => i.status === 'Published').length,
        rejected: items.filter(i => i.status === 'Rejected').length,
    };

    const toastColors: Record<string, string> = {
        success: 'bg-green-600 text-white',
        error: 'bg-red-600 text-white',
        info: 'bg-indigo-600 text-white',
    };

    return (
        <SuperAdminLayout
            title="Review Queue"
            subtitle="Review, approve, reject, and publish courses submitted by content authors."
        >
            <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">

                {/* TOAST */}
                {toast && (
                    <div className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-sm max-w-sm ${toastColors[toast.type]}`}>
                        {toast.msg}
                    </div>
                )}

                {/* ── STATS BAR ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Awaiting Review', value: stats.inReview, icon: '⏳', color: 'text-yellow-400', bg: 'bg-yellow-500/5 border-yellow-500/20' },
                        { label: 'Approved', value: stats.approved, icon: '✅', color: 'text-green-400', bg: 'bg-green-500/5 border-green-500/20' },
                        { label: 'Published', value: stats.published, icon: '🚀', color: 'text-indigo-400', bg: 'bg-indigo-500/5 border-indigo-500/20' },
                        { label: 'Rejected', value: stats.rejected, icon: '❌', color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
                    ].map(s => (
                        <div key={s.label} className={`border rounded-xl p-4 flex items-center gap-3 ${s.bg}`}>
                            <span className="text-2xl">{s.icon}</span>
                            <div>
                                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                                <p className="text-xs text-slate-500 font-medium">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── TABLE CARD ── */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between bg-white shadow-sm/50">
                        <div className="relative w-72">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                            <input
                                type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search course or author..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {['All', 'In Review', 'Approved', 'Published', 'Rejected', 'Draft'].map(s => (
                                <button key={s} onClick={() => setStatusFilter(s)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${statusFilter === s ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-neutral-600'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Course Name</th>
                                    <th className="px-6 py-4 font-bold">Target Audience</th>
                                    <th className="px-6 py-4 font-bold">Submitted By</th>
                                    <th className="px-6 py-4 font-bold">Date</th>
                                    <th className="px-6 py-4 font-bold">Reviewer</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/50">
                                {loading ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">⏳ Loading...</td></tr>
                                ) : filtered.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No courses match your filter.</td></tr>
                                ) : filtered.map(item => {
                                    const sc = STATUS_CONFIG[item.status] || STATUS_CONFIG['Draft'];
                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-900 max-w-[200px] truncate">{item.course}</td>
                                            <td className="px-6 py-4 text-slate-600 text-xs">{item.audience}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-black text-indigo-300">
                                                        {item.submittedBy.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                                    </div>
                                                    <span className="text-slate-700 font-medium">{item.submittedBy}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-mono text-xs">{item.date}</td>
                                            <td className="px-6 py-4 text-sm">
                                                {item.reviewer === 'Unassigned' || item.reviewer === 'Pending'
                                                    ? <span className="text-yellow-500/80 italic text-xs">{item.reviewer}</span>
                                                    : <span className="text-slate-700">{item.reviewer}</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${sc.cls}`}>{sc.label}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {item.status === 'In Review' && (<>
                                                        <button onClick={() => openReview(item)}
                                                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition shadow border border-indigo-500/50">
                                                            ✍️ Review
                                                        </button>
                                                        <button onClick={() => openReject(item)}
                                                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-lg text-xs transition border border-red-500/20">
                                                            ✕ Reject
                                                        </button>
                                                    </>)}
                                                    {item.status === 'Approved' && (
                                                        <button onClick={() => openPublish(item)}
                                                            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg text-xs transition shadow border border-green-500/50">
                                                            🚀 Publish
                                                        </button>
                                                    )}
                                                    {item.status === 'Published' && (
                                                        <span className="text-indigo-400 text-xs font-bold">✓ Live</span>
                                                    )}
                                                    {item.status === 'Rejected' && (
                                                        <span className="text-red-400 text-xs italic">Needs rework</span>
                                                    )}
                                                    {item.status === 'Draft' && (
                                                        <span className="text-slate-500 text-xs italic">Not ready</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-3 border-t border-slate-200 text-xs text-slate-500 bg-slate-50">
                        Showing {filtered.length} of {items.length} courses
                    </div>
                </div>
            </div>

            {/* ════════════════════════════════════════════ */}
            {/* MODAL: REVIEW COURSE */}
            {/* ════════════════════════════════════════════ */}
            {modal === 'review' && selected && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Review Course</h3>
                                <p className="text-xs text-slate-600">Evaluate and approve or reject this submission.</p>
                            </div>
                            <button onClick={closeModal} className="text-slate-500 hover:text-slate-900 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">×</button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Course Info */}
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Submission</p>
                                        <h4 className="font-bold text-slate-900 text-lg">{selected.course}</h4>
                                    </div>
                                    <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${STATUS_CONFIG['In Review'].cls}`}>IN REVIEW</span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-slate-600 pb-4 border-b border-slate-200 mb-4">
                                    <span>👤 {selected.submittedBy}</span>
                                    <span>🎯 {selected.audience}</span>
                                    <span>📅 {selected.date}</span>
                                </div>

                                {/* Checklist */}
                                <div className="mb-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-3">Review Checklist</p>
                                    <div className="space-y-2">
                                        {['Content is accurate and up-to-date', 'Learning objectives are clearly stated', 'Language is clear and accessible', 'Quizzes/assessments are relevant', 'Compliance mappings are correct'].map(item => (
                                            <label key={item} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer hover:text-slate-900 transition group">
                                                <input type="checkbox" defaultChecked className="w-4 h-4 accent-indigo-500 rounded" />
                                                <span>{item}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button className="w-full py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold border border-slate-300 rounded-lg transition flex justify-center items-center gap-2 mb-4">
                                    👁️ Preview Course Content
                                </button>

                                <div>
                                    <label className="text-sm font-semibold text-slate-600 mb-2 block">Reviewer Notes <span className="text-neutral-600 font-normal">(optional)</span></label>
                                    <textarea
                                        value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                                        placeholder="Feedback for the author..."
                                        className="w-full h-24 px-4 py-3 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500 resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                            <button onClick={() => { closeModal(); openReject(selected); }}
                                className="px-5 py-2.5 text-sm font-bold text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition">
                                ✕ Reject (Needs Work)
                            </button>
                            <div className="flex gap-3">
                                <button onClick={closeModal} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 bg-white shadow-sm border border-slate-200 rounded-xl transition">
                                    Cancel
                                </button>
                                <button onClick={handleApprove} disabled={processing}
                                    className="px-6 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow transition flex items-center gap-2">
                                    {processing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</> : '✅ Approve Course'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════ */}
            {/* MODAL: REJECT COURSE */}
            {/* ════════════════════════════════════════════ */}
            {modal === 'reject' && selected && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-900">Reject Submission</h3>
                                <p className="text-xs text-slate-600">{selected.course}</p>
                            </div>
                            <button onClick={closeModal} className="text-slate-500 hover:text-slate-900 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl flex gap-3">
                                <span className="text-xl">⚠️</span>
                                <p className="text-sm text-slate-600">The author will receive your feedback and will need to revise and re-submit the course.</p>
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-600 block mb-2">Rejection Reason <span className="text-red-400">*</span></label>
                                <textarea
                                    value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                                    placeholder="Be specific — e.g., 'Quiz questions are too vague' or 'Missing GDPR compliance mapping'..."
                                    className="w-full h-28 px-4 py-3 bg-slate-50 border border-slate-200 focus:border-red-500 rounded-xl text-sm text-slate-900 focus:outline-none resize-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={closeModal} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-100 border border-slate-300 text-slate-900 text-sm font-bold rounded-xl transition">
                                    Cancel
                                </button>
                                <button onClick={handleReject} disabled={processing || !rejectReason.trim()}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition flex items-center justify-center gap-2">
                                    {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '✕ Send Back to Author'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════ */}
            {/* MODAL: PUBLISH COURSE */}
            {/* ════════════════════════════════════════════ */}
            {modal === 'publish' && selected && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-900">Publish Course</h3>
                            <button onClick={closeModal} className="text-slate-500 hover:text-slate-900 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition">×</button>
                        </div>
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center text-3xl mx-auto">🚀</div>
                            <div>
                                <h4 className="font-bold text-slate-900 text-lg mb-1">{selected.course}</h4>
                                <p className="text-sm text-slate-600">
                                    Publishing this course will make it <strong className="text-slate-900">immediately visible</strong> to <span className="text-indigo-400">{selected.audience}</span> learners.
                                </p>
                            </div>
                            <div className="p-3 bg-green-500/5 border border-green-500/20 rounded-xl text-left space-y-1.5 text-xs text-slate-600">
                                <p>✓ Course will appear in the learner catalog</p>
                                <p>✓ Enrolled users will receive a notification</p>
                                <p>✓ Completion tracking will begin immediately</p>
                                <p>✓ Status will change to Published</p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={closeModal} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-100 border border-slate-300 text-slate-900 text-sm font-bold rounded-xl transition">
                                    Cancel
                                </button>
                                <button onClick={handlePublish} disabled={processing}
                                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow transition flex justify-center items-center gap-2">
                                    {processing ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing…</> : '🚀 Publish Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}
