'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
export default function StudentsPage() {
    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [studentForm, setStudentForm] = useState({
        name: '', email: '', phone: '', login_id: '', password: ''
    });
    const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.length} student(s)? This action cannot be undone.`)) return;
        setIsDeleting(true);
        try {
            const { apiFetch } = await import('@/utils/api');
            const res = await apiFetch('/admin/students/bulk-delete', {
                method: 'POST',
                body: JSON.stringify({ ids: selectedIds }),
            });
            const json = await res.json();
            if (json.success) {
                showMsg(`🗑️ ${json.deleted} student(s) deleted successfully.`);
                setSelectedIds([]);
                await fetchStudents();
            } else {
                setFormError(json.message || 'Failed to delete students.');
                // Scroll to top to show error
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch {
            setFormError('Network error while deleting.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setIsDeleting(false);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            // Use legacy endpoint that directly reads from IndividualStudent table
            // This ensures newly added students appear immediately in the list
            const { apiClient } = await import('@/utils/api');
            const res = await apiClient.get('/admin/students');
            if (res.data?.success) {
                setStudentsList(res.data.data || []);
            }
        } catch (err) {
            console.error('Failed to fetch students', err);
            setStudentsList([]);
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
        fetchStudents();
        fetchCourses(); // Pre-load courses so picker opens instantly
    }, []);

    const showMsg = (msg: string) => {
        setFormSuccess(msg);
        setTimeout(() => setFormSuccess(null), 4500);
    };

    const resetForm = () => {
        setStudentForm({ name: '', email: '', phone: '', login_id: '', password: '' });
        setSelectedCourses([]);
        setFormError(null);
    };

    const handleSubmit = async () => {
        setFormError(null);
        const { name, email, phone, login_id, password } = studentForm;
        if (!name.trim() || !email.trim() || !login_id.trim() || !password.trim()) {
            setFormError('Student Name, Email ID, Login ID and Password are required.');
            return;
        }
        if (password.length < 6) {
            setFormError('Password must be at least 6 characters.');
            return;
        }
        setFormLoading(true);
        try {
            const { apiFetch } = await import('@/utils/api');
            const body: any = {
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                login_id: login_id.trim(),
                password,
            };
            if (selectedCourses.length > 0) {
                body.assigned_courses = selectedCourses.map(c => c.id);
            }
            const res = await apiFetch('/admin/students', { method: 'POST', body: JSON.stringify(body) });
            const json = await res.json();
            if (json.success) {
                setShowAddForm(false);
                resetForm();
                showMsg(`✅ Student "${json.data.name}" enrolled with ${selectedCourses.length} course(s)!`);
                await fetchStudents();
            } else {
                setFormError(json.message || 'Failed to create student.');
            }
        } catch {
            setFormError('Network error. Please try again.');
        } finally {
            setFormLoading(false);
        }
    };

    const filtered = studentsList.filter(s => {
        const matchSearch = !search ||
            s.name?.toLowerCase().includes(search.toLowerCase()) ||
            s.email?.toLowerCase().includes(search.toLowerCase()) ||
            s.login_id?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || s.service_status === statusFilter;
        return matchSearch && matchStatus;
    });

    const activeCount = studentsList.filter(s => s.service_status === 'active').length;
    const stoppedCount = studentsList.filter(s => s.service_status === 'stopped').length;
    const totalCourses = studentsList.reduce((acc, s) => acc + (Array.isArray(s.assigned_courses) ? s.assigned_courses.length : 0), 0);

    return (
        <SuperAdminLayout title="Student Management">

            {/* ── Success Toast ── */}
            {formSuccess && (
                <div className="fixed top-20 right-6 z-[100] bg-green-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-in fade-in slide-in-from-top-2 duration-300 max-w-sm">
                    {formSuccess}
                </div>
            )}

            <div className="space-y-6">

                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Students', value: studentsList.length, icon: '🎓', color: 'bg-indigo-50 border-indigo-100' },
                        { label: 'Active', value: activeCount, icon: '🟢', color: 'bg-green-50 border-green-100' },
                        { label: 'Service Stopped', value: stoppedCount, icon: '⛔', color: 'bg-red-50 border-red-100' },
                        { label: 'Courses Assigned', value: totalCourses, icon: '📚', color: 'bg-blue-50 border-blue-100' },
                    ].map(k => (
                        <div key={k.label} className={`p-4 rounded-xl border shadow-sm ${k.color}`}>
                            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
                            <p className="text-2xl font-bold text-slate-900">{k.icon} {k.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── ADD STUDENT SECTION ── */}
                <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-visible">
                    <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">Add Individual Student</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Enroll a standalone student and assign LMS courses directly.</p>
                        </div>
                        <button
                            onClick={() => {
                                setShowAddForm(!showAddForm);
                                if (!showAddForm) resetForm();
                            }}
                            className={`flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl transition-all ${showAddForm
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                : 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white shadow-[0_0_14px_rgba(220,38,38,0.3)]'
                                }`}
                        >
                            {showAddForm ? '✕ Cancel' : '+ Add Student'}
                        </button>
                    </div>

                    {showAddForm && (
                        <div className="p-6 space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
                            {formError && (
                                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-medium">
                                    ⚠️ {formError}
                                </div>
                            )}

                            {/* ── Fields 1–5 ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                                {[
                                    { label: '1. Student Name *', key: 'name', type: 'text', placeholder: 'e.g. Rahul Sharma' },
                                    { label: '2. Email ID *', key: 'email', type: 'email', placeholder: 'rahul@example.com' },
                                    { label: '3. Phone / Contact Number', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
                                    { label: '4. User ID / Login ID *', key: 'login_id', type: 'text', placeholder: 'e.g. rahul.sharma' },
                                    { label: '5. Password *', key: 'password', type: 'password', placeholder: 'Minimum 6 characters' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">{f.label}</label>
                                        <input
                                            id={`student-form-${f.key}`}
                                            type={f.type}
                                            value={(studentForm as any)[f.key]}
                                            onChange={e => setStudentForm({ ...studentForm, [f.key]: e.target.value })}
                                            placeholder={f.placeholder}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:bg-white transition-all"
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* ── Field 6: Course Picker ── */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                    6. Assign Course(s)
                                    <span className="ml-2 text-slate-400 font-normal">— Select one or more courses from the LMS library</span>
                                </label>
                                <CoursePicker
                                    courses={allCourses}
                                    selected={selectedCourses}
                                    onChange={setSelectedCourses}
                                    loading={coursesLoading}
                                />
                                {selectedCourses.length > 0 && (
                                    <p className="text-xs text-blue-600 mt-1.5">
                                        ✅ {selectedCourses.length} course{selectedCourses.length !== 1 ? 's' : ''} selected: {selectedCourses.map(c => c.title).join(', ')}
                                    </p>
                                )}
                            </div>

                            {/* ── Submit ── */}
                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => { setShowAddForm(false); resetForm(); }}
                                    className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    id="enroll-student-btn"
                                    disabled={formLoading}
                                    onClick={handleSubmit}
                                    className="px-7 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(220,38,38,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {formLoading ? (
                                        <span className="flex items-center gap-2">
                                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Enrolling...
                                        </span>
                                    ) : `🎓 Submit & Enroll Student${selectedCourses.length > 0 ? ` (${selectedCourses.length} course${selectedCourses.length !== 1 ? 's' : ''})` : ''}`}
                                </button>
                            </div>
                        </div>
                    )}
                </section>

                {/* ── STUDENT MANAGEMENT TABLE ── */}
                <section>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-bold text-slate-900">Student Management</h2>
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                {filtered.length} of {studentsList.length}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isDeleting}
                                    className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {isDeleting ? 'Deleting...' : `🗑️ Delete (${selectedIds.length})`}
                                </button>
                            )}
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-red-400"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="stopped">Stopped Only</option>
                            </select>
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by name, email or login..."
                                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-400 w-56 transition-colors"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                            <span className="ml-3 text-slate-500 text-sm">Loading students...</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center">
                            <p className="text-5xl mb-3">🎓</p>
                            <p className="text-sm font-semibold text-slate-700">
                                {studentsList.length === 0 ? 'No students enrolled yet.' : 'No students match your search.'}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                {studentsList.length === 0
                                    ? 'Use the "+ Add Student" button above to enroll your first student.'
                                    : 'Try a different search term or filter.'}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-x-auto">
                            <table className="w-full text-xs min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider bg-slate-50">
                                        <th className="px-4 py-3 w-10 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-3.5 h-3.5 rounded border-slate-300 text-red-500 focus:ring-red-500 cursor-pointer"
                                                checked={filtered.length > 0 && selectedIds.length === filtered.length}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        setSelectedIds(filtered.map(s => s.student_id));
                                                    } else {
                                                        setSelectedIds([]);
                                                    }
                                                }}
                                            />
                                        </th>
                                        <th className="text-left px-5 py-3 font-semibold">Student</th>
                                        <th className="text-left px-5 py-3 font-semibold">Login ID</th>
                                        <th className="text-left px-5 py-3 font-semibold">Email</th>
                                        <th className="text-left px-5 py-3 font-semibold">Phone</th>
                                        <th className="text-left px-5 py-3 font-semibold">Courses</th>
                                        <th className="text-left px-5 py-3 font-semibold">Status</th>
                                        <th className="text-left px-5 py-3 font-semibold">Enrolled</th>
                                        <th className="text-left px-5 py-3 font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filtered.map((s: any) => {
                                        const courses = Array.isArray(s.assigned_courses) ? s.assigned_courses : [];
                                        const isStopped = s.service_status === 'stopped';
                                        const isSelected = selectedIds.includes(s.student_id);
                                        return (
                                            <tr key={s.student_id} className={`transition-colors group ${isSelected ? 'bg-red-50/50' : 'hover:bg-slate-50/80'}`}>
                                                <td className="px-4 py-3.5 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-3.5 h-3.5 rounded border-slate-300 text-red-500 focus:ring-red-500 cursor-pointer"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            if (isSelected) {
                                                                setSelectedIds(prev => prev.filter(id => id !== s.student_id));
                                                            } else {
                                                                setSelectedIds(prev => [...prev, s.student_id]);
                                                            }
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${isStopped ? 'bg-red-100 text-red-500' : 'bg-gradient-to-br from-red-500 to-orange-400 text-white shadow-sm'}`}>
                                                            {s.name?.charAt(0)?.toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900">{s.name}</p>
                                                            <p className="text-[10px] text-slate-400 mt-0.5">ID: {s.student_id?.slice(0, 8)}...</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-700">{s.login_id}</code>
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-600">{s.email}</td>
                                                <td className="px-5 py-3.5 text-slate-500">{s.phone || '—'}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-full text-[10px] font-bold">
                                                        📚 {courses.length} course{courses.length !== 1 ? 's' : ''}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${isStopped ? 'text-red-600 bg-red-50 border-red-200' : 'text-green-600 bg-green-50 border-green-200'}`}>
                                                        {isStopped ? '⛔ Stopped' : '🟢 Active'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-400 text-[11px]">
                                                    {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <Link href={`/admin/students/${s.student_id}`}>
                                                        <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm group-hover:shadow-md">
                                                            👁 View / Manage
                                                        </button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </SuperAdminLayout>
    );
}
