'use client';
import { useState, useEffect, useCallback } from 'react';
import RoleLayout, { NavSection } from '@/components/layout/RoleLayout';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/utils/api';

const navSections: NavSection[] = [
    {
        title: 'OVERVIEW',
        items: [
            { label: 'Dashboard', href: '/tenant-admin/dashboard', icon: '📊' },
        ],
    },
    {
        title: 'USERS',
        items: [
            { label: 'User Management', href: '/tenant-admin', icon: '👥' },
            { label: 'Group Management', href: '/tenant-admin/groups', icon: '🏢' },
            { label: 'Import / SCIM Sync', href: '/tenant-admin/import', icon: '📤' },
        ],
    },
    {
        title: 'TRAINING',
        items: [
            { label: 'Courses', href: '/tenant-admin/courses', icon: '📚' },
            { label: 'Reports', href: '/tenant-admin/reports', icon: '📊' },
        ],
    },
    {
        title: 'PHISHING',
        items: [
            { label: 'Phishing Simulator', href: '/tenant-admin/phishing', icon: '🎣' },
            { label: 'Email Templates', href: '/tenant-admin/templates', icon: '✉️' },
        ],
    },
    {
        title: 'CONFIGURATION',
        items: [
            { label: 'Settings', href: '/tenant-admin/settings', icon: '⚙️' },
            { label: 'SSO Configuration', href: '/tenant-admin/sso', icon: '🔑' },
            { label: 'Integrations', href: '/tenant-admin/integrations', icon: '🔌' },
        ],
    },
];

interface Course {
    assignment_id: string;
    course_id: string;
    title: string;
    description?: string;
    status: string;
    duration_minutes: number;
    thumbnail_url?: string;
    assigned_at: string;
    enrollment_stats: {
        total: number;
        completed: number;
        in_progress: number;
        not_started: number;
        completion_rate: number;
    };
}

interface Group {
    group_id: string;
    name: string;
    member_count: number;
}

