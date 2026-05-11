'use client';
import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { apiFetch } from '@/utils/api';

/* ─── Types ─────────────────────────────────────────────── */
type ContentBlock = { id: string; type: 'video' | 'notes' | 'quiz' | 'file' | 'scenario' | 'quick_question'; title: string; file?: File | null; url?: string; text?: string; };
type Lesson = { id: string; title: string; blocks: ContentBlock[]; };
type Module = { id: string; title: string; lessons: Lesson[]; expanded: boolean; };

const BLOCK_TYPES = [
    { type: 'video',          label: 'Video',          icon: '🎥', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', desc: 'Upload or link video' },
    { type: 'notes',          label: 'Class Notes',    icon: '📝', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',      desc: 'Upload PDF/Doc notes' },
    { type: 'quiz',           label: 'Quiz',           icon: '📊', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', desc: 'Multiple choice' },
    { type: 'file',           label: 'File / Resource',icon: '📎', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', desc: 'Any file type' },
    { type: 'scenario',       label: 'Scenario',       icon: '🎭', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20',       desc: 'Real-life simulation' },
    { type: 'quick_question', label: 'Quick Question', icon: '⚡', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', desc: 'Single instant question' },
] as const;

const COMPLIANCE_TAGS = ['ISO 27001', 'SOC2', 'PCI DSS', 'GDPR', 'NIST', 'HIPAA', 'ISO 27701'];

let _id = 0;
const uid = () => `tmp-${++_id}`;

/* ─── Component ─────────────────────────────────────────── */
export default function NewCourse() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

    /* ── Step 1 state ── */
    const [form, setForm] = useState({
        title: '', description: '', category: 'Social Engineering', difficulty: 'Beginner',
        duration: '', language: 'English', audience: 'Corporate', community: 'General Public',
        compliance_tags: [] as string[], pass_mark: 80, max_retries: 0,
        certificate_enabled: true, award_xp: true,
    });
    const [thumbnail, setThumbnail] = useState<{ file: File; preview: string } | null>(null);
    const thumbRef = useRef<HTMLInputElement>(null);

    /* ── Step 2 state ── */
    const [modules, setModules] = useState<Module[]>([]);
    const [addingModule, setAddingModule] = useState(false);
    const [newModTitle, setNewModTitle] = useState('');
    const [addingLesson, setAddingLesson] = useState<string | null>(null); // module id
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [blockPicker, setBlockPicker] = useState<string | null>(null); // lesson id
    const [uploadTarget, setUploadTarget] = useState<{ lessonId: string; blockType: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    /* ── helpers ── */
    const setField = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
    const toggleTag = (tag: string) => setField('compliance_tags', form.compliance_tags.includes(tag) ? form.compliance_tags.filter(t => t !== tag) : [...form.compliance_tags, tag]);
    const addModule = () => {
        if (!newModTitle.trim()) return;
        setModules(m => [...m, { id: uid(), title: newModTitle.trim(), lessons: [], expanded: true }]);
        setNewModTitle(''); setAddingModule(false);
    };
    const deleteModule = (mid: string) => setModules(m => m.filter(mod => mod.id !== mid));
    const toggleModule = (mid: string) => setModules(m => m.map(mod => mod.id === mid ? { ...mod, expanded: !mod.expanded } : mod));
    const addLesson = (mid: string) => {
        if (!newLessonTitle.trim()) return;
        setModules(m => m.map(mod => mod.id === mid ? { ...mod, lessons: [...mod.lessons, { id: uid(), title: newLessonTitle.trim(), blocks: [] }] } : mod));
        setNewLessonTitle(''); setAddingLesson(null);
    };
    const deleteLesson = (mid: string, lid: string) => setModules(m => m.map(mod => mod.id === mid ? { ...mod, lessons: mod.lessons.filter(l => l.id !== lid) } : mod));

    const addBlock = (lid: string, type: ContentBlock['type'], file?: File) => {
        const block: ContentBlock = {
            id: uid(), type, title: file ? file.name :
                type === 'video' ? 'New Video' : type === 'notes' ? 'Class Notes' :
                type === 'quiz' ? 'Quiz' : type === 'file' ? 'File' :
                type === 'scenario' ? 'Scenario' : 'Quick Question',
            file: file || null,
            url: '', text: '',
        };
        setModules(m => m.map(mod => ({ ...mod, lessons: mod.lessons.map(l => l.id === lid ? { ...l, blocks: [...l.blocks, block] } : l) })));
        setBlockPicker(null);
        showToast(`✅ ${block.title} added`);
    };

    const deleteBlock = (lid: string, bid: string) => setModules(m => m.map(mod => ({ ...mod, lessons: mod.lessons.map(l => l.id === lid ? { ...l, blocks: l.blocks.filter(b => b.id !== bid) } : l) })));

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadTarget) return;
        addBlock(uploadTarget.lessonId, uploadTarget.blockType as ContentBlock['type'], file);
        setUploadTarget(null);
        e.target.value = '';
    };

    /* ── Validation ── */
    const validate = (): string | null => {
        if (!form.title.trim()) return 'Course title is required';
        if (!form.description.trim()) return 'Description is required';
        if (modules.length === 0) return 'Add at least one module in Step 2';
        if (modules.some(m => m.lessons.length === 0)) return 'Each module must have at least one lesson';
        return null;
    };

    /* ── Save Draft ── */
    const saveDraft = async () => {
        if (!form.title.trim()) { showToast('Enter a course title first', 'error'); return; }
        setSaving(true);
        try {
            const r = await apiFetch('/content/studio/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, status: 'draft' }) }).then(r => r.json());
            if (r.success) { setCreatedCourseId(r.data.id); showToast('✅ Draft saved!'); }
            else showToast(r.message || 'Failed to save draft', 'error');
        } catch { showToast('Save failed — check backend connection', 'error'); }
        finally { setSaving(false); }
    };

    /* ── Submit for Review ── */
    const submitCourse = async () => {
        const err = validate();
        if (err) { showToast(err, 'error'); return; }
        setSaving(true);
        try {
            // 1. Create course
            const r = await apiFetch('/content/studio/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, status: 'draft' }) }).then(r => r.json());
            if (!r.success) throw new Error(r.message);
            const courseId = r.data.id;
            // 2. Add modules
            for (const mod of modules) {
                const mr = await apiFetch('/content/studio/modules/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ course_id: courseId, title: mod.title }) }).then(r => r.json());
                if (!mr.success) continue;
                const modId = mr.data.id;
                // 3. Add lessons
                for (const les of mod.lessons) {
                    const lr = await apiFetch('/content/studio/lessons/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ module_id: modId, title: les.title }) }).then(r => r.json());
                    if (!lr.success) continue;
                    // 4. Add blocks (non-file)
                    for (const blk of les.blocks.filter(b => !b.file)) {
                        await apiFetch('/content/studio/blocks/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lesson_id: lr.data.id, type: blk.type, title: blk.title, content_json: { text: blk.text || '' } }) }).then(r => r.json());
                    }
                }
            }
            // 5. Submit for review
            await apiFetch(`/content/studio/submit-review/${courseId}`, { method: 'POST' });
            setCreatedCourseId(courseId);
            setShowSuccess(true);
        } catch (e: any) { showToast(e.message || 'Submission failed', 'error'); }
        finally { setSaving(false); }
    };

    const nextStep = () => {
        if (step === 1 && !form.title.trim()) { showToast('Course title is required', 'error'); return; }
        if (step < 4) setStep(step + 1);
        else submitCourse();
    };

    const totalBlocks = modules.flatMap(m => m.lessons).flatMap(l => l.blocks).length;
    const totalLessons = modules.flatMap(m => m.lessons).length;

    return (
        <SuperAdminLayout
            title="New Course Studio"
            subtitle="Create, configure, and publish new cybersecurity awareness training."
        >
            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload}
                accept={uploadTarget?.blockType === 'video' ? 'video/*' : uploadTarget?.blockType === 'notes' ? '.pdf,.doc,.docx,.ppt,.pptx' : '*'} />

            <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full pb-24">

                {/* TOAST */}
                {toast && (
                    <div className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold text-sm max-w-sm flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                        {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
                    </div>
                )}

                {/* SUCCESS MODAL */}
                {showSuccess && (
                    <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center">
                            <div className="w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 text-green-400">✓</div>
                            <h3 className="font-bold text-slate-900 text-xl mb-2">Course Submitted!</h3>
                            <p className="text-sm text-slate-600 mb-6">Your course has been added to the review queue. You'll be notified when approved.</p>
                            <div className="flex flex-col gap-3">
                                {createdCourseId && (
                                    <button onClick={() => router.push(`/admin/studio/builder/${createdCourseId}`)} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition">
                                        ✏️ Open in Course Builder
                                    </button>
                                )}
                                <button onClick={() => router.push('/admin/studio')} className="w-full py-2.5 bg-slate-100 hover:bg-slate-100 border border-slate-300 text-slate-900 text-sm font-bold rounded-lg transition">
                                    📚 View All Courses
                                </button>
                                <button onClick={() => router.push('/admin')} className="w-full py-2.5 text-slate-600 hover:text-slate-900 text-sm font-semibold transition">
                                    Return to Overview
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── STEPPER ──────────────────────────────────────────── */}
                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-6 shadow-xl mb-2">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full" />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }} />
                        {[
                            { num: 1, label: 'Course Setup' },
                            { num: 2, label: 'Build Modules' },
                            { num: 3, label: 'Rules & Settings' },
                            { num: 4, label: 'Review & Submit' },
                        ].map(s => (
                            <div key={s.num} className="relative z-10 flex flex-col items-center gap-2">
                                <button
                                    onClick={() => step > s.num && setStep(s.num)}
                                    disabled={step < s.num}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all border-4 border-neutral-900 ${step === s.num ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-110' : step > s.num ? 'bg-indigo-500/20 text-indigo-400 cursor-pointer hover:bg-indigo-500/30' : 'bg-slate-50 text-neutral-600 cursor-not-allowed'}`}
                                >{step > s.num ? '✓' : s.num}</button>
                                <span className={`text-xs font-bold absolute -bottom-6 w-32 text-center ${step === s.num ? 'text-indigo-400' : step > s.num ? 'text-slate-900' : 'text-slate-500'}`}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── STEP 1: COURSE SETUP ─────────────────────────────── */}
                {step === 1 && (
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-white shadow-sm/50">
                            <h3 className="font-bold text-slate-900 text-lg">Basic Information</h3>
                            <p className="text-sm text-slate-600">Define the core identity and target audience of this course.</p>
                        </div>
                        <div className="p-6 space-y-8">

                            {/* General Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="text-sm font-semibold text-slate-600 block mb-2">Course Title <span className="text-red-400">*</span></label>
                                    <input value={form.title} onChange={e => setField('title', e.target.value)}
                                        placeholder="e.g., Identifying Modern Phishing Scams"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg text-sm text-slate-900 focus:outline-none transition" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="text-sm font-semibold text-slate-600 block mb-2">Short Description <span className="text-red-400">*</span></label>
                                    <textarea value={form.description} onChange={e => setField('description', e.target.value)}
                                        placeholder="Brief overview of what learners will achieve..."
                                        className="w-full h-24 px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg text-sm text-slate-900 focus:outline-none resize-none transition" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-600 block mb-2">Category</label>
                                    <select value={form.category} onChange={e => setField('category', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500">
                                        {['Social Engineering', 'Data Privacy', 'Physical Security', 'Device Management', 'Phishing', 'Incident Response', 'Password Security'].map(o => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-600 block mb-2">Difficulty Level</label>
                                    <select value={form.difficulty} onChange={e => setField('difficulty', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500">
                                        {['Beginner', 'Intermediate', 'Advanced'].map(o => <option key={o}>{o}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-600 block mb-2">Estimated Duration (mins)</label>
                                    <input type="number" value={form.duration} onChange={e => setField('duration', e.target.value)}
                                        placeholder="30"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-600 block mb-2">Primary Language</label>
                                    <select value={form.language} onChange={e => setField('language', e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500">
                                        {['English', 'Spanish', 'Hindi', 'French', 'Arabic', 'Portuguese'].map(o => <option key={o}>{o}</option>)}
                                    </select>
                                </div>

                                {/* Thumbnail */}
                                <div className="md:col-span-2">
                                    <label className="text-sm font-semibold text-slate-600 block mb-2">Course Thumbnail</label>
                                    <input ref={thumbRef} type="file" accept="image/*" className="hidden" onChange={e => {
                                        const f = e.target.files?.[0];
                                        if (f) setThumbnail({ file: f, preview: URL.createObjectURL(f) });
                                    }} />
                                    <div onClick={() => thumbRef.current?.click()}
                                        className="w-full h-36 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl bg-slate-50 flex items-center justify-center cursor-pointer transition-colors overflow-hidden">
                                        {thumbnail ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={thumbnail.preview} alt="thumbnail" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex flex-col items-center text-slate-500 gap-2">
                                                <span className="text-3xl">🖼️</span>
                                                <span className="text-sm font-medium">Click to upload thumbnail</span>
                                                <span className="text-xs">1280×720px recommended · JPG, PNG, WebP</span>
                                            </div>
                                        )}
                                    </div>
                                    {thumbnail && <button onClick={() => setThumbnail(null)} className="text-xs text-red-400 mt-2 hover:text-red-300">✕ Remove thumbnail</button>}
                                </div>
                            </div>

                            <hr className="border-slate-200" />

                            {/* Audience */}
                            <div>
                                <h4 className="font-bold text-slate-900 mb-4">Audience Targeting</h4>
                                <div className="flex gap-4 mb-6">
                                    {[{ val: 'Corporate', icon: '🏢', label: 'Corporate Teams', accent: 'indigo' }, { val: 'NGO', icon: '🌍', label: 'NGO & Community', accent: 'cyan' }].map(a => (
                                        <label key={a.val} onClick={() => setField('audience', a.val)}
                                            className={`flex-1 flex items-center justify-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${form.audience === a.val ? `bg-${a.accent}-500/10 border-${a.accent}-500 text-${a.accent}-400` : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-neutral-600'}`}>
                                            <span className="text-2xl">{a.icon}</span>
                                            <span className="font-bold text-sm">{a.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {form.audience === 'Corporate' && (
                                    <div>
                                        <label className="text-sm font-semibold text-slate-600 block mb-3">Compliance / Certification Tags</label>
                                        <div className="flex flex-wrap gap-2">
                                            {COMPLIANCE_TAGS.map(tag => (
                                                <button key={tag} onClick={() => toggleTag(tag)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${form.compliance_tags.includes(tag) ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-white shadow-sm border-slate-300 text-slate-600 hover:border-neutral-500'}`}>
                                                    {form.compliance_tags.includes(tag) ? '✓ ' : ''}{tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {form.audience === 'NGO' && (
                                    <div className="p-4 bg-cyan-950/30 border border-cyan-900 rounded-xl text-sm text-cyan-200">
                                        <strong>Note:</strong> NGO/Community courses are open-access and designed for broad reach — no compliance framework mapping required.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── STEP 2: BUILD MODULES ────────────────────────────── */}
                {step === 2 && (
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-white shadow-sm/50 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Curriculum Builder</h3>
                                <p className="text-sm text-slate-600">{modules.length} modules · {totalLessons} lessons · {totalBlocks} content blocks</p>
                            </div>
                            <button onClick={() => setAddingModule(true)} className="px-4 py-2 bg-indigo-600/20 text-indigo-400 font-bold rounded-lg border border-indigo-500/30 hover:bg-indigo-500/30 transition text-sm">
                                + Add Module
                            </button>
                        </div>
                        <div className="p-6 space-y-4">

                            {/* Add module input */}
                            {addingModule && (
                                <div className="bg-indigo-500/5 border border-indigo-500/30 rounded-xl p-4 flex gap-3">
                                    <input autoFocus value={newModTitle} onChange={e => setNewModTitle(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addModule()}
                                        placeholder="Module title e.g., Introduction to Phishing"
                                        className="flex-1 px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500" />
                                    <button onClick={addModule} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg transition">Add</button>
                                    <button onClick={() => { setAddingModule(false); setNewModTitle(''); }} className="px-4 py-2 bg-slate-100 text-slate-600 hover:text-slate-900 text-sm font-bold rounded-lg transition">Cancel</button>
                                </div>
                            )}

                            {modules.length === 0 && !addingModule && (
                                <div className="text-center py-14 text-neutral-600 border-2 border-dashed border-slate-200 rounded-xl">
                                    <div className="text-5xl mb-3">🧩</div>
                                    <p className="text-sm font-medium mb-3">No modules yet. Click "+ Add Module" to start building your curriculum.</p>
                                </div>
                            )}

                            {modules.map((mod) => (
                                <div key={mod.id} className="border border-slate-200 rounded-xl bg-slate-50">
                                    {/* Module Header */}
                                    <div className="flex justify-between items-center p-4 border-b border-slate-200">
                                        <button onClick={() => toggleModule(mod.id)} className="flex items-center gap-3 text-left flex-1">
                                            <span className="text-slate-500 text-lg">{mod.expanded ? '▼' : '▶'}</span>
                                            <span className="font-bold text-slate-900">{mod.title}</span>
                                            <span className="text-xs text-slate-500">{mod.lessons.length} lessons</span>
                                        </button>
                                        <div className="flex gap-2">
                                            <button onClick={() => setAddingLesson(mod.id)} className="text-xs px-3 py-1.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 rounded-lg transition font-bold">+ Lesson</button>
                                            <button onClick={() => deleteModule(mod.id)} className="text-xs px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 rounded-lg transition font-bold">Delete</button>
                                        </div>
                                    </div>

                                    {/* Module Body */}
                                    {mod.expanded && (
                                        <div className="p-4 space-y-3">
                                            {/* Add Lesson input */}
                                            {addingLesson === mod.id && (
                                                <div className="flex gap-3 bg-white shadow-sm border border-slate-300 rounded-xl p-3">
                                                    <input autoFocus value={newLessonTitle} onChange={e => setNewLessonTitle(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && addLesson(mod.id)}
                                                        placeholder="Lesson title e.g., What is Phishing?"
                                                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-cyan-500" />
                                                    <button onClick={() => addLesson(mod.id)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-900 text-xs font-bold rounded-lg transition">Add</button>
                                                    <button onClick={() => { setAddingLesson(null); setNewLessonTitle(''); }} className="px-3 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg transition">Cancel</button>
                                                </div>
                                            )}
                                            {mod.lessons.length === 0 && addingLesson !== mod.id && (
                                                <div className="text-center py-6 text-neutral-600 text-sm border border-dashed border-slate-200 rounded-xl">
                                                    No lessons yet — click "+ Lesson" to add one
                                                </div>
                                            )}
                                            {mod.lessons.map((les) => (
                                                <div key={les.id} className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
                                                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                                                        <span className="text-sm font-bold text-slate-900 flex items-center gap-2">📖 {les.title}</span>
                                                        <div className="flex gap-2">
                                                            <button onClick={() => setBlockPicker(blockPicker === les.id ? null : les.id)} className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-100 text-slate-700 rounded-lg transition border border-slate-300 font-bold">+ Content Block</button>
                                                            <button onClick={() => deleteLesson(mod.id, les.id)} className="text-xs px-2 py-1 text-red-400 hover:text-red-300 transition">✕</button>
                                                        </div>
                                                    </div>

                                                    {/* Block Picker */}
                                                    {blockPicker === les.id && (
                                                        <div className="p-3 bg-slate-50 border-b border-slate-200">
                                                            <p className="text-xs text-slate-500 font-bold uppercase mb-3">Choose Content Type</p>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {BLOCK_TYPES.map(bt => (
                                                                    <button key={bt.type} onClick={() => {
                                                                        // Block is always added immediately so it's visible in the curriculum
                                                        addBlock(les.id, bt.type);
                                                        // For file-based types, optionally open file picker to attach a file
                                                        if (bt.type === 'video' || bt.type === 'notes' || bt.type === 'file') {
                                                            setUploadTarget({ lessonId: les.id, blockType: bt.type });
                                                            setTimeout(() => fileInputRef.current?.click(), 100);
                                                        }
                                                                    }} className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${bt.color} hover:opacity-80 transition text-left`}>
                                                                        <span className="text-xl">{bt.icon}</span>
                                                                        <span className="text-xs font-bold">{bt.label}</span>
                                                                        <span className="text-[9px] text-slate-500">{bt.desc}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Existing Blocks */}
                                                    {les.blocks.length > 0 && (
                                                        <div className="px-4 py-3 space-y-2">
                                                            {les.blocks.map(blk => {
                                                                const bt = BLOCK_TYPES.find(b => b.type === blk.type);
                                                                return (
                                                                    <div key={blk.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${bt?.color}`}>
                                                                        <span>{bt?.icon}</span>
                                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${bt?.color}`}>{bt?.label}</span>
                                                                        <span className="text-xs text-slate-700 flex-1 truncate">{blk.title}</span>
                                                                        {blk.file && <span className="text-[9px] text-slate-500">{(blk.file.size / 1024 / 1024).toFixed(1)} MB</span>}
                                                                        <button onClick={() => deleteBlock(les.id, blk.id)} className="text-red-400 hover:text-red-300 text-xs transition">✕</button>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── STEP 3: RULES & SETTINGS ─────────────────────────── */}
                {step === 3 && (
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-white shadow-sm/50">
                            <h3 className="font-bold text-slate-900 text-lg">Course Settings</h3>
                            <p className="text-sm text-slate-600">Configure passing thresholds, certificates, and enrollment rules.</p>
                        </div>
                        <div className="p-6 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm font-semibold text-slate-600 block mb-2">Passing Score (%)</label>
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="50" max="100" value={form.pass_mark} onChange={e => setField('pass_mark', parseInt(e.target.value))} className="flex-1 accent-indigo-500" />
                                        <span className="text-slate-900 font-black text-xl w-14 text-center">{form.pass_mark}%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-600 block mb-2">Maximum Retries</label>
                                    <select value={form.max_retries} onChange={e => setField('max_retries', parseInt(e.target.value))}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-500">
                                        <option value={0}>Unlimited</option>
                                        <option value={1}>1 Retry</option>
                                        <option value={2}>2 Retries</option>
                                        <option value={3}>3 Retries</option>
                                    </select>
                                </div>
                            </div>

                            <hr className="border-slate-200" />

                            <div>
                                <h4 className="font-bold text-slate-900 mb-4">Completion Actions</h4>
                                <div className="space-y-3">
                                    {[
                                        { key: 'certificate_enabled', label: 'Issue PDF Certificate', desc: 'Automatically generate and email a completion certificate.' },
                                        { key: 'award_xp', label: 'Award XP Points', desc: 'Grant users gamification points upon successful completion.' },
                                    ].map(opt => (
                                        <label key={opt.key} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-neutral-600 transition">
                                            <div onClick={() => setField(opt.key, !(form as any)[opt.key])}
                                                className={`w-12 h-6 rounded-full border-2 transition-all flex-shrink-0 flex items-center px-1 cursor-pointer ${(form as any)[opt.key] ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-100 border-slate-300'}`}>
                                                <div className={`w-4 h-4 rounded-full bg-white transition-all ${(form as any)[opt.key] ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{opt.label}</p>
                                                <p className="text-xs text-slate-500">{opt.desc}</p>
                                            </div>
                                        </label>
                                    ))}
                                    <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl opacity-50 cursor-not-allowed">
                                        <div className="w-12 h-6 rounded-full border-2 bg-slate-100 border-slate-300 flex items-center px-1"><div className="w-4 h-4 rounded-full bg-white" /></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Trigger Follow-up Phishing Sim <span className="text-yellow-400 text-xs font-bold ml-2">COMING SOON</span></p>
                                            <p className="text-xs text-slate-500">Auto schedule a related phishing test 30 days after completion.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── STEP 4: REVIEW & SUBMIT ──────────────────────────── */}
                {step === 4 && (
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-slate-200 bg-white shadow-sm/50">
                            <h3 className="font-bold text-slate-900 text-lg">Final Review</h3>
                            <p className="text-sm text-slate-600">Review all details before submitting for approval.</p>
                        </div>
                        <div className="p-6 bg-slate-50 space-y-6">
                            {/* Course Summary */}
                            <div className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm">
                                <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">{form.audience} Level Course</p>
                                <h4 className="text-xl font-bold text-slate-900 mb-4">{form.title || '(Untitled Course)'}</h4>
                                <p className="text-sm text-slate-600 mb-4">{form.description}</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
                                    <div><p className="text-xs text-slate-500 mb-1">Category</p><p className="text-sm font-bold text-slate-900">{form.category}</p></div>
                                    <div><p className="text-xs text-slate-500 mb-1">Difficulty</p><p className="text-sm font-bold text-slate-900">{form.difficulty}</p></div>
                                    <div><p className="text-xs text-slate-500 mb-1">Pass Mark</p><p className="text-sm font-bold text-slate-900">{form.pass_mark}%</p></div>
                                    <div><p className="text-xs text-slate-500 mb-1">Language</p><p className="text-sm font-bold text-slate-900">{form.language}</p></div>
                                </div>
                            </div>

                            {/* Modules Summary */}
                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="p-4 bg-white shadow-sm border-b border-slate-200">
                                    <p className="font-bold text-slate-900 text-sm">Curriculum — {modules.length} Modules · {totalLessons} Lessons · {totalBlocks} Content Blocks</p>
                                </div>
                                {modules.length === 0 ? (
                                    <div className="p-6 text-center text-neutral-600 text-sm">⚠️ No modules added — go back to Step 2</div>
                                ) : (
                                    <div className="divide-y divide-neutral-800">
                                        {modules.map((m, i) => (
                                            <div key={m.id} className="p-4 hover:bg-white shadow-sm/50 transition">
                                                <p className="text-sm font-bold text-slate-900 mb-1">Module {i + 1}: {m.title}</p>
                                                <div className="flex flex-wrap gap-2 pl-3">
                                                    {m.lessons.map(l => (
                                                        <span key={l.id} className="text-xs bg-slate-100 border border-slate-300 text-slate-700 px-2 py-0.5 rounded">
                                                            {l.title} ({l.blocks.length} blocks)
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Compliance tags */}
                            {form.compliance_tags.length > 0 && (
                                <div><p className="text-xs text-slate-500 mb-2 font-bold uppercase">Compliance Tags</p>
                                    <div className="flex flex-wrap gap-2">{form.compliance_tags.map(t => <span key={t} className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 px-3 py-1 rounded font-bold">{t}</span>)}</div>
                                </div>
                            )}

                            {/* Validation */}
                            {(() => {
                                const err = validate();
                                return err ? (
                                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex gap-3">
                                        <span className="text-xl">❌</span>
                                        <div>
                                            <p className="font-bold text-red-400 text-sm">Cannot Submit — Fix First:</p>
                                            <p className="text-sm text-slate-600 mt-1">{err}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex gap-3">
                                        <span className="text-xl">✅</span>
                                        <p className="font-bold text-green-400 text-sm self-center">All checks passed — ready to submit!</p>
                                    </div>
                                );
                            })()}

                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-4">
                                <span className="text-2xl">⚠️</span>
                                <div>
                                    <h5 className="font-bold text-yellow-400">Review Required</h5>
                                    <p className="text-sm text-slate-600 mt-1">Once submitted, this course enters the Review Queue. A designated reviewer or admin must approve it before it is published.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── NAVIGATION BUTTONS ───────────────────────────────── */}
                <div className="flex justify-between items-center mt-2">
                    <button onClick={() => setStep(s => Math.max(1, s - 1))}
                        className={`px-6 py-3 font-semibold rounded-xl transition border text-sm ${step === 1 ? 'opacity-0 pointer-events-none' : 'bg-white shadow-sm border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}>
                        ← Back
                    </button>
                    <div className="flex gap-3">
                        <button onClick={() => router.push('/admin')} className="px-5 py-3 bg-white shadow-sm border border-slate-200 text-slate-600 hover:text-slate-900 font-semibold rounded-xl transition text-sm">
                            Cancel
                        </button>
                        <button onClick={saveDraft} disabled={saving} className="px-5 py-3 bg-white shadow-sm border border-slate-300 text-slate-700 hover:text-slate-900 font-semibold rounded-xl transition text-sm disabled:opacity-50">
                            {saving ? '⏳ Saving…' : '💾 Save Draft'}
                        </button>
                        <button onClick={nextStep} disabled={saving}
                            className={`px-8 py-3 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] transition text-sm disabled:opacity-50 ${form.audience === 'NGO' ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
                            {saving ? '⏳ Processing…' : step === 4 ? '🚀 Submit for Review' : 'Next Step →'}
                        </button>
                    </div>
                </div>
            </div>
        </SuperAdminLayout>
    );
}
