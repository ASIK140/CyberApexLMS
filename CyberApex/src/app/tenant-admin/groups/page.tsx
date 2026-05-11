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
    assigned_at: string;
    enrollment_stats?: { total: number; completed: number; completion_rate: number };
}

interface Group {
    group_id: string;
    name: string;
    description?: string;
    member_count: number;
    courses: { course_id: string; title: string; status: string }[];
    created_at: string;
}

interface Member {
    member_id: string;
    user_id: string;
    name: string;
    email: string;
    department: string;
    role: string;
    status: string;
}

interface User {
    user_id: string;
    name: string;
    email: string;
    department: string;
    role: string;
    status: string;
}

export default function GroupManagementPage() {
    const user = useAuthStore((s) => s.user);

    const [tenantCourses, setTenantCourses] = useState<Course[]>([]);
    const [groups, setGroups]               = useState<Group[]>([]);
    const [allUsers, setAllUsers]           = useState<User[]>([]);
    const [loading, setLoading]             = useState(true);
    const [processing, setProcessing]       = useState(false);
    const [error, setError]                 = useState<string | null>(null);

    // Modal states
    const [activeModal, setActiveModal]   = useState<string | null>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [members, setMembers]           = useState<Member[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);

    // Create group form
    const [newGroupName, setNewGroupName]   = useState('');
    const [newGroupDesc, setNewGroupDesc]   = useState('');

    // Edit group form
    const [editGroupName, setEditGroupName] = useState('');
    const [editGroupDesc, setEditGroupDesc] = useState('');

    // Assign course form
    const [assignCourseId, setAssignCourseId] = useState('');
    const [assignDeadline, setAssignDeadline] = useState('');

    // Add members form
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

    const fetchTenantCourses = useCallback(async () => {
        try {
            const res = await apiClient.get('/tenant/courses');
            setTenantCourses(res.data?.data || []);
        } catch { /* non-blocking */ }
    }, []);

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.get('/tenant/groups');
            setGroups(res.data?.data || []);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load groups.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchAllUsers = useCallback(async () => {
        try {
            const res = await apiClient.get('/tenant/users');
            setAllUsers(res.data?.data || []);
        } catch { /* non-blocking */ }
    }, []);

    useEffect(() => {
        fetchTenantCourses();
        fetchGroups();
        fetchAllUsers();
    }, [fetchTenantCourses, fetchGroups, fetchAllUsers]);

    const fetchMembers = async (groupId: string) => {
        setMembersLoading(true);
        try {
            const res = await apiClient.get(`/tenant/groups/${groupId}/members`);
            setMembers(res.data?.data || []);
        } catch { setMembers([]); }
        finally { setMembersLoading(false); }
    };

    const openModal = async (type: string, group: Group | null = null) => {
        setSelectedGroup(group);
        if (type === 'editGroup' && group) {
            setEditGroupName(group.name);
            setEditGroupDesc(group.description || '');
        }
        if ((type === 'manageMembers' || type === 'addMembers') && group) {
            await fetchMembers(group.group_id);
            setSelectedUserIds([]);
        }
        if (type === 'assignCourse') {
            setAssignCourseId('');
            setAssignDeadline('');
        }
        setActiveModal(type);
    };

    const closeModal = () => {
        setActiveModal(null);
        setSelectedGroup(null);
        setNewGroupName('');
        setNewGroupDesc('');
        setSelectedUserIds([]);
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) { alert('Group name is required.'); return; }
        setProcessing(true);
        try {
            await apiClient.post('/tenant/groups/create', { name: newGroupName.trim(), description: newGroupDesc.trim() || undefined });
            closeModal();
            await fetchGroups();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to create group.');
        } finally { setProcessing(false); }
    };

    const handleUpdateGroup = async () => {
        if (!selectedGroup) return;
        setProcessing(true);
        try {
            await apiClient.put(`/tenant/groups/update?group_id=${selectedGroup.group_id}`, {
                name: editGroupName.trim() || selectedGroup.name,
                description: editGroupDesc.trim() || undefined,
            });
            closeModal();
            await fetchGroups();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update group.');
        } finally { setProcessing(false); }
    };

    const handleDeleteGroup = async (group: Group) => {
        if (!confirm(`Delete group "${group.name}"? This cannot be undone.`)) return;
        try {
            await apiClient.delete(`/tenant/groups?group_id=${group.group_id}`);
            await fetchGroups();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete group.');
        }
    };

    const handleAddMembers = async () => {
        if (!selectedGroup || selectedUserIds.length === 0) { alert('Select at least one user.'); return; }
        setProcessing(true);
        try {
            await apiClient.post(`/tenant/groups/${selectedGroup.group_id}/members`, { user_ids: selectedUserIds });
            await fetchMembers(selectedGroup.group_id);
            await fetchGroups();
            setSelectedUserIds([]);
            alert('Members added successfully.');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to add members.');
        } finally { setProcessing(false); }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!selectedGroup) return;
        if (!confirm('Remove this member from the group?')) return;
        try {
            await apiClient.delete(`/tenant/groups/${selectedGroup.group_id}/members/${userId}`);
            await fetchMembers(selectedGroup.group_id);
            await fetchGroups();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to remove member.');
        }
    };

    const handleAssignCourse = async () => {
        if (!selectedGroup || !assignCourseId) { alert('Please select a course.'); return; }
        setProcessing(true);
        try {
            const res = await apiClient.post(`/tenant/groups/${selectedGroup.group_id}/assign-course`, {
                course_id: assignCourseId,
                deadline: assignDeadline || undefined,
            });
            closeModal();
            await fetchGroups();
            alert(res.data?.message || 'Course assigned successfully.');
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to assign course.');
        } finally { setProcessing(false); }
    };

    const handleRemoveCourse = async (groupId: string, courseId: string) => {
        if (!confirm('Remove this course from the group?')) return;
        try {
            await apiClient.delete(`/tenant/groups/${groupId}/courses/${courseId}`);
            await fetchGroups();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to remove course.');
        }
    };

    const memberUserIds = new Set(members.map((m) => m.user_id));
    const availableUsers = allUsers.filter((u) => !memberUserIds.has(u.user_id));

    return (
        <RoleLayout
            title="Group Management"
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
                        Organize employees into groups and assign training courses. All group members are automatically enrolled in assigned courses.
                    </p>
                    <button
                        onClick={() => openModal('createGroup')}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all whitespace-nowrap"
                    >
                        + Create Group
                    </button>
                </div>

                {/* Tenant Courses — assigned by Super Admin */}
                <div>
                    <h2 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Available Courses (assigned by Super Admin)</h2>
                    {tenantCourses.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 py-8 text-center text-slate-500 text-sm">
                            No courses assigned to your tenant yet. Contact your Super Admin.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {tenantCourses.map((c) => (
                                <div key={c.course_id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-slate-900 text-sm leading-tight">{c.title}</h3>
                                        <span className={`ml-2 shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.status === 'published' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                            {c.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2">{c.description || 'No description.'}</p>
                                    <div className="mt-3 flex justify-between text-xs text-slate-400">
                                        <span>{c.duration_minutes} min</span>
                                        {c.enrollment_stats && (
                                            <span>{c.enrollment_stats.total} enrolled · {c.enrollment_stats.completion_rate}% done</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Error */}
                {error && (
                    <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                        <span>⚠️</span> {error}
                        <button onClick={fetchGroups} className="ml-auto text-xs underline">Retry</button>
                    </div>
                )}

                {/* Groups Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                        <h2 className="font-semibold text-slate-900">Groups</h2>
                        <span className="text-xs text-slate-500">{groups.length} group{groups.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm whitespace-nowrap">
                            <thead className="bg-slate-50/50 border-b border-slate-200">
                                <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                                    <th className="px-6 py-4 text-left font-semibold">Group Name</th>
                                    <th className="px-6 py-4 text-left font-semibold">Description</th>
                                    <th className="px-6 py-4 text-left font-semibold">Members</th>
                                    <th className="px-6 py-4 text-left font-semibold">Courses Assigned</th>
                                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                                                Loading groups...
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {!loading && groups.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                                            No groups yet. Click &quot;Create Group&quot; to get started.
                                        </td>
                                    </tr>
                                )}
                                {!loading && groups.map((g) => (
                                    <tr key={g.group_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-3.5 font-semibold text-slate-900">{g.name}</td>
                                        <td className="px-6 py-3.5 text-slate-500 max-w-xs truncate">{g.description || '—'}</td>
                                        <td className="px-6 py-3.5">
                                            <span className="px-2.5 py-1 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xs font-semibold">
                                                {g.member_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <div className="flex flex-wrap gap-1">
                                                {g.courses.length === 0 ? (
                                                    <span className="text-slate-400 text-xs">No courses</span>
                                                ) : g.courses.map((c) => (
                                                    <div key={c.course_id} className="flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-md text-xs">
                                                        <span>{c.title?.slice(0, 20)}{(c.title?.length || 0) > 20 ? '…' : ''}</span>
                                                        <button
                                                            onClick={() => handleRemoveCourse(g.group_id, c.course_id)}
                                                            className="text-purple-400 hover:text-purple-700 ml-0.5"
                                                            title="Remove course"
                                                        >×</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3.5 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    onClick={() => openModal('manageMembers', g)}
                                                    className="px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded border border-blue-500/20 text-[10px] uppercase font-semibold transition-colors"
                                                >
                                                    Members
                                                </button>
                                                <button
                                                    onClick={() => openModal('assignCourse', g)}
                                                    className="px-2 py-1 bg-purple-600/10 hover:bg-purple-600/20 text-purple-600 rounded border border-purple-500/20 text-[10px] uppercase font-semibold transition-colors"
                                                >
                                                    Assign Course
                                                </button>
                                                <button
                                                    onClick={() => openModal('editGroup', g)}
                                                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 text-[10px] uppercase font-semibold transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteGroup(g)}
                                                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-500 rounded border border-red-200 text-[10px] uppercase font-semibold transition-colors"
                                                >
                                                    Delete
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

            {/* ── MODAL: Create Group ──────────────────────────────────────────── */}
            {activeModal === 'createGroup' && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">Create Group</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-900 text-2xl leading-none">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Group Name *</label>
                                <input
                                    type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)}
                                    placeholder="e.g. HR Group"
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description (optional)</label>
                                <textarea
                                    value={newGroupDesc} onChange={e => setNewGroupDesc(e.target.value)}
                                    placeholder="e.g. Human Resources department"
                                    rows={3}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500 resize-none"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
                            <button onClick={handleCreateGroup} disabled={processing} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg min-w-[120px] disabled:opacity-60">
                                {processing ? 'Creating...' : 'Create Group'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: Edit Group ────────────────────────────────────────────── */}
            {activeModal === 'editGroup' && selectedGroup && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">Edit Group</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-900 text-2xl leading-none">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Group Name</label>
                                <input
                                    type="text" value={editGroupName} onChange={e => setEditGroupName(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                                <textarea
                                    value={editGroupDesc} onChange={e => setEditGroupDesc(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500 resize-none"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
                            <button onClick={handleUpdateGroup} disabled={processing} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg min-w-[120px] disabled:opacity-60">
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: Manage Members ───────────────────────────────────────── */}
            {activeModal === 'manageMembers' && selectedGroup && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg">Manage Members: {selectedGroup.name}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{members.length} current member{members.length !== 1 ? 's' : ''}</p>
                            </div>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-900 text-2xl leading-none">×</button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Add users section */}
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase">Add Users</label>
                                {availableUsers.length === 0 ? (
                                    <p className="text-xs text-slate-400">All users are already in this group or no users available.</p>
                                ) : (
                                    <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100">
                                        {availableUsers.map((u) => (
                                            <label key={u.user_id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUserIds.includes(u.user_id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedUserIds(s => [...s, u.user_id]);
                                                        else setSelectedUserIds(s => s.filter(id => id !== u.user_id));
                                                    }}
                                                    className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                                />
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{u.name}</p>
                                                    <p className="text-xs text-slate-500">{u.email} · {u.department || 'Unassigned'}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                                {selectedUserIds.length > 0 && (
                                    <button
                                        onClick={handleAddMembers}
                                        disabled={processing}
                                        className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg disabled:opacity-60 transition-colors"
                                    >
                                        {processing ? 'Adding...' : `Add ${selectedUserIds.length} Selected User${selectedUserIds.length > 1 ? 's' : ''}`}
                                    </button>
                                )}
                            </div>

                            {/* Current members */}
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase">Current Members</label>
                                {membersLoading ? (
                                    <p className="text-xs text-slate-400">Loading...</p>
                                ) : members.length === 0 ? (
                                    <p className="text-xs text-slate-400">No members in this group yet.</p>
                                ) : (
                                    <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                                        {members.map((m) => (
                                            <div key={m.member_id} className="flex items-center justify-between px-4 py-2.5">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{m.name}</p>
                                                    <p className="text-xs text-slate-500">{m.email} · {m.department || 'Unassigned'}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveMember(m.user_id)}
                                                    className="text-xs px-2 py-1 bg-red-50 hover:bg-red-100 text-red-500 rounded border border-red-200 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
                            <button onClick={closeModal} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MODAL: Assign Course to Group ───────────────────────────────── */}
            {activeModal === 'assignCourse' && selectedGroup && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-lg">Assign Course to Group</h3>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-900 text-2xl leading-none">×</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Assigning a course to <strong>{selectedGroup.name}</strong> will auto-enroll all {selectedGroup.member_count} current members.
                            </p>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Select Course *</label>
                                {tenantCourses.length === 0 ? (
                                    <p className="text-xs text-red-500">No courses available. Ask your Super Admin to assign courses to your tenant first.</p>
                                ) : (
                                    <select
                                        value={assignCourseId}
                                        onChange={e => setAssignCourseId(e.target.value)}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                                    >
                                        <option value="">-- Choose a Course --</option>
                                        {tenantCourses
                                            .filter(c => !selectedGroup.courses.some(gc => gc.course_id === c.course_id))
                                            .map(c => (
                                                <option key={c.course_id} value={c.course_id}>{c.title}</option>
                                            ))
                                        }
                                    </select>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Deadline (optional)</label>
                                <input
                                    type="date" value={assignDeadline} onChange={e => setAssignDeadline(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
                            <button
                                onClick={handleAssignCourse}
                                disabled={processing || !assignCourseId}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg min-w-[140px] disabled:opacity-50"
                            >
                                {processing ? 'Assigning...' : 'Assign Course'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </RoleLayout>
    );
}
