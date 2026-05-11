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

const statusStyles = (s: string) => {
    const status = (s || '').toLowerCase();
    if (status === 'active')   return 'bg-green-500/10 text-green-400 border-green-500/20';
    if (status === 'invited')  return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    if (status === 'inactive' || status === 'locked') return 'bg-red-500/10 text-red-400 border-red-500/20';
    return 'bg-slate-100 text-slate-600 border-slate-300';
};

function getInitials(name: string): string {
    const parts = (name || '').trim().split(' ');
    return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : (parts[0]?.[0] || '?');
}

export default function TenantAdminUserManagement() {
    const user = useAuthStore((s) => s.user);

    const [search, setSearch]           = useState('');
    const [deptFilter, setDeptFilter]   = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [users, setUsers]             = useState<any[]>([]);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState<string | null>(null);
    const [stats, setStats]             = useState({ total: 0, active: 0, certs: 0, admins: 0 });

    // Modal states
    const [activeModal, setActiveModal]   = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [processing, setProcessing]     = useState(false);

    // Courses state
    const [courses, setCourses]             = useState<any[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [enrollDueDate, setEnrollDueDate] = useState('');

    // Edit state
    const [editName, setEditName]         = useState('');
    const [editDept, setEditDept]         = useState('');
    const [editRole, setEditRole]         = useState('');

    // Password reset state
    const [resetPassword, setResetPassword] = useState('');

    // Form states
    const [newUserForm, setNewUserForm] = useState({
        firstName: '', lastName: '', email: '', password: '',
        role: 'student' as string, department: 'Engineering',
    });

    // ── Fetch users from working /api/tenant/users endpoint ──────────────────
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get('/tenant/users');
            const json = res.data;
            setUsers(json.data || []);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to fetch users';
            console.error('fetchUsers error:', msg);
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, []);

    // ── Fetch dashboard stats ─────────────────────────────────────────────────
    const fetchStats = useCallback(async () => {
        try {
            const res = await apiClient.get('/tenant/dashboard');
            const d = res.data.data;
            setStats({
                total:  d.total_employees  || 0,
                active: d.active_employees || 0,
                certs:  d.certificates_issued || 0,
                admins: 0,
            });
        } catch { /* non-blocking */ }
    }, []);

    const fetchCourses = useCallback(async () => {
        try {
            const res = await apiClient.get('/tenant/courses');
            setCourses(res.data?.data || []);
        } catch (err) {
            console.error('fetchCourses error:', err);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchStats();
        fetchCourses();
    }, [fetchUsers, fetchStats, fetchCourses]);

    // ── Create user ───────────────────────────────────────────────────────────
    const handleCreateUser = async () => {
        const { firstName, lastName, email, password, role, department } = newUserForm;
        if (!firstName || !email || !password) {
            alert('First name, email, and password are required.');
            return;
        }
        if (password.length < 8) {
            alert('Password must be at least 8 characters.');
            return;
        }
        setProcessing(true);
        try {
            await apiClient.post('/tenant/users/create', {
                name: `${firstName} ${lastName}`.trim(),
                email,
                password,
                department,
                role,
                send_welcome: true,
            });
            setActiveModal(null);
            setNewUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'student', department: 'Engineering' });
            await fetchUsers();
            await fetchStats();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create user.');
        } finally {
            setProcessing(false);
        }
    };

    // ── Update user ───────────────────────────────────────────────────────────
    const handleUpdateUser = async () => {
        if (!selectedUser) return;
        setProcessing(true);
        try {
            await apiClient.put(`/tenant/users/update?user_id=${selectedUser.user_id}`, {
                name: editName || selectedUser.name,
                department: editDept || selectedUser.department,
                role: editRole || selectedUser.role,
            });
            setActiveModal(null);
            await fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update user.');
        } finally {
            setProcessing(false);
        }
    };

    // ── Deactivate user ───────────────────────────────────────────────────────
    const handleDeactivateUser = async () => {
        if (!selectedUser) return;
        setProcessing(true);
        try {
            await apiClient.delete(`/tenant/users?user_id=${selectedUser.user_id}`);
            setActiveModal(null);
            await fetchUsers();
            await fetchStats();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to deactivate user.');
        } finally {
            setProcessing(false);
        }
    };

    // ── Assign course ─────────────────────────────────────────────────────────
    const handleAssignCourse = async () => {
        if (!selectedUser || !selectedCourseId) return;
        setProcessing(true);
        try {
            await apiClient.post('/tenant/courses/assign', {
                course_id: selectedCourseId,
                assigned_to_type: 'individual',
                user_ids: [selectedUser.user_id],
                deadline: enrollDueDate || undefined,
            });
            setActiveModal(null);
            setSelectedCourseId('');
            setEnrollDueDate('');
            alert('Course assigned successfully!');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to assign course.');
        } finally {
            setProcessing(false);
        }
    };

    // ── Reset user password ───────────────────────────────────────────────────
    const handleResetPassword = async () => {
        if (!selectedUser || !resetPassword) return;
        if (resetPassword.length < 8) { alert('Password must be at least 8 characters.'); return; }
        setProcessing(true);
        try {
            await apiClient.post(`/tenant/users/reset-password?user_id=${selectedUser.user_id}`, { newPassword: resetPassword });
            setActiveModal(null);
            setResetPassword('');
            alert(`Password reset for ${selectedUser.email}`);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to reset password.');
        } finally {
            setProcessing(false);
        }
    };

    // ── Export CSV (client-side from loaded data) ─────────────────────────────
    const handleExportCSV = () => {
        const header = 'Name,Email,Department,Role,Status,Joined,Last Login';
        const rows = users.map(u =>
            `"${u.name}","${u.email}","${u.department || ''}","${u.role}","${u.status}","${u.joined ? new Date(u.joined).toLocaleDateString() : ''}","${u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}"`
        );
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ── Filtering ─────────────────────────────────────────────────────────────
    const filtered = users.filter(u => {
        const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase())
            || u.email.toLowerCase().includes(search.toLowerCase());
        const matchDept   = deptFilter === 'All' || u.department === deptFilter;
        const matchStatus = statusFilter === 'All' || u.status === statusFilter;
        return matchSearch && matchDept && matchStatus;
    });

    const handleAction = (type: string, userToAct: any = null) => {
        if (userToAct) {
            setSelectedUser(userToAct);
            if (type === 'editUser') {
                setEditName(userToAct.name || '');
                setEditDept(userToAct.department || '');
                setEditRole(userToAct.role || 'student');
            }
        }
        setActiveModal(type);
    };

    return (
        <RoleLayout
            title="User Management"
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
                    <p className="text-slate-600 text-sm max-w-2xl">Manage all employees inside the organization. View training enrollments, status, and control system access.</p>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => handleAction('addUser')} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all whitespace-nowrap">
                            + Add User
                        </button>
                        <a href="/tenant-admin/groups">
                            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all whitespace-nowrap">
                                Add Group
                            </button>
                        </a>
                        <a href="/tenant-admin/import">
                            <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors whitespace-nowrap">
                                Bulk Import
                            </button>
                        </a>
                        <button onClick={handleExportCSV} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg border border-slate-300 transition-colors whitespace-nowrap">
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* KPI Cards — live data */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Users',      value: stats.total,  color: 'bg-purple-500', icon: '👥' },
                        { label: 'Active Users',     value: stats.active, color: 'bg-green-500',  icon: '✅' },
                        { label: 'Enrolled Courses', value: users.reduce((s, u) => s + (u.enrollments?.length || 0), 0), color: 'bg-blue-500', icon: '📚' },
                        { label: 'Certs Issued',     value: stats.certs,  color: 'bg-yellow-500', icon: '🏆' },
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

                {/* Error banner */}
                {error && (
                    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                        <span>⚠️</span> {error}
                        <button onClick={fetchUsers} className="ml-auto text-xs underline">Retry</button>
                    </div>
                )}

                {/* Filters & Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-4 flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white border-b border-slate-200">
                        <div className="relative w-full lg:max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-500">🔍</span>
                            <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500 transition-colors" />
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
                                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500 cursor-pointer">
                                <option value="All">All Departments</option>
                                {[...new Set(users.map(u => u.department).filter(Boolean))].map(d => (
                                    <option key={d}>{d}</option>
                                ))}
                            </select>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500 cursor-pointer">
                                <option value="All">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="invited">Invited</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm whitespace-nowrap">
                            <thead className="bg-slate-50/50 border-b border-slate-200">
                                <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                                    <th className="px-6 py-4 text-left font-semibold">Name</th>
                                    <th className="px-6 py-4 text-left font-semibold">Email</th>
                                    <th className="px-6 py-4 text-left font-semibold">Department</th>
                                    <th className="px-6 py-4 text-left font-semibold">Role</th>
                                    <th className="px-6 py-4 text-left font-semibold">Last Login</th>
                                    <th className="px-6 py-4 text-left font-semibold">Status</th>
                                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                                                Loading users...
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!loading && filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                                            No users match your filters.
                                        </td>
                                    </tr>
                                )}
                                {!loading && filtered.map(u => (
                                    <tr key={u.user_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center text-xs font-bold text-purple-700 shrink-0">
                                                    {getInitials(u.name)}
                                                </div>
                                                <span className="font-semibold text-slate-900">{u.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-600">{u.email}</td>
                                        <td className="px-6 py-3.5 text-slate-600">{u.department || 'Unassigned'}</td>
                                        <td className="px-6 py-3.5">
                                            <span className={`px-2 py-0.5 rounded text-xs border ${u.role === 'tenant_admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-slate-500 text-xs">
                                            {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border flex items-center gap-1.5 w-max ${statusStyles(u.status)}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-green-400' : u.status === 'inactive' ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button onClick={() => handleAction('assignCourse', u)} className="px-2 py-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 rounded border border-purple-500/20 text-[10px] uppercase font-semibold transition-colors">
                                                    Assign Course
                                                </button>
                                                <button onClick={() => handleAction('editUser', u)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 text-[10px] uppercase font-semibold transition-colors">
                                                    Edit
                                                </button>
                                                <button onClick={() => { setSelectedUser(u); setResetPassword(''); setActiveModal('resetPassword'); }} className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded border border-amber-500/20 text-[10px] uppercase font-semibold transition-colors flex items-center gap-1" title="Reset Password">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                                    Reset Pwd
                                                </button>
                                                <button onClick={() => handleAction('viewAudit', u)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs transition-colors" title="View Audit Trail">
                                                    📜
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── MODAL: Add User ───────────────────────────────────────────────────── */}
            {activeModal === 'addUser' && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">Add New User</h3>
                            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900 text-2xl leading-none">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">First Name *</label>
                                    <input type="text" value={newUserForm.firstName} onChange={e => setNewUserForm({...newUserForm, firstName: e.target.value})}
                                        placeholder="Jane" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Last Name</label>
                                    <input type="text" value={newUserForm.lastName} onChange={e => setNewUserForm({...newUserForm, lastName: e.target.value})}
                                        placeholder="Doe" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email Address *</label>
                                <input type="email" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                                    placeholder="jane@company.com" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Initial Password * (min 8 chars)</label>
                                <input type="password" value={newUserForm.password} onChange={e => setNewUserForm({...newUserForm, password: e.target.value})}
                                    placeholder="Minimum 8 characters" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Department</label>
                                    <input type="text" value={newUserForm.department} onChange={e => setNewUserForm({...newUserForm, department: e.target.value})}
                                        placeholder="e.g. Engineering" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Role</label>
                                    <select value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value})}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500">
                                        <option value="student">Employee</option>
                                        <option value="ciso">CISO</option>
                                        <option value="tenant_admin">Tenant Admin</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
                            <button onClick={handleCreateUser} disabled={processing} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg min-w-[120px] disabled:opacity-60">
                                {processing ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: Assign Course ──────────────────────────────────────────────── */}
            {activeModal === 'assignCourse' && selectedUser && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">Assign Course</h3>
                            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900 text-2xl leading-none">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">Assign a training course to <strong>{selectedUser.name}</strong>.</p>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Select Course</label>
                                <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500">
                                    <option value="">-- Choose a Course --</option>
                                    {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Due Date (Optional)</label>
                                <input type="date" value={enrollDueDate} onChange={e => setEnrollDueDate(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
                            <button onClick={handleAssignCourse} disabled={processing || !selectedCourseId}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg min-w-[120px] disabled:opacity-50">
                                {processing ? 'Assigning...' : 'Assign Course'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: Edit User ──────────────────────────────────────────────────── */}
            {activeModal === 'editUser' && selectedUser && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">Edit User</h3>
                            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900 text-2xl leading-none">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full Name</label>
                                <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Department</label>
                                <input type="text" value={editDept} onChange={e => setEditDept(e.target.value)}
                                    placeholder="e.g. Engineering" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Role</label>
                                <select value={editRole} onChange={e => setEditRole(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500">
                                    <option value="student">Employee</option>
                                    <option value="ciso">CISO</option>
                                    <option value="tenant_admin">Tenant Admin</option>
                                </select>
                            </div>
                            {selectedUser.role !== 'tenant_admin' && (
                                <div className="pt-2 border-t border-slate-100">
                                    <label className="text-xs font-semibold text-red-400 mb-2 block uppercase">Danger Zone</label>
                                    <button onClick={handleDeactivateUser} disabled={processing}
                                        className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-sm font-semibold rounded-lg border border-red-500/20 transition-colors disabled:opacity-50">
                                        {processing ? 'Processing...' : 'Deactivate User'}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
                            <button onClick={handleUpdateUser} disabled={processing}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg min-w-[120px] disabled:opacity-60">
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: Reset Password ─────────────────────────────────────────────── */}
            {activeModal === 'resetPassword' && selectedUser && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">Reset Password</h3>
                            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900 text-2xl leading-none">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">Set a new password for <strong>{selectedUser.name}</strong> ({selectedUser.email}).</p>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">New Password (min 8 chars)</label>
                                <input
                                    type="password"
                                    value={resetPassword}
                                    onChange={e => setResetPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-amber-500"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
                            <button onClick={handleResetPassword} disabled={processing || resetPassword.length < 8}
                                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold rounded-lg min-w-[120px] disabled:opacity-50">
                                {processing ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: View Audit Trail ───────────────────────────────────────────── */}
            {activeModal === 'viewAudit' && selectedUser && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden h-[520px] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Audit Trail: {selectedUser.name}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{selectedUser.email}</p>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-900 text-2xl leading-none">×</button>
                        </div>
                        <AuditTrailContent userId={selectedUser.user_id} />
                        <div className="p-4 border-t border-slate-200 bg-slate-50">
                            <button onClick={() => setActiveModal(null)} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </RoleLayout>
    );
}

/** Fetches and renders real audit logs for a given user */
function AuditTrailContent({ userId }: { userId: string }) {
    const [logs, setLogs]       = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get(`/tenant/audit-log?limit=10`)
            .then(res => setLogs((res.data.data || []).filter((l: any) => l.actor_id === userId)))
            .catch(() => setLogs([]))
            .finally(() => setLoading(false));
    }, [userId]);

    const actionColor = (action: string) => {
        if (action.includes('LOGIN'))   return 'text-green-500';
        if (action.includes('CREATE'))  return 'text-blue-500';
        if (action.includes('DELETE') || action.includes('FAIL')) return 'text-red-500';
        return 'text-slate-600';
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading && <p className="text-slate-500 text-sm text-center">Loading audit trail...</p>}
            {!loading && logs.length === 0 && <p className="text-slate-500 text-sm text-center">No audit records found for this user.</p>}
            {logs.map((l, i) => (
                <div key={l.log_id || i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-slate-400 mt-1.5 shrink-0"></div>
                        {i < logs.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 mt-1"></div>}
                    </div>
                    <div className="pb-3">
                        <p className={`text-sm font-bold ${actionColor(l.action)}`}>{l.action}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {l.ip ? `IP: ${l.ip} · ` : ''}{new Date(l.timestamp).toLocaleString()}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
