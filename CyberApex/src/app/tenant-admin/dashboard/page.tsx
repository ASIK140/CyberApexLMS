'use client';
import { useState, useEffect, useCallback } from 'react';
import RoleLayout, { NavSection } from '@/components/layout/RoleLayout';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/utils/api';
import Link from 'next/link';

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
            { label: 'Reports', href: '/tenant-admin/reports', icon: '📈' },
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
        ],
    },
];

interface DashData {
    total_employees: number;
    active_employees: number;
    training_completion_rate: number;
    active_courses: number;
    overdue_training: number;
    certificates_issued: number;
    completed_enrollments: number;
}

interface TrainingRow {
    course_id: string;
    course_name: string;
    enrolled: number;
    completed: number;
    in_progress: number;
    overdue: number;
    completion_rate: number;
}

export default function TenantDashboardPage() {
    const user = useAuthStore((s) => s.user);

    const [dash,    setDash]    = useState<DashData | null>(null);
    const [courses, setCourses] = useState<TrainingRow[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [dashRes, trainRes] = await Promise.all([
                apiClient.get('/tenant/dashboard'),
                apiClient.get('/tenant/training-status'),
            ]);
            setDash(dashRes.data?.data ?? null);
            setCourses(trainRes.data?.data?.courses?.slice(0, 5) ?? []);
        } catch { /* non-blocking */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const kpis = dash ? [
        { label: 'Total Employees',   value: dash.total_employees,        icon: '👥', color: 'bg-purple-500', href: '/tenant-admin' },
        { label: 'Active Employees',  value: dash.active_employees,       icon: '✅', color: 'bg-green-500',  href: '/tenant-admin' },
        { label: 'Completion Rate',   value: `${dash.training_completion_rate}%`, icon: '📈', color: 'bg-blue-500', href: '/tenant-admin/reports' },
        { label: 'Overdue Training',  value: dash.overdue_training,       icon: '⚠️', color: 'bg-red-500',    href: '/tenant-admin/reports' },
        { label: 'Certificates',      value: dash.certificates_issued,    icon: '🏆', color: 'bg-amber-500',  href: '/tenant-admin/reports' },
        { label: 'Total Enrollments', value: dash.active_courses,         icon: '📚', color: 'bg-indigo-500', href: '/tenant-admin/courses' },
    ] : [];

    const quickActions = [
        { label: 'Add Employee',     href: '/tenant-admin',         icon: '➕', desc: 'Create a new user account' },
        { label: 'Create Group',     href: '/tenant-admin/groups',  icon: '🏢', desc: 'Organize employees into groups' },
        { label: 'Assign Courses',   href: '/tenant-admin/courses', icon: '📚', desc: 'Assign training to groups' },
        { label: 'Export Report',    href: '/tenant-admin/reports', icon: '📊', desc: 'Download completion CSV' },
    ];

    return (
        <RoleLayout
            title="Dashboard"
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

                {/* Welcome banner */}
                <div className="rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-slate-900 border border-purple-700/30 p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[80px] rounded-full"></div>
                    <div className="relative z-10">
                        <span className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-2 block">Tenant Admin</span>
                        <h2 className="text-2xl font-bold text-white mb-1">
                            Welcome back, {user?.firstName || 'Admin'}!
                        </h2>
                        <p className="text-slate-300 text-sm">Here&apos;s your organization&apos;s training overview.</p>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {loading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 animate-pulse">
                                <div className="h-3 bg-slate-200 rounded w-24 mb-3"></div>
                                <div className="h-8 bg-slate-200 rounded w-16"></div>
                            </div>
                        ))
                        : kpis.map(k => (
                            <Link key={k.label} href={k.href}>
                                <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer">
                                    <div className={`absolute top-0 left-0 w-full h-1 ${k.color} group-hover:h-1.5 transition-all`}></div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
                                            <p className="text-3xl font-bold text-slate-900">{k.value}</p>
                                        </div>
                                        <span className="text-2xl opacity-40">{k.icon}</span>
                                    </div>
                                </div>
                            </Link>
                        ))
                    }
                </div>

                {/* Quick Actions + Training Table */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* Quick Actions */}
                    <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-sm">Quick Actions</h3>
                        </div>
                        <div className="p-4 space-y-2">
                            {quickActions.map(a => (
                                <Link key={a.label} href={a.href}>
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all group cursor-pointer">
                                        <span className="text-xl w-8 text-center">{a.icon}</span>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 group-hover:text-purple-700">{a.label}</p>
                                            <p className="text-xs text-slate-500">{a.desc}</p>
                                        </div>
                                        <svg className="w-4 h-4 text-slate-400 group-hover:text-purple-500 ml-auto transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Top Courses by Enrollment */}
                    <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-sm">Training Progress by Course</h3>
                            <Link href="/tenant-admin/courses">
                                <span className="text-xs text-purple-500 hover:text-purple-400 cursor-pointer">View All →</span>
                            </Link>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {loading && (
                                <div className="px-6 py-8 text-center text-slate-400 text-sm">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
                                </div>
                            )}
                            {!loading && courses.length === 0 && (
                                <div className="px-6 py-8 text-center text-slate-400 text-sm">
                                    No courses enrolled yet.{' '}
                                    <Link href="/tenant-admin/courses" className="text-purple-500 underline">Assign courses →</Link>
                                </div>
                            )}
                            {!loading && courses.map((c, i) => (
                                <div key={i} className="px-6 py-4">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <p className="text-sm font-semibold text-slate-800 truncate max-w-[240px]">{c.course_name}</p>
                                        <span className="text-xs font-bold text-slate-600 ml-2">{c.completion_rate}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5 mb-1">
                                        <div
                                            className={`h-1.5 rounded-full ${c.completion_rate === 100 ? 'bg-green-500' : 'bg-purple-500'}`}
                                            style={{ width: `${c.completion_rate}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex gap-3 text-[10px] text-slate-500">
                                        <span>👥 {c.enrolled} enrolled</span>
                                        <span>✅ {c.completed} done</span>
                                        {c.overdue > 0 && <span className="text-red-500">⚠️ {c.overdue} overdue</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Status Overview Row */}
                {dash && (
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                        <h3 className="font-bold text-slate-900 text-sm mb-4">Organization Health</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                {
                                    label: 'Active Rate',
                                    value: dash.total_employees > 0
                                        ? `${Math.round(dash.active_employees / dash.total_employees * 100)}%`
                                        : '—',
                                    sub: `${dash.active_employees} of ${dash.total_employees} employees active`,
                                    color: 'text-green-600',
                                },
                                {
                                    label: 'Training Completion',
                                    value: `${dash.training_completion_rate}%`,
                                    sub: `${dash.completed_enrollments} of ${dash.active_courses} enrollments done`,
                                    color: 'text-blue-600',
                                },
                                {
                                    label: 'Overdue Rate',
                                    value: dash.active_courses > 0
                                        ? `${Math.round(dash.overdue_training / dash.active_courses * 100)}%`
                                        : '0%',
                                    sub: `${dash.overdue_training} overdue enrollments`,
                                    color: dash.overdue_training > 0 ? 'text-red-600' : 'text-slate-500',
                                },
                                {
                                    label: 'Certificates Issued',
                                    value: dash.certificates_issued,
                                    sub: 'Total earned across all courses',
                                    color: 'text-amber-600',
                                },
                            ].map(item => (
                                <div key={item.label} className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                                    <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{item.sub}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </RoleLayout>
    );
}