export default function TenantCoursesPage() {
    const user = useAuthStore((s) => s.user);

    const [courses, setCourses]   = useState<Course[]>([]);
    const [groups, setGroups]     = useState<Group[]>([]);
    const [loading, setLoading]   = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError]       = useState<string | null>(null);
    const [search, setSearch]     = useState('');

    // Assign to group modal
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [deadline, setDeadline] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get('/tenant/courses');
            setCourses(res.data?.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load courses.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchGroups = useCallback(async () => {
        try {
            const res = await apiClient.get('/tenant/groups');
            setGroups(res.data?.data || []);
        } catch { /* non-blocking */ }
    }, []);

    useEffect(() => {
        fetchCourses();
        fetchGroups();
    }, [fetchCourses, fetchGroups]);

    const handleAssignToGroup = async () => {
        if (!selectedCourse || !selectedGroupId) return;
        setProcessing(true);
        try {
            await apiClient.post(`/tenant/groups/${selectedGroupId}/assign-course`, {
                course_id: selectedCourse.course_id,
                deadline: deadline || undefined,
            });
            setShowAssignModal(false);
            setSelectedCourse(null);
            setSelectedGroupId('');
            setDeadline('');
            alert('Course assigned to group and members auto-enrolled!');
            await fetchCourses();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to assign course.');
        } finally {
            setProcessing(false);
        }
    };

    const filtered = courses.filter(c =>
        (c.title || '').toLowerCase().includes(search.toLowerCase())
    );

    const totalAssigned   = courses.length;
    const totalEnrolled   = courses.reduce((s, c) => s + (c.enrollment_stats?.total || 0), 0);
    const totalCompleted  = courses.reduce((s, c) => s + (c.enrollment_stats?.completed || 0), 0);
    const avgCompletion   = totalEnrolled > 0 ? Math.round(totalCompleted / totalEnrolled * 100) : 0;

    return (
        <RoleLayout
            title="Courses"
            subtitle={`Tenant Admin · ${user?.email}`}
            accentColor="purple"
            avatarText={user?.firstName?.charAt(0) || 'U'}
            avatarGradient="bg-gradient-to-tr from-purple-500 to-pink-500"
            userName={`${user?.firstName} ${user?.lastName}`}
            userEmail={user?.email || ''}
            navSections={navSections}
            currentRole="tenant-admin"
        >
            <div className="flex flex-col gap-6">

                {/* Header */}
                <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
                    <p className="text-slate-600 text-sm max-w-2xl">
                        Courses assigned to your organization by the Super Admin. Assign them to groups to auto-enroll employees.
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Courses Assigned', value: totalAssigned,  color: 'bg-purple-500', icon: '📚' },
                        { label: 'Total Enrollments', value: totalEnrolled,  color: 'bg-blue-500',   icon: '👤' },
                        { label: 'Completions',        value: totalCompleted, color: 'bg-green-500',  icon: '✅' },
                        { label: 'Avg Completion',     value: `${avgCompletion}%`, color: 'bg-amber-500', icon: '📈' },
                    ].map(k => (
                        <div key={k.label} className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden group">
                            <div className={`absolute top-0 left-0 w-full h-1 ${k.color} group-hover:h-1.5 transition-all`}></div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1">{k.label}</p>
                                    <p className="text-3xl font-bold text-slate-900">{loading ? '—' : k.value}</p>
                                </div>
                                <span className="text-2xl opacity-50">{k.icon}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                        <span>⚠️</span> {error}
                        <button onClick={fetchCourses} className="ml-auto text-xs underline">Retry</button>
                    </div>
                )}

                {/* Search */}
                <div className="relative max-w-md">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                </div>

                {/* Course Cards Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <div className="text-4xl mb-3">📚</div>
                        <p className="font-semibold">No courses assigned yet</p>
                        <p className="text-sm mt-1">Ask your Super Admin to assign courses to your organization.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filtered.map(course => {
                            const stats = course.enrollment_stats || { total: 0, completed: 0, in_progress: 0, not_started: 0, completion_rate: 0 };
                            return (
                                <div key={course.course_id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                                    {/* Thumbnail placeholder */}
                                    <div className="h-28 bg-gradient-to-br from-purple-100 via-indigo-50 to-blue-100 flex items-center justify-center relative">
                                        {course.thumbnail_url ? (
                                            <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-5xl opacity-30">🎓</span>
                                        )}
                                        <span className={`absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                            course.status === 'published'
                                                ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                                : 'bg-slate-100 text-slate-500 border-slate-300'
                                        }`}>{course.status}</span>
                                    </div>

                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1">{course.title}</h3>
                                        {course.description && (
                                            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{course.description}</p>
                                        )}
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                                            <span>⏱ {course.duration_minutes ?? '?'} min</span>
                                            <span>·</span>
                                            <span>👥 {stats.total} enrolled</span>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="mb-1 flex justify-between text-xs text-slate-500">
                                            <span>Completion</span>
                                            <span className="font-semibold text-slate-700">{stats.completion_rate}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full transition-all"
                                                style={{ width: `${stats.completion_rate}%` }}
                                            ></div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 text-center mb-4">
                                            {[
                                                { label: 'Done', value: stats.completed, color: 'text-green-600' },
                                                { label: 'Active', value: stats.in_progress, color: 'text-blue-600' },
                                                { label: 'Pending', value: stats.not_started, color: 'text-slate-500' },
                                            ].map(s => (
                                                <div key={s.label} className="bg-slate-50 rounded-lg py-2">
                                                    <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                                                    <p className="text-[10px] text-slate-500">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-auto">
                                            <button
                                                onClick={() => { setSelectedCourse(course); setSelectedGroupId(''); setDeadline(''); setShowAssignModal(true); }}
                                                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors"
                                            >
                                                Assign to Group
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── MODAL: Assign to Group ─────────────────────────────────────────────── */}
            {showAssignModal && selectedCourse && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">Assign Course to Group</h3>
                            <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-900 text-2xl leading-none">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                                <p className="text-xs text-purple-600 font-semibold uppercase mb-0.5">Course</p>
                                <p className="text-sm font-bold text-slate-900">{selectedCourse.title}</p>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Select Group *</label>
                                <select
                                    value={selectedGroupId}
                                    onChange={e => setSelectedGroupId(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                                >
                                    <option value="">-- Choose a Group --</option>
                                    {groups.map(g => (
                                        <option key={g.group_id} value={g.group_id}>
                                            {g.name} ({g.member_count} members)
                                        </option>
                                    ))}
                                </select>
                                {groups.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1.5">No groups yet. <a href="/tenant-admin/groups" className="underline">Create a group first.</a></p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Completion Deadline (Optional)</label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={e => setDeadline(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <p className="text-xs text-slate-500">All current group members will be auto-enrolled.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
                            <button
                                onClick={handleAssignToGroup}
                                disabled={processing || !selectedGroupId}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg min-w-[130px] disabled:opacity-50"
                            >
                                {processing ? 'Assigning...' : 'Assign & Enroll'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </RoleLayout>
    );
}
