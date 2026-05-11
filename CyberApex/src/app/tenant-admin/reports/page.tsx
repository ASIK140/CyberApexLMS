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

interface EmployeeRow {
    user_id: string;
    name: string;
    email: string;
    department: string;
    role: string;
    status: string;
    courses_assigned: number;
    courses_completed: number;
    courses_in_progress: number;
    overdue_courses: number;
    completion_rate: number;
    certificates: number;
    courses: { course_name: string; status: string; progress: number; due_date: string | null }[];
}

export default function TenantReportsPage() {
    const user = useAuthStore((s) => s.user);

    const [employees, setEmployees] = useState<EmployeeRow[]>([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);
    const [search, setSearch]       = useState('');
    const [deptFilter, setDeptFilter] = useState('All');
    const [expanded, setExpanded]   = useState<string | null>(null);

    const fetchReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get('/tenant/reports/employees');
            setEmployees(res.data?.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load report.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const filtered = employees.filter(e => {
        const q = search.toLowerCase();
        const matchSearch = e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
        const matchDept = deptFilter === 'All' || e.department === deptFilter;
        return matchSearch && matchDept;
    });

    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

    const totalEmployees  = employees.length;
    const totalCompleted  = employees.filter(e => e.courses_assigned > 0 && e.completion_rate === 100).length;
    const avgCompletion   = employees.length > 0
        ? Math.round(employees.reduce((s, e) => s + e.completion_rate, 0) / employees.length)
        : 0;
    const totalOverdue    = employees.reduce((s, e) => s + e.overdue_courses, 0);

    const handleExportCSV = () => {
        const header = 'Name,Email,Department,Role,Status,Assigned,Completed,In Progress,Overdue,Completion %,Certificates';
        const rows = filtered.map(e =>
            `"${e.name}","${e.email}","${e.department}","${e.role}","${e.status}",${e.courses_assigned},${e.courses_completed},${e.courses_in_progress},${e.overdue_courses},${e.completion_rate}%,${e.certificates}`
        );
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employee_training_report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const statusColor = (s: string) => {
        if (s === 'completed') return 'text-green-600 bg-green-50 border-green-200';
        if (s === 'in_progress') return 'text-blue-600 bg-blue-50 border-blue-200';
        return 'text-slate-500 bg-slate-50 border-slate-200';
    };

    return (
        <RoleLayout
            title="Training Reports"
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
                <div className="flex justify-between items-center flex-col sm:flex-row gap-4">
                    <p className="text-slate-600 text-sm max-w-2xl">
                        Per-employee course completion status. Export to CSV for compliance reporting.
                    </p>
                    <button
                        onClick={handleExportCSV}
                        disabled={loading || employees.length === 0}
                        className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                        ⬇ Export CSV
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Employees', value: totalEmployees, color: 'bg-purple-500', icon: '👥' },
                        { label: 'Fully Completed', value: totalCompleted, color: 'bg-green-500',  icon: '✅' },
                        { label: 'Avg Completion',  value: `${avgCompletion}%`, color: 'bg-blue-500', icon: '📈' },
                        { label: 'Overdue Courses', value: totalOverdue,   color: 'bg-red-500',   icon: '⚠️' },
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
                        <button onClick={fetchReport} className="ml-auto text-xs underline">Retry</button>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    <select
                        value={deptFilter}
                        onChange={e => setDeptFilter(e.target.value)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                    >
                        <option value="All">All Departments</option>
                        {departments.map(d => <option key={d}>{d}</option>)}
                    </select>
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                                    <th className="px-6 py-4 text-left font-semibold">Employee</th>
                                    <th className="px-6 py-4 text-left font-semibold">Department</th>
                                    <th className="px-6 py-4 text-center font-semibold">Assigned</th>
                                    <th className="px-6 py-4 text-center font-semibold">Completed</th>
                                    <th className="px-6 py-4 text-center font-semibold">Overdue</th>
                                    <th className="px-6 py-4 text-left font-semibold">Completion</th>
                                    <th className="px-6 py-4 text-center font-semibold">Certs</th>
                                    <th className="px-6 py-4 text-right font-semibold">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading && (
                                    <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                                            Loading report...
                                        </div>
                                    </td></tr>
                                )}
                                {!loading && filtered.length === 0 && (
                                    <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-500">No employees found.</td></tr>
                                )}
                                {!loading && filtered.map(emp => (
                                    <>
                                        <tr key={emp.user_id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-3.5">
                                                <div>
                                                    <p className="font-semibold text-slate-900">{emp.name}</p>
                                                    <p className="text-xs text-slate-500">{emp.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-slate-600">{emp.department}</td>
                                            <td className="px-6 py-3.5 text-center font-semibold text-slate-700">{emp.courses_assigned}</td>
                                            <td className="px-6 py-3.5 text-center font-semibold text-green-600">{emp.courses_completed}</td>
                                            <td className="px-6 py-3.5 text-center">
                                                <span className={`font-semibold ${emp.overdue_courses > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                    {emp.overdue_courses}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-24 bg-slate-100 rounded-full h-1.5">
                                                        <div
                                                            className={`h-1.5 rounded-full ${emp.completion_rate === 100 ? 'bg-green-500' : emp.completion_rate > 0 ? 'bg-blue-500' : 'bg-slate-300'}`}
                                                            style={{ width: `${emp.completion_rate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-700 w-8">{emp.completion_rate}%</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-center">
                                                <span className={`text-sm font-bold ${emp.certificates > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                                                    {emp.certificates > 0 ? '🏆' : '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right">
                                                {emp.courses.length > 0 && (
                                                    <button
                                                        onClick={() => setExpanded(expanded === emp.user_id ? null : emp.user_id)}
                                                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold transition-colors"
                                                    >
                                                        {expanded === emp.user_id ? 'Hide' : 'View'} Courses
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                        {expanded === emp.user_id && (
                                            <tr key={`${emp.user_id}-detail`}>
                                                <td colSpan={8} className="px-6 pb-4 bg-slate-50 border-b border-slate-100">
                                                    <div className="pt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {emp.courses.map((c, i) => (
                                                            <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${statusColor(c.status)}`}>
                                                                <span className="font-medium truncate max-w-[180px]">{c.course_name}</span>
                                                                <div className="flex items-center gap-2 ml-2 shrink-0">
                                                                    <span>{c.progress}%</span>
                                                                    <span className="capitalize">{c.status.replace('_', ' ')}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </RoleLayout>
    );
}
