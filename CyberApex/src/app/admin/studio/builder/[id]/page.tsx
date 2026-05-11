'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { apiFetch } from '@/utils/api';

const STEPS = ['📋 Course Setup', '🧱 Build Modules', '⚙️ Rules & Settings', '🚀 Review & Publish'];
const COMPLIANCE_TAGS = ['ISO 27001', 'SOC2', 'PCI DSS', 'GDPR', 'NIST', 'ISO 27701'];

const BLOCK_TYPES = [
    { type: 'video',          label: '🎥 Video',          desc: 'Upload MP4 video' },
    { type: 'notes',          label: '📝 Notes / PDF',    desc: 'Upload PDF document' },
    { type: 'quiz',           label: '📊 Quiz',           desc: 'Multi-question quiz' },
    { type: 'quick_question', label: '⚡ Quick Question', desc: 'Single instant feedback' },
    { type: 'scenario',       label: '🎭 Scenario',       desc: 'Real-life simulation' },
];

export default function CourseBuilderPage() {
    const params       = useParams();
    const searchParams = useSearchParams();
    const router       = useRouter();
    const courseId     = params?.id as string;

    const [step, setStep]   = useState(searchParams?.get('tab') === 'review' ? 3 : 0);
    const [course, setCourse]   = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving]   = useState(false);
    const [toast, setToast]     = useState<{ msg: string; type: 'success' | 'error' | 'warning' } | null>(null);

    // Step 0 — Course Setup
    const [setupForm, setSetupForm] = useState({
        title: '', description: '', audience: 'Corporate', category: '',
        compliance_tags: [] as string[], pass_mark: 70,
        certificate_enabled: true, certificate_name: '',
    });

    // Step 1 — Module/Lesson tree
    const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [addingModule, setAddingModule] = useState(false);
    const [addingLesson, setAddingLesson] = useState(false);
    const [newModTitle, setNewModTitle]   = useState('');
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [addingBlock, setAddingBlock]   = useState(false);

    // Step 1 — Selected block editor
    const [selectedBlock, setSelectedBlock] = useState<any>(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const pdfInputRef   = useRef<HTMLInputElement>(null);

    // Step 1 — Quiz panel
    const [showQuizPanel, setShowQuizPanel]   = useState(false);
    const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
    const [newQuestion, setNewQuestion] = useState({
        question: '', options: ['', '', '', ''], correct_answer: 0, explanation: '',
    });
    const [savingQuestion, setSavingQuestion] = useState(false);

    // Step 2 — Settings
    const [settings, setSettings] = useState({ deadline_days: '', reminder_days: 3, supervisor_visible: true });

    // Step 3 — Validation & publish
    const [validationResult, setValidationResult] = useState<any>(null);
    const [validating, setValidating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [assignData, setAssignData] = useState<{ tenants: any[]; prismaId: string | null; loading: boolean }>({ tenants: [], prismaId: null, loading: false });

    const showToast = (msg: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const loadCourse = useCallback(async () => {
        if (!courseId) return;
        try {
            const r = await apiFetch(`/content/studio/${courseId}`).then(r => r.json());
            if (r.success) {
                setCourse(r.data);
                setSetupForm(f => ({ ...f, ...r.data, compliance_tags: r.data.compliance_tags || [] }));
                setSettings(s => ({
                    ...s,
                    deadline_days:    r.data.deadline_days || '',
                    reminder_days:    r.data.reminder_days || 3,
                    supervisor_visible: r.data.manager_visible !== false,
                }));
            }
        } catch {}
        finally { setLoading(false); }
    }, [courseId]);

    useEffect(() => { loadCourse(); }, [loadCourse]);

    const modules   = course?.modules || [];
    const selMod    = modules.find((m: any) => m.id === selectedModuleId);
    const selLesson = selMod?.lessons?.find((l: any) => l.id === selectedLessonId);
    const selQuiz   = selLesson?.quizzes?.[0];

    // ── Save Setup ──────────────────────────────────────────────────────────────
    const saveSetup = async () => {
        if (!setupForm.title.trim()) { showToast('Course title is required', 'error'); return; }
        setSaving(true);
        try {
            const r = await apiFetch(`/content/studio/update/${courseId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(setupForm),
            });
            const d = await r.json();
            if (!d.success) throw new Error(d.message);
            showToast('✅ Course details saved');
            await loadCourse();
            setStep(1);
        } catch (e: any) { showToast(e.message, 'error'); }
        finally { setSaving(false); }
    };

    // ── Add Module ──────────────────────────────────────────────────────────────
    const addModule = async () => {
        if (!newModTitle.trim()) return;
        const r = await apiFetch('/content/studio/modules/add', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_id: courseId, title: newModTitle }),
        });
        const d = await r.json();
        if (d.success) { setNewModTitle(''); setAddingModule(false); await loadCourse(); setSelectedModuleId(d.data.id); showToast('Module added'); }
        else showToast(d.message, 'error');
    };

    // ── Add Lesson ──────────────────────────────────────────────────────────────
    const addLesson = async () => {
        if (!newLessonTitle.trim() || !selectedModuleId) return;
        const r = await apiFetch('/content/studio/lessons/add', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module_id: selectedModuleId, title: newLessonTitle }),
        });
        const d = await r.json();
        if (d.success) { setNewLessonTitle(''); setAddingLesson(false); await loadCourse(); setSelectedLessonId(d.data.id); showToast('Lesson added'); }
        else showToast(d.message, 'error');
    };

    // ── Add Block ───────────────────────────────────────────────────────────────
    const addBlock = async (type: string) => {
        if (!selectedLessonId) return;
        setAddingBlock(true);
        try {
            const r = await apiFetch('/content/studio/blocks/add', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lesson_id: selectedLessonId, type, title: type }),
            });
            const d = await r.json();
            if (!d.success) { showToast(d.message, 'error'); return; }

            if (type === 'quiz') {
                const qr = await apiFetch('/content/studio/quiz/create', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lesson_id: selectedLessonId, title: 'Lesson Quiz' }),
                }).then(r => r.json());
                if (qr.success) { setSelectedQuizId(qr.data.id); setShowQuizPanel(true); setSelectedBlock(null); }
            } else {
                setSelectedBlock(d.data);
                setShowQuizPanel(false);
            }
            await loadCourse();
            showToast(`${type} block added`);
        } finally { setAddingBlock(false); }
    };

    // ── Delete Block ────────────────────────────────────────────────────────────
    const deleteBlock = async (blockId: string) => {
        await apiFetch(`/content/studio/blocks/${blockId}`, { method: 'DELETE' });
        if (selectedBlock?.id === blockId) setSelectedBlock(null);
        await loadCourse();
        showToast('Block deleted');
    };

    // ── Upload file for block ───────────────────────────────────────────────────
    const uploadFile = async (file: File, blockId: string) => {
        setUploadingFile(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const r = await apiFetch('/content/studio/upload', { method: 'POST', body: fd });
            const d = await r.json();
            if (!d.success) throw new Error(d.message);

            const fileType = file.type.startsWith('video/') ? 'video' : 'pdf';
            const ur = await apiFetch(`/content/studio/blocks/${blockId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content_json: { url: d.data.url, originalname: d.data.originalname, size: d.data.size, fileType },
                }),
            });
            const ud = await ur.json();
            if (ud.success) {
                setSelectedBlock((prev: any) => ({ ...prev, content_json: { url: d.data.url, originalname: d.data.originalname, size: d.data.size, fileType } }));
                await loadCourse();
                showToast('✅ File uploaded successfully');
            }
        } catch (e: any) { showToast(e.message, 'error'); }
        finally { setUploadingFile(false); }
    };

    // ── Add Quiz Question ───────────────────────────────────────────────────────
    const addQuizQuestion = async () => {
        if (!newQuestion.question.trim()) { showToast('Question text required', 'error'); return; }
        if (newQuestion.options.filter(o => o.trim()).length < 2) { showToast('At least 2 options required', 'error'); return; }
        const qid = selectedQuizId || selQuiz?.id;
        if (!qid) { showToast('No quiz found', 'error'); return; }
        setSavingQuestion(true);
        try {
            const r = await apiFetch('/content/studio/questions/add', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quiz_id: qid, ...newQuestion, options: newQuestion.options.filter(o => o.trim()) }),
            });
            const d = await r.json();
            if (d.success) {
                setNewQuestion({ question: '', options: ['', '', '', ''], correct_answer: 0, explanation: '' });
                await loadCourse();
                showToast('✅ Question added');
            } else showToast(d.message, 'error');
        } finally { setSavingQuestion(false); }
    };

    const deleteQuestion = async (qId: string) => {
        await apiFetch(`/content/studio/questions/${qId}`, { method: 'DELETE' });
        await loadCourse();
        showToast('Question deleted');
    };

    // ── Save Settings ───────────────────────────────────────────────────────────
    const saveSettings = async () => {
        setSaving(true);
        try {
            const r = await apiFetch(`/content/studio/update/${courseId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
            });
            const d = await r.json();
            if (d.success) { showToast('Settings saved'); setStep(3); }
            else showToast(d.message, 'error');
        } catch (e: any) { showToast(e.message, 'error'); }
        finally { setSaving(false); }
    };

    // ── Validate ────────────────────────────────────────────────────────────────
    const runValidation = async () => {
        setValidating(true);
        try {
            const r = await apiFetch(`/content/studio/validate/${courseId}`).then(r => r.json());
            setValidationResult(r);
        } catch {} finally { setValidating(false); }
    };

    // ── Publish Course (submit + approve in one step) ───────────────────────────
    const publishCourse = async () => {
        setSubmitting(true);
        try {
            if (course?.status === 'draft') {
                const r1 = await apiFetch(`/content/studio/submit-review/${courseId}`, { method: 'POST' });
                const d1 = await r1.json();
                if (!d1.success) throw new Error(d1.message + (d1.errors ? ': ' + d1.errors.join(', ') : ''));
            }
            const r2 = await apiFetch(`/content/studio/approve/${courseId}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approved_by: 'Super Admin', reviewer_note: 'Published directly by Super Admin' }),
            });
            const d2 = await r2.json();
            if (!d2.success) throw new Error(d2.message);
            showToast('🎉 Course published and live!');
            await loadCourse();
            await loadAssignList();
        } catch (e: any) { showToast(e.message, 'error'); }
        finally { setSubmitting(false); }
    };

    // ── Load tenant assignment list ──────────────────────────────────────────────
    const loadAssignList = useCallback(async () => {
        setAssignData(a => ({ ...a, loading: true }));
        try {
            const [tenantsR, libR] = await Promise.all([
                apiFetch('/v1/tenants').then(r => r.json()),
                apiFetch('/admin/content-library').then(r => r.json()),
            ]);
            const tenants: any[] = tenantsR.data || [];
            const libEntry = (libR.data || []).find((c: any) => c.course_title === course?.title);
            const prismaId = libEntry?.course_id || null;
            const results = await Promise.all(tenants.map(async (t: any) => {
                try {
                    const cr = await apiFetch(`/admin/tenants/${t.id}/courses`).then(r => r.json());
                    const assigned = (cr.data || []).some((c: any) => c.course_id === prismaId || c.title === course?.title);
                    return { ...t, assigned };
                } catch { return { ...t, assigned: false }; }
            }));
            setAssignData({ tenants: results, prismaId, loading: false });
        } catch { setAssignData(a => ({ ...a, loading: false })); }
    }, [course?.title]);

    // Auto-load assignment list when reaching step 3 on a published course
    useEffect(() => {
        if (step === 3 && course?.status === 'published') loadAssignList();
    }, [step, course?.status, loadAssignList]);

    const toggleTag = (tag: string) => setSetupForm(f => ({
        ...f, compliance_tags: f.compliance_tags.includes(tag) ? f.compliance_tags.filter(t => t !== tag) : [...f.compliance_tags, tag],
    }));

    const fmtSize = (bytes: number) => bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

    if (loading) return (
        <SuperAdminLayout title="Course Builder" subtitle="Build modules, lessons, quizzes and publish">
            <div className="flex items-center justify-center h-[60vh] text-slate-500">
                <div className="text-center"><div className="text-5xl mb-4 animate-pulse">🧱</div><p>Loading course builder...</p></div>
            </div>
        </SuperAdminLayout>
    );

    return (
        <SuperAdminLayout title="Course Builder" subtitle="Build modules, lessons, quizzes and publish">
            <div className="max-w-7xl mx-auto w-full">

                {/* TOAST */}
                {toast && (
                    <div className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-sm max-w-md ${toast.type === 'success' ? 'bg-green-600' : toast.type === 'warning' ? 'bg-amber-600' : 'bg-red-600'} text-white`}>
                        {toast.msg}
                    </div>
                )}

                {/* Hidden file inputs */}
                <input ref={videoInputRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/avi,.mkv" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f && selectedBlock) uploadFile(f, selectedBlock.id); e.target.value = ''; }} />
                <input ref={pdfInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f && selectedBlock) uploadFile(f, selectedBlock.id); e.target.value = ''; }} />

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/studio" className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 text-slate-600 text-sm">← Back</Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900">{course?.title || 'Course Builder'}</h1>
                            <p className="text-xs text-slate-500">
                                {course?.status === 'published' ? '✅ Published' : course?.status === 'in_review' ? '⏳ In Review' : '📄 Draft'} · v{course?.version || 1}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Step stepper */}
                <div className="flex gap-0 mb-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    {STEPS.map((s, i) => (
                        <button key={i} onClick={() => setStep(i)}
                            className={`flex-1 py-4 text-sm font-bold transition-all border-r last:border-r-0 border-slate-200 ${step === i ? 'bg-indigo-600/20 text-indigo-600' : i < step ? 'text-green-600 hover:bg-slate-50' : 'text-slate-400 hover:bg-slate-50'}`}>
                            {i < step ? '✅ ' : ''}{s}
                        </button>
                    ))}
                </div>

                {/* ── STEP 0: COURSE SETUP ────────────────────────────────────── */}
                {step === 0 && (
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-5">
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">📋 Basic Info</h2>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Course Title <span className="text-red-400">*</span></label>
                                    <input value={setupForm.title} onChange={e => setSetupForm({ ...setupForm, title: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none text-slate-900" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Description</label>
                                    <textarea value={setupForm.description || ''} onChange={e => setSetupForm({ ...setupForm, description: e.target.value })} rows={4} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none resize-none text-slate-900" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Audience</label>
                                        <select value={setupForm.audience} onChange={e => setSetupForm({ ...setupForm, audience: e.target.value })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-slate-900">
                                            <option>Corporate</option><option>NGO</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Category</label>
                                        <input value={setupForm.category || ''} onChange={e => setSetupForm({ ...setupForm, category: e.target.value })} placeholder="e.g. Phishing" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none text-slate-900" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">🛡️ Compliance Mapping</h2>
                                <div className="flex flex-wrap gap-2">
                                    {COMPLIANCE_TAGS.map(tag => (
                                        <button key={tag} onClick={() => toggleTag(tag)}
                                            className={`px-3 py-2 text-xs font-bold rounded-xl border transition ${setupForm.compliance_tags.includes(tag) ? 'bg-indigo-600/20 border-indigo-500 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">🏆 Certificate Settings</h2>
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                    <span className="text-sm text-slate-700">Issue Certificate on Completion</span>
                                    <button onClick={() => setSetupForm({ ...setupForm, certificate_enabled: !setupForm.certificate_enabled })}
                                        className={`ml-auto w-12 h-6 rounded-full border transition relative ${setupForm.certificate_enabled ? 'bg-green-500 border-green-600' : 'bg-slate-200 border-slate-300'}`}>
                                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${setupForm.certificate_enabled ? 'left-6' : 'left-0.5'}`} />
                                    </button>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Certificate Name</label>
                                    <input value={setupForm.certificate_name || ''} onChange={e => setSetupForm({ ...setupForm, certificate_name: e.target.value })} placeholder="Certificate of Completion" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-sm focus:border-indigo-500 focus:outline-none text-slate-900" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Pass Mark (%)</label>
                                    <input type="number" value={setupForm.pass_mark} onChange={e => setSetupForm({ ...setupForm, pass_mark: Number(e.target.value) })} min={0} max={100} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-sm focus:border-indigo-500 focus:outline-none text-slate-900" />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button onClick={saveSetup} disabled={saving} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg transition">
                                    {saving ? '⏳ Saving...' : 'Save & Next → Build Modules'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 1: BUILD MODULES ───────────────────────────────────── */}
                {step === 1 && (
                    <>
                        <div className="flex gap-4" style={{ height: 'calc(100vh - 310px)', minHeight: '520px' }}>

                            {/* LEFT: Module / Lesson tree */}
                            <div className="w-64 flex-shrink-0 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                    <span className="text-xs font-black text-slate-600 uppercase tracking-widest">Modules</span>
                                    <button onClick={() => setAddingModule(true)} className="text-indigo-600 hover:text-indigo-800 text-xl font-black leading-none">+</button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                    {modules.map((mod: any, mi: number) => (
                                        <div key={mod.id}>
                                            <button onClick={() => { setSelectedModuleId(mod.id); setSelectedLessonId(null); setSelectedBlock(null); setShowQuizPanel(false); }}
                                                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${selectedModuleId === mod.id ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}>
                                                <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-black">{mi + 1}</span>
                                                <span className="truncate">{mod.title}</span>
                                            </button>
                                            {selectedModuleId === mod.id && (
                                                <div className="ml-4 mt-1 space-y-0.5">
                                                    {(mod.lessons || []).map((lesson: any) => (
                                                        <button key={lesson.id} onClick={() => { setSelectedLessonId(lesson.id); setSelectedBlock(null); setShowQuizPanel(false); }}
                                                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${selectedLessonId === lesson.id ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-500 hover:bg-slate-100'}`}>
                                                            📄 <span className="truncate">{lesson.title}</span>
                                                            {(lesson.quizzes?.length || 0) > 0 && <span className="ml-auto text-purple-500 text-[9px]">📊</span>}
                                                        </button>
                                                    ))}
                                                    {addingLesson && selectedModuleId === mod.id ? (
                                                        <div className="flex gap-1 mt-1">
                                                            <input autoFocus value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLesson()} placeholder="Lesson name..." className="flex-1 bg-white border border-indigo-400 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none" />
                                                            <button onClick={addLesson} className="px-2 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold">✓</button>
                                                            <button onClick={() => setAddingLesson(false)} className="px-2 py-1 bg-slate-200 text-slate-600 rounded-lg text-xs">×</button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => setAddingLesson(true)} className="w-full text-left px-3 py-1.5 text-xs text-indigo-500 hover:text-indigo-700 transition font-medium">+ Add Lesson</button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {addingModule ? (
                                        <div className="flex gap-1 p-2">
                                            <input autoFocus value={newModTitle} onChange={e => setNewModTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addModule()} placeholder="Module name..." className="flex-1 bg-white border border-indigo-400 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none" />
                                            <button onClick={addModule} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold">✓</button>
                                            <button onClick={() => setAddingModule(false)} className="px-3 py-2 bg-slate-200 text-slate-600 rounded-xl text-sm">×</button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setAddingModule(true)} className="w-full text-left px-3 py-2.5 text-sm text-indigo-500 hover:text-indigo-700 transition font-bold">+ Add Module</button>
                                    )}
                                </div>
                            </div>

                            {/* CENTER: Content blocks for selected lesson */}
                            <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden">
                                {selLesson ? (
                                    <>
                                        <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                            <div>
                                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Lesson: </span>
                                                <span className="text-sm font-bold text-slate-900">{selLesson.title}</span>
                                            </div>
                                            {selLesson?.quizzes?.length > 0 && (
                                                <button onClick={() => { setShowQuizPanel(!showQuizPanel); setSelectedBlock(null); }}
                                                    className="px-3 py-1.5 text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition">
                                                    📊 {showQuizPanel ? 'Hide' : 'Manage'} Quiz ({selLesson.quizzes[0]?.questions?.length || 0} Qs)
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                            {(selLesson.blocks || []).map((block: any) => {
                                                const isSelected = selectedBlock?.id === block.id;
                                                const hasFile = !!block.content_json?.url;
                                                return (
                                                    <div key={block.id}
                                                        onClick={() => { setSelectedBlock(block); setShowQuizPanel(false); }}
                                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}>
                                                        <span className="text-xl flex-shrink-0">
                                                            {block.type === 'video' ? '🎥' : block.type === 'notes' ? '📝' : block.type === 'quiz' ? '📊' : block.type === 'scenario' ? '🎭' : '⚡'}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-slate-900 capitalize">{block.type.replace('_', ' ')}</p>
                                                            <p className="text-xs text-slate-500 truncate">
                                                                {hasFile ? `✅ ${block.content_json.originalname || 'File uploaded'}` : 'Click to upload file or edit'}
                                                            </p>
                                                        </div>
                                                        <button onClick={e => { e.stopPropagation(); deleteBlock(block.id); }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition text-xs">🗑️</button>
                                                    </div>
                                                );
                                            })}
                                            {(selLesson.blocks || []).length === 0 && (
                                                <div className="text-center py-16 text-slate-400">
                                                    <p className="text-4xl mb-3">🧱</p>
                                                    <p className="text-sm">Add content blocks using the panel →</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-3">
                                        <span className="text-5xl">📄</span>
                                        <p>{modules.length === 0 ? 'Add a module to get started' : 'Select a lesson to add content'}</p>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: Block picker / Quiz editor / Block content editor */}
                            <div className="w-72 flex-shrink-0 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-y-auto">

                                {/* Quiz panel */}
                                {showQuizPanel && selLesson?.quizzes?.length > 0 && (
                                    <div className="p-4 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xs font-black text-purple-600 uppercase tracking-widest">📊 Quiz Editor</h3>
                                            <button onClick={() => setShowQuizPanel(false)} className="text-slate-400 hover:text-slate-600">×</button>
                                        </div>
                                        <p className="text-xs text-slate-500">{selLesson.quizzes[0]?.questions?.length || 0} questions · Pass: {selLesson.quizzes[0]?.pass_mark}%</p>

                                        {/* Existing questions */}
                                        {(selLesson.quizzes[0]?.questions || []).map((q: any, qi: number) => (
                                            <div key={q.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-xs font-bold text-slate-900 flex-1">{qi + 1}. {q.question}</p>
                                                    <button onClick={() => deleteQuestion(q.id)} className="text-red-400 hover:text-red-600 text-xs ml-1 flex-shrink-0">🗑️</button>
                                                </div>
                                                <div className="mt-2 space-y-1">
                                                    {(q.options || []).map((opt: string, oi: number) => (
                                                        <div key={oi} className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg ${oi === q.correct_answer ? 'bg-green-100 text-green-700 font-bold' : 'text-slate-500'}`}>
                                                            {oi === q.correct_answer ? '✅' : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 flex-shrink-0 inline-block" />}
                                                            <span>{opt}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {q.explanation && <p className="text-[10px] text-indigo-500 mt-2 italic">💡 {q.explanation}</p>}
                                            </div>
                                        ))}

                                        {/* Add new question */}
                                        <div className="border-t border-slate-200 pt-3 space-y-3">
                                            <p className="text-xs font-black text-slate-600 uppercase">+ Add Question</p>
                                            <textarea value={newQuestion.question} onChange={e => setNewQuestion({ ...newQuestion, question: e.target.value })}
                                                placeholder="Question text..." rows={2} className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:border-purple-500 focus:outline-none resize-none" />
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">Options — click ● to mark correct</p>
                                            {newQuestion.options.map((opt, oi) => (
                                                <div key={oi} className="flex items-center gap-2">
                                                    <button onClick={() => setNewQuestion({ ...newQuestion, correct_answer: oi })}
                                                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition ${newQuestion.correct_answer === oi ? 'bg-green-500 border-green-500' : 'border-slate-400'}`} />
                                                    <input value={opt} onChange={e => { const opts = [...newQuestion.options]; opts[oi] = e.target.value; setNewQuestion({ ...newQuestion, options: opts }); }}
                                                        placeholder={`Option ${oi + 1}${oi === newQuestion.correct_answer ? ' ✓ correct' : ''}`}
                                                        className={`flex-1 bg-slate-50 border rounded-lg px-2 py-1.5 text-slate-900 text-xs focus:outline-none ${oi === newQuestion.correct_answer ? 'border-green-400 bg-green-50' : 'border-slate-300 focus:border-purple-400'}`} />
                                                </div>
                                            ))}
                                            <input value={newQuestion.explanation} onChange={e => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                                                placeholder="Explanation (shown after answer)" className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:border-purple-500 focus:outline-none" />
                                            <button onClick={addQuizQuestion} disabled={savingQuestion} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-lg transition">
                                                {savingQuestion ? '⏳ Saving...' : '+ Add Question'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Block content editor (video / PDF) */}
                                {!showQuizPanel && selectedBlock && (
                                    <div className="p-4 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest">
                                                {selectedBlock.type === 'video' ? '🎥 Video Block' : selectedBlock.type === 'notes' ? '📝 Notes / PDF Block' : '🎭 Content Block'}
                                            </h3>
                                            <button onClick={() => setSelectedBlock(null)} className="text-slate-400 hover:text-slate-600">×</button>
                                        </div>

                                        {/* Video block */}
                                        {selectedBlock.type === 'video' && (
                                            <div className="space-y-3">
                                                {selectedBlock.content_json?.url ? (
                                                    <div className="space-y-2">
                                                        <video src={selectedBlock.content_json.url} controls className="w-full rounded-xl border border-slate-200 max-h-48 bg-black" />
                                                        <p className="text-[10px] text-slate-500 truncate">📁 {selectedBlock.content_json.originalname}</p>
                                                        <p className="text-[10px] text-slate-400">{fmtSize(selectedBlock.content_json.size || 0)}</p>
                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                                                        <div className="text-3xl mb-2">🎥</div>
                                                        <p className="text-xs text-slate-500 mb-1">No video uploaded</p>
                                                        <p className="text-[10px] text-slate-400">MP4, WebM, MOV, AVI (max 500MB)</p>
                                                    </div>
                                                )}
                                                <button onClick={() => videoInputRef.current?.click()} disabled={uploadingFile}
                                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition flex items-center justify-center gap-2">
                                                    {uploadingFile ? '⏳ Uploading...' : selectedBlock.content_json?.url ? '🔄 Replace Video' : '📤 Upload Video'}
                                                </button>
                                            </div>
                                        )}

                                        {/* Notes / PDF block */}
                                        {(selectedBlock.type === 'notes' || selectedBlock.type === 'file') && (
                                            <div className="space-y-3">
                                                {selectedBlock.content_json?.url ? (
                                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-2xl">📄</span>
                                                            <div>
                                                                <p className="text-xs font-bold text-slate-900 truncate">{selectedBlock.content_json.originalname}</p>
                                                                <p className="text-[10px] text-slate-500">{fmtSize(selectedBlock.content_json.size || 0)}</p>
                                                            </div>
                                                        </div>
                                                        <a href={selectedBlock.content_json.url} target="_blank" rel="noopener noreferrer"
                                                            className="block w-full text-center py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition">
                                                            👁️ Open PDF
                                                        </a>
                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
                                                        <div className="text-3xl mb-2">📝</div>
                                                        <p className="text-xs text-slate-500 mb-1">No PDF uploaded</p>
                                                        <p className="text-[10px] text-slate-400">PDF, DOC, DOCX files</p>
                                                    </div>
                                                )}
                                                <button onClick={() => pdfInputRef.current?.click()} disabled={uploadingFile}
                                                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition">
                                                    {uploadingFile ? '⏳ Uploading...' : selectedBlock.content_json?.url ? '🔄 Replace PDF' : '📤 Upload PDF'}
                                                </button>
                                            </div>
                                        )}

                                        {/* Scenario / Quick Question block */}
                                        {(selectedBlock.type === 'scenario' || selectedBlock.type === 'quick_question') && (
                                            <div className="text-center py-8 text-slate-400">
                                                <p className="text-3xl mb-2">{selectedBlock.type === 'scenario' ? '🎭' : '⚡'}</p>
                                                <p className="text-xs">{selectedBlock.type === 'scenario' ? 'Scenario' : 'Quick Question'} block added</p>
                                                <p className="text-[10px] mt-1 text-slate-400">Content editing coming soon</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Default: block picker */}
                                {!showQuizPanel && !selectedBlock && (
                                    <div className="p-4 space-y-2">
                                        <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Add Content Block</h3>
                                        {selLesson ? (
                                            BLOCK_TYPES.map(bt => (
                                                <button key={bt.type} onClick={() => addBlock(bt.type)} disabled={addingBlock}
                                                    className="w-full text-left px-3 py-3 bg-slate-50 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl transition">
                                                    <div className="font-bold text-slate-900 text-sm">{bt.label}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{bt.desc}</div>
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-400 text-center py-8">Select a lesson to add blocks</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-between mt-4">
                            <button onClick={() => setStep(0)} className="px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl border border-slate-300 hover:bg-slate-200">← Back</button>
                            <button onClick={() => setStep(2)} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl shadow-sm">Next → Rules & Settings</button>
                        </div>
                    </>
                )}

                {/* ── STEP 2: RULES & SETTINGS ────────────────────────────────── */}
                {step === 2 && (
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-5">
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">⏰ Completion Settings</h2>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Deadline (days after enrollment)</label>
                                    <input type="number" value={settings.deadline_days} onChange={e => setSettings({ ...settings, deadline_days: e.target.value })} placeholder="e.g. 14" className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Reminder (days before deadline)</label>
                                    <input type="number" value={settings.reminder_days} onChange={e => setSettings({ ...settings, reminder_days: Number(e.target.value) })} className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-slate-900 text-sm focus:border-indigo-500 focus:outline-none" />
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                    <span className="text-sm text-slate-700">Supervisor Visibility</span>
                                    <button onClick={() => setSettings({ ...settings, supervisor_visible: !settings.supervisor_visible })}
                                        className={`ml-auto w-12 h-6 rounded-full border transition relative ${settings.supervisor_visible ? 'bg-green-500 border-green-600' : 'bg-slate-200 border-slate-300'}`}>
                                        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${settings.supervisor_visible ? 'left-6' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">🔄 Adaptive Failure Rules</h2>
                                {[
                                    { icon: '1️⃣', rule: 'Score < Pass Mark', action: 'Allow retry + show hints' },
                                    { icon: '2️⃣', rule: '2nd consecutive fail', action: 'Assign intensive module' },
                                    { icon: '3️⃣', rule: '3rd consecutive fail', action: 'Escalate to supervisor' },
                                ].map(r => (
                                    <div key={r.rule} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                        <span className="text-xl">{r.icon}</span>
                                        <div><p className="text-xs font-bold text-slate-700">{r.rule}</p><p className="text-[10px] text-slate-500">→ {r.action}</p></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-5">
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">🔔 Learner Notifications</h2>
                                {['Enrollment confirmation', 'Deadline reminder', 'Completion message', 'Certificate issued', 'Exam result'].map(n => (
                                    <div key={n} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                                        <span className="text-green-500 text-sm">✓</span>
                                        <span className="text-sm text-slate-700">{n}</span>
                                        <span className="ml-auto text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">Email + In-App</span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between">
                                <button onClick={() => setStep(1)} className="px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl border border-slate-300 hover:bg-slate-200">← Back</button>
                                <button onClick={saveSettings} disabled={saving} className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black rounded-xl shadow-sm">
                                    {saving ? '⏳...' : 'Next → Review & Publish'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── STEP 3: REVIEW & PUBLISH ─────────────────────────────────── */}
                {step === 3 && (
                    <div className="grid grid-cols-2 gap-6">

                        {/* LEFT: Validation + Publish */}
                        <div className="space-y-5">

                            {/* Validation Checks */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">✅ Validation Checks</h2>
                                    <button onClick={runValidation} disabled={validating} className="px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition">
                                        {validating ? '⏳ Checking...' : '▶ Run Checks'}
                                    </button>
                                </div>
                                {validationResult ? (
                                    <div className="space-y-2">
                                        {validationResult.checks?.map((c: any) => (
                                            <div key={c.name} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${c.pass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                                <span>{c.pass ? '✅' : '❌'}</span>
                                                <span className={`text-sm font-bold ${c.pass ? 'text-green-700' : 'text-red-600'}`}>{c.name}</span>
                                                <span className="ml-auto text-xs text-slate-500">{c.detail}</span>
                                            </div>
                                        ))}
                                        <div className={`px-4 py-3 rounded-xl border font-bold text-sm text-center mt-2 ${validationResult.ready_to_submit ? 'bg-green-50 border-green-300 text-green-700' : 'bg-amber-50 border-amber-300 text-amber-700'}`}>
                                            {validationResult.ready_to_submit ? '✅ Ready to publish' : `⚠️ ${validationResult.total - validationResult.passed} check(s) failed`}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-sm text-center py-6">Run validation before publishing</p>
                                )}
                            </div>

                            {/* Publish Card */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-5">🚀 Publish Course</h2>

                                {course?.status !== 'published' ? (
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                Publishing makes this course immediately <strong>live</strong> and available for assignment to tenants and individual students from the content library.
                                            </p>
                                        </div>
                                        <button
                                            onClick={publishCourse}
                                            disabled={submitting}
                                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 text-white font-black text-base rounded-xl shadow-lg transition flex items-center justify-center gap-3"
                                        >
                                            {submitting ? '⏳ Publishing...' : '🚀 Publish Course'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="px-4 py-6 bg-green-50 border-2 border-green-300 rounded-xl text-center">
                                            <p className="text-green-700 font-black text-2xl mb-1">🎉 Live!</p>
                                            <p className="text-sm font-bold text-green-600">Course is Published</p>
                                            <p className="text-xs text-slate-500 mt-2">
                                                {course.published_at ? new Date(course.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Recently published'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
                                            <span className="text-xs font-bold text-green-700">Available in Content Library for assignment</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setStep(2)} className="px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl border border-slate-300 hover:bg-slate-200">← Back to Settings</button>
                        </div>

                        {/* RIGHT: Course Summary + Assign List */}
                        <div className="space-y-5">

                            {/* Course Summary */}
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">📋 Course Summary</h2>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Title',       val: course?.title },
                                        { label: 'Audience',    val: course?.audience },
                                        { label: 'Category',    val: course?.category || '—' },
                                        { label: 'Modules',     val: modules.length },
                                        { label: 'Lessons',     val: modules.reduce((s: number, m: any) => s + (m.lessons?.length || 0), 0) },
                                        { label: 'Pass Mark',   val: `${course?.pass_mark}%` },
                                        { label: 'Tags',        val: (course?.compliance_tags || []).join(', ') || '—' },
                                        { label: 'Certificate', val: course?.certificate_enabled ? (course?.certificate_name || 'Yes') : 'No' },
                                        { label: 'Status',      val: course?.status === 'published' ? '✅ Published' : course?.status === 'in_review' ? '⏳ In Review' : '📄 Draft' },
                                    ].map(r => (
                                        <div key={r.label} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                                            <span className="text-slate-500 font-medium">{r.label}</span>
                                            <span className="text-slate-900 font-bold">{r.val}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tenant Assignment List — shown after publishing */}
                            {course?.status === 'published' && (
                                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">🏢 Tenant Assignment</h2>
                                        <button onClick={loadAssignList} disabled={assignData.loading} className="text-xs font-bold text-indigo-500 hover:text-indigo-700 transition">
                                            {assignData.loading ? '⏳' : '↻ Refresh'}
                                        </button>
                                    </div>

                                    {assignData.loading ? (
                                        <div className="text-center py-8 text-slate-400">
                                            <p className="text-2xl animate-pulse mb-2">⏳</p>
                                            <p className="text-sm">Loading tenants...</p>
                                        </div>
                                    ) : assignData.tenants.length === 0 ? (
                                        <div className="text-center py-6 text-slate-400 space-y-2">
                                            <p className="text-3xl">🏢</p>
                                            <p className="text-sm">No tenants found</p>
                                            <Link href="/admin/tenants" className="text-xs text-indigo-500 hover:underline">Manage Tenants →</Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {assignData.tenants.map((t: any) => (
                                                <div key={t.id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                                                    <span className="text-lg flex-shrink-0">🏢</span>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 truncate">
                                                            {t.name || t.company_name || t.tenantName || 'Tenant'}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 truncate">{t.id}</p>
                                                    </div>
                                                    {t.assigned ? (
                                                        <Link href={`/admin/tenants/${t.id}`}
                                                            className="text-[10px] font-black text-green-700 bg-green-100 border border-green-300 px-2.5 py-1 rounded-lg whitespace-nowrap hover:bg-green-200 transition">
                                                            ✅ Assigned
                                                        </Link>
                                                    ) : (
                                                        <Link href={`/admin/tenants/${t.id}`}
                                                            className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-300 px-2.5 py-1 rounded-lg whitespace-nowrap hover:bg-indigo-100 transition">
                                                            + Assign
                                                        </Link>
                                                    )}
                                                </div>
                                            ))}
                                            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                                                <Link href="/admin/tenants" className="block text-center py-2 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 transition">
                                                    Manage Tenants →
                                                </Link>
                                                <Link href="/admin/students" className="block text-center py-2 text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition">
                                                    Assign Students →
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
}
