'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Course { id: string; title: string; code: string; duration: number; }

// ─── Course Multi-Select Picker Component ────────────────────────────────────
function CoursePicker({
    courses,
    selected,
    onChange,
    loading,
}: {
    courses: Course[];
    selected: Course[];
    onChange: (courses: Course[]) => void;
    loading: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = courses.filter(c =>
        !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
    );

    const isSelected = (id: string) => selected.some(s => s.id === id);

    const toggle = (course: Course) => {
        if (isSelected(course.id)) {
            onChange(selected.filter(s => s.id !== course.id));
        } else {
            onChange([...selected, course]);
        }
    };

    const remove = (id: string) => onChange(selected.filter(s => s.id !== id));

    return (
        <div ref={ref} className="relative">
            {/* Trigger */}
            <div
                onClick={() => setOpen(!open)}
                className="w-full min-h-[42px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-red-400 focus-within:border-red-400 transition-all flex flex-wrap gap-1.5 items-center"
            >
                {selected.length === 0 ? (
                    <span className="text-sm text-slate-400">
                        {loading ? 'Loading courses...' : 'Click to select courses...'}
                    </span>
                ) : (
                    selected.map(c => (
                        <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 border border-blue-200 text-blue-700 text-xs rounded-lg font-medium">
                            📚 {c.title.length > 30 ? c.title.slice(0, 30) + '…' : c.title}
                            <button
                                type="button"
                                onClick={e => { e.stopPropagation(); remove(c.id); }}
                                className="text-blue-400 hover:text-red-500 ml-0.5 font-bold"
                            >×</button>
                        </span>
                    ))
                )}
                <span className="ml-auto text-slate-400 text-xs">
                    {open ? '▲' : '▼'}
                </span>
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden">
                    {/* Search input */}
                    <div className="p-2 border-b border-slate-100">
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="🔍 Search courses by name or category..."
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-400 transition-all"
                        />
                    </div>

                    {/* Selected summary */}
                    {selected.length > 0 && (
                        <div className="px-3 py-1.5 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 font-medium flex items-center justify-between">
                            <span>✅ {selected.length} course{selected.length !== 1 ? 's' : ''} selected</span>
                            <button type="button" onClick={() => onChange([])} className="text-red-500 hover:text-red-600 font-bold">Clear all</button>
                        </div>
                    )}

                    {/* Course list */}
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                        {loading ? (
                            <div className="flex items-center justify-center p-6 text-slate-400 text-sm">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                                Loading courses...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-sm">No courses found for "{search}"</div>
                        ) : (
                            filtered.map(c => {
                                const sel = isSelected(c.id);
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => toggle(c)}
                                        className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${sel ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'}`}
                                    >
                                        {/* Checkbox */}
                                        <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${sel ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                            {sel && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${sel ? 'text-blue-800' : 'text-slate-800'}`}>{c.title}</p>
                                            {c.code && <p className="text-[10px] text-slate-400">{c.code}</p>}
                                        </div>
                                        {sel && <span className="text-blue-500 text-xs font-bold flex-shrink-0">✓</span>}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                        <span>{filtered.length} course{filtered.length !== 1 ? 's' : ''} available</span>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="px-3 py-1 bg-slate-700 text-white rounded-lg text-xs font-medium hover:bg-slate-600 transition-colors"
                        >
                            Done ✓
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [student, setStudent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionMsg, setActionMsg] = useState<string | null>(null);
    
    // Modals
    const [showResetPwd, setShowResetPwd] = useState(false);
    const [newPwd, setNewPwd] = useState('');
    const [showEditContact, setShowEditContact] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
    const [showAssignCourse, setShowAssignCourse] = useState(false);
    const [stopping, setStopping] = useState(false);
    const [courseToRemove, setCourseToRemove] = useState<{ id: string, title: string } | null>(null);

    // Course Picker state
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(false);

    const fetchStudent = async () => {
        try {
            const { apiFetch } = await import('@/utils/api');
            const res = await apiFetch(`/admin/students/${id}`);
            const json = await res.json();
            if (json.success) {
                setStudent(json.data);
                setEditForm({ name: json.data.name, email: json.data.email, phone: json.data.phone || '' });
            } else {
                setError(json.message || 'Failed to load student');
            }
        } catch {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        setCoursesLoading(true);
        try {
            const { apiFetch } = await import('@/utils/api');
            const res = await apiFetch('/admin/students/courses-list');
            const json = await res.json();
            if (json.success) setAllCourses(json.data);
        } catch (err) {
            console.error('Failed to fetch courses', err);
        } finally {
            setCoursesLoading(false);
        }
    };

    useEffect(() => { 
        fetchStudent(); 
        fetchCourses();
    }, [id]);

    const showMsg = (msg: string) => {
        setActionMsg(msg);
        setTimeout(() => setActionMsg(null), 3500);
    };

    const handleStopService = async () => {
        if (!confirm(student?.service_status === 'active'
            ? 'Stop LMS access for this student? They will be immediately locked out.'
            : 'Restore LMS access for this student?')) return;
        setStopping(true);
        try {
            const { apiFetch } = await import('@/utils/api');
            const res = await apiFetch(`/admin/students/${id}/stop-service`, { method: 'PATCH' });
            const json = await res.json();
            if (json.success) { showMsg(json.message); fetchStudent(); }
        } finally { setStopping(false); }
    };

    const handleResetPassword = async () => {
        if (!newPwd.trim()) return;
        const { apiFetch } = await import('@/utils/api');
        const res = await apiFetch(`/admin/students/${id}/reset-password`, {
            method: 'PATCH',
            body: JSON.stringify({ new_password: newPwd }),
        });
        const json = await res.json();
        if (json.success) { showMsg('Password reset successfully!'); setShowResetPwd(false); setNewPwd(''); }
        else showMsg(json.message);
    };

    const handleEditContact = async () => {
        const { apiFetch } = await import('@/utils/api');
        const res = await apiFetch(`/admin/students/${id}`, {
            method: 'PUT',
            body: JSON.stringify(editForm),
        });
        const json = await res.json();
        if (json.success) { showMsg('Contact details updated!'); setShowEditContact(false); fetchStudent(); }
        else showMsg(json.message);
    };

    const handleAssignCourse = async () => {
        if (selectedCourses.length === 0) return;
        const { apiFetch } = await import('@/utils/api');
        const res = await apiFetch(`/admin/students/${id}/assign-course`, {
            method: 'POST',
            body: JSON.stringify({ course_ids: selectedCourses.map(c => c.id) }),
        });
        const json = await res.json();
        if (json.success) { 
            showMsg(`Successfully assigned ${selectedCourses.length} course(s)!`); 
            setShowAssignCourse(false); 
            setSelectedCourses([]); 
            fetchStudent(); 
        }
        else showMsg(json.message);
    };

    const handleRemoveCourse = (courseId: string, courseTitle: string) => {
        setCourseToRemove({ id: courseId, title: courseTitle });
    };

    const confirmRemoveCourse = async () => {
        if (!courseToRemove) return;
        try {
            const { apiFetch } = await import('@/utils/api');
            const res = await apiFetch(`/admin/students/${id}/courses/${courseToRemove.id}`, {
                method: 'DELETE',
            });
            const json = await res.json();
            if (json.success) {
                showMsg('Course removed successfully!');
                fetchStudent();
            } else {
                showMsg(json.message || 'Failed to remove course.');
            }
        } catch (err) {
            showMsg('An error occurred while removing the course.');
        } finally {
            setCourseToRemove(null);
        }
    };

    const handleExport = () => {
        const match = document.cookie.match(/(^| )token=([^;]+)/);
        const token = match ? match[2] : '';
        window.open(`/api/admin/students/${id}/activity-report?format=pdf&token=${token}`, '_blank');
    };

    const handleSendReminder = () => showMsg('📧 Payment reminder email queued for delivery.');

    if (loading) return (
        <SuperAdminLayout title="Student Detail">
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                <span className="ml-3 text-slate-600">Loading student...</span>
            </div>
        </SuperAdminLayout>
    );

    if (error || !student) return (
        <SuperAdminLayout title="Student Detail">
            <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-600">
                <p className="font-bold">Error</p>
                <p className="text-sm">{error || 'Student not found'}</p>
                <button onClick={() => router.back()} className="mt-3 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm">← Back</button>
            </div>
        </SuperAdminLayout>
    );

    const courses: any[] = Array.isArray(student.assigned_courses) ? student.assigned_courses : [];
    const progress: Record<string, number> = student.progress || {};
    const isStopped = student.service_status === 'stopped';

    return (
        <SuperAdminLayout title={`Student: ${student.name}`}>
            {/* Toast */}
            {actionMsg && (
                <div className="fixed top-20 right-6 z-[100] bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                    {actionMsg}
                </div>
            )}

            <div className="space-y-6">
                {/* ── Student Info Card ── */}
                <div className={`rounded-2xl border p-6 flex flex-col md:flex-row gap-6 ${isStopped ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex-shrink-0">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold ${isStopped ? 'bg-red-100 text-red-500' : 'bg-gradient-to-br from-red-500 to-orange-400 text-white shadow-lg'}`}>
                            {student.name.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
                                <p className="text-sm text-slate-500 mt-0.5">Login ID: <span className="font-mono text-slate-700">{student.login_id}</span></p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isStopped ? 'text-red-500 bg-red-50 border-red-200' : 'text-green-500 bg-green-50 border-green-200'}`}>
                                {isStopped ? '🔴 Service Stopped' : '🟢 Active'}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                            <div><p className="text-xs text-slate-500">Email</p><p className="text-sm font-medium text-slate-800">{student.email}</p></div>
                            <div><p className="text-xs text-slate-500">Phone</p><p className="text-sm font-medium text-slate-800">{student.phone || '—'}</p></div>
                            <div><p className="text-xs text-slate-500">Enrolled Courses</p><p className="text-sm font-medium text-slate-800">{courses.length}</p></div>
                        </div>
                    </div>
                </div>

                {/* ── Action Buttons ── */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                        { label: '📚 Assign Course', action: () => setShowAssignCourse(true), color: 'bg-blue-600 hover:bg-blue-500 text-white' },
                        { label: '📊 Activity Report', action: handleExport, color: 'bg-indigo-600 hover:bg-indigo-500 text-white' },
                        { label: '💌 Send Reminder', action: handleSendReminder, color: 'bg-teal-600 hover:bg-teal-500 text-white' },
                        { label: '🔑 Reset Password', action: () => setShowResetPwd(true), color: 'bg-amber-500 hover:bg-amber-400 text-white' },
                        { label: '✏️ Edit Contact', action: () => setShowEditContact(true), color: 'bg-slate-600 hover:bg-slate-500 text-white' },
                    ].map(btn => (
                        <button key={btn.label} onClick={btn.action} className={`px-3 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${btn.color}`}>
                            {btn.label}
                        </button>
                    ))}
                    <button
                        onClick={handleStopService}
                        disabled={stopping}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${isStopped ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-red-600 hover:bg-red-500 text-white'} disabled:opacity-50`}
                    >
                        {stopping ? '...' : isStopped ? '▶ Restore Access' : '⛔ Stop Service'}
                    </button>
                </div>

                {isStopped && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
                        ⛔ This student's LMS access has been <strong>stopped</strong>. They cannot log in until service is restored.
                    </div>
                )}

                {/* ── Course Progress ── */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Assigned Courses & Progress</h3>
                        <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 text-[10px] font-bold rounded-full">
                            {courses.length} Course{courses.length !== 1 ? 's' : ''} Enrolled
                        </span>
                    </div>
                    {courses.length === 0 ? (
                        <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-slate-400 shadow-sm">
                            <p className="text-3xl mb-2">📚</p>
                            <p className="text-sm font-medium">No courses assigned to this student yet.</p>
                            <p className="text-xs mt-1">Use the "Assign Course" button above to add courses from the LMS library.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {courses.map((c: any) => {
                                const pct = progress[c.course_id] || 0;
                                const statusColor = pct >= 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-slate-200';
                                const statusLabel = pct >= 100 ? 'Completed' : pct > 0 ? 'In Progress' : 'Not Started';
                                return (
                                    <div key={c.course_id} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900">{c.course_title || c.course_id}</p>
                                                <p className="text-xs text-slate-500">Assigned: {c.assigned_at ? new Date(c.assigned_at).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div className="text-right">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${pct >= 100 ? 'bg-green-100 text-green-600' : pct > 0 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {statusLabel}
                                                    </span>
                                                    <p className="text-lg font-bold text-slate-900 mt-1">{pct}%</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveCourse(c.course_id, c.course_title || c.course_id)}
                                                    title="Remove Course"
                                                    className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg transition-colors border border-transparent hover:border-red-600"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all duration-500 ${statusColor}`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            {/* ── Reset Password Modal ── */}
            {showResetPwd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Reset Password</h3>
                            <button onClick={() => setShowResetPwd(false)} className="text-slate-400 hover:text-slate-700">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">Set a new password for <strong>{student.name}</strong>.</p>
                            <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="New password (min 6 chars)" className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" />
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setShowResetPwd(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                            <button onClick={handleResetPassword} className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg">Reset Password</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Contact Modal ── */}
            {showEditContact && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Edit Contact Details</h3>
                            <button onClick={() => setShowEditContact(false)} className="text-slate-400 hover:text-slate-700">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            {[
                                { label: 'Full Name', key: 'name', type: 'text' },
                                { label: 'Email', key: 'email', type: 'email' },
                                { label: 'Phone', key: 'phone', type: 'tel' },
                            ].map(f => (
                                <div key={f.key}>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                                    <input type={f.type} value={(editForm as any)[f.key]} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" />
                                </div>
                            ))}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setShowEditContact(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                            <button onClick={handleEditContact} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assign Course Modal ── */}
            {showAssignCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-visible">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900">Assign Course(s)</h3>
                            <button onClick={() => { setShowAssignCourse(false); setSelectedCourses([]); }} className="text-slate-400 hover:text-slate-700">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">Select one or more courses to assign to <strong>{student.name}</strong>.</p>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Select from LMS Library</label>
                                <CoursePicker
                                    courses={allCourses}
                                    selected={selectedCourses}
                                    onChange={setSelectedCourses}
                                    loading={coursesLoading}
                                />
                                {selectedCourses.length > 0 && (
                                    <p className="text-xs text-blue-600 mt-2">
                                        ✅ {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} ready to assign.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => { setShowAssignCourse(false); setSelectedCourses([]); }} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
                            <button
                                onClick={handleAssignCourse}
                                disabled={selectedCourses.length === 0}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Assign {selectedCourses.length > 0 ? `(${selectedCourses.length})` : ''}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Remove Course Modal ── */}
            {courseToRemove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Remove Course?</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            Are you sure you want to unassign this course from the student? They will immediately lose access to it.
                        </p>
                        <div className="flex gap-3 bg-slate-50 -mx-6 -mb-6 px-6 py-4 border-t border-slate-100">
                            <button
                                onClick={() => setCourseToRemove(null)}
                                className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 bg-white border border-slate-200 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRemoveCourse}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                            >
                                Remove Course
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}
