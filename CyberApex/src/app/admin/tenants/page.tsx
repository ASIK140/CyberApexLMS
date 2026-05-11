'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { apiClient } from '@/utils/api';

const riskBadge   = (r: string) => ({ Low: 'text-green-500 bg-green-50 border-green-200', Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200', High: 'text-red-500 bg-red-50 border-red-200' }[r] ?? 'text-slate-500 bg-slate-100 border-slate-200');
const statusBadge = (s: string) => ({ Active: 'text-green-600 bg-green-50 border-green-200', Trial: 'text-blue-600 bg-blue-50 border-blue-200', Suspended: 'text-orange-600 bg-orange-50 border-orange-200', Inactive: 'text-slate-500 bg-slate-100 border-slate-200' }[s] ?? 'text-slate-500 bg-slate-100 border-slate-200');
const planBadge   = (p: string) => ({ Enterprise: 'text-purple-600 bg-purple-50 border-purple-200', Professional: 'text-blue-600 bg-blue-50 border-blue-200', Business: 'text-blue-600 bg-blue-50 border-blue-200', Starter: 'text-slate-600 bg-slate-100 border-slate-200', Trial: 'text-orange-500 bg-orange-50 border-orange-200' }[p] ?? 'text-slate-600 bg-slate-100 border-slate-200');

interface TenantRow {
    id: string; name: string; plan: string; seats: string;
    health: number; risk: string; status: string; contact: string;
    revenue: string; since: string;
}

function mapTenant(t: any): TenantRow {
    const statusMap: Record<string, string> = { active: 'Active', trial: 'Trial', suspended: 'Suspended', inactive: 'Inactive' };
    const revenueMap: Record<string, string> = { Enterprise: '$4,200/mo', Professional: '$1,800/mo', Business: '$1,800/mo', Starter: '$299/mo', Trial: 'Trial' };
    const healthMap:  Record<string, number> = { Enterprise: 94, Professional: 82, Business: 78, Starter: 88, Trial: 70 };
    return {
        id:      t.tenant_id,
        name:    t.organization_name,
        plan:    t.plan_type,
        seats:   `${t.seat_count}/${t.user_limit === 9999 ? '∞' : t.user_limit}`,
        health:  healthMap[t.plan_type] ?? 85,
        risk:    t.seat_count / (t.user_limit || 1) > 0.9 ? 'High' : 'Low',
        status:  statusMap[t.status] ?? t.status,
        contact: t.admin_email,
        revenue: revenueMap[t.plan_type] ?? 'Trial',
        since:   t.created_at ? new Date(t.created_at).toLocaleDateString('en-GB') : '—',
    };
}

export default function AllTenantsPage() {
    const [tenants,  setTenants]  = useState<TenantRow[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState<string | null>(null);
    const [search,   setSearch]   = useState('');
    const [planFilter,   setPlanFilter]   = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // Add-Tenant modal state
    const [showAdd,        setShowAdd]        = useState(false);
    const [addLoading,     setAddLoading]     = useState(false);
    const [addError,       setAddError]       = useState('');
    const [form, setForm] = useState({ orgName: '', adminName: '', adminEmail: '', password: '', seats: '100' });

    // Courses for assignment
    const [courses,        setCourses]        = useState<any[]>([]);
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [courseSearch,   setCourseSearch]   = useState('');
    const [courseDropdown, setCourseDropdown] = useState(false);

    // Edit / Suspend modals
    const [editTenant,    setEditTenant]    = useState<TenantRow | null>(null);
    const [suspendTenant, setSuspendTenant] = useState<TenantRow | null>(null);

    // Assign Courses modal (per tenant)
    const [assignTenant,      setAssignTenant]      = useState<TenantRow | null>(null);
    const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>([]);
    const [assignSaving,      setAssignSaving]      = useState(false);
    const [assignSearch,      setAssignSearch]      = useState('');
    const [allPlatformCourses, setAllPlatformCourses] = useState<any[]>([]);

    const fetchTenants = async () => {
        setLoading(true); setError(null);
        try {
            const { data } = await apiClient.get('/admin/tenants');
            if (data.success) setTenants(data.data.map(mapTenant));
            else setError(data.message ?? 'Failed to load tenants');
        } catch (e: any) {
            setError(e?.response?.data?.message ?? 'Network error');
        } finally { setLoading(false); }
    };

    const fetchCourses = async () => {
        try {
            const { data } = await apiClient.get('/admin/content-library');
            if (data.success) setCourses(data.data);
        } catch { /* non-fatal */ }
    };

    const fetchAllPlatformCourses = async () => {
        try {
            const { data } = await apiClient.get('/v1/courses');
            if (data.success) setAllPlatformCourses(data.data || []);
        } catch { /* non-fatal */ }
    };

    const openAssignCourses = async (tenant: TenantRow) => {
        setAssignTenant(tenant);
        setAssignedCourseIds([]);
        setAssignSearch('');
        // Load all platform courses + already-assigned ones in parallel
        await fetchAllPlatformCourses();
        try {
            const { data } = await apiClient.get(`/admin/tenants/${tenant.id}/courses`);
            if (data.success) setAssignedCourseIds((data.data || []).map((a: any) => a.course_id));
        } catch { /* non-fatal */ }
    };

    const handleToggleCourseForTenant = async (courseId: string, currentlyAssigned: boolean) => {
        if (!assignTenant) return;
        setAssignSaving(true);
        try {
            if (currentlyAssigned) {
                await apiClient.delete(`/admin/tenants/${assignTenant.id}/courses/${courseId}`);
                setAssignedCourseIds(ids => ids.filter(id => id !== courseId));
            } else {
                await apiClient.post(`/admin/tenants/${assignTenant.id}/courses`, { course_id: courseId });
                setAssignedCourseIds(ids => [...ids, courseId]);
            }
        } catch (e: any) {
            alert(e?.response?.data?.message ?? 'Operation failed.');
        } finally { setAssignSaving(false); }
    };

    useEffect(() => { fetchTenants(); fetchCourses(); }, []);

    const filtered = tenants.filter(t => {
        const q = search.toLowerCase();
        const matchSearch = !q || t.name.toLowerCase().includes(q) || t.contact.toLowerCase().includes(q);
        const matchPlan   = planFilter   === 'All' || t.plan   === planFilter;
        const matchStatus = statusFilter === 'All' || t.status === statusFilter;
        return matchSearch && matchPlan && matchStatus;
    });

    const handleCreate = async () => {
        if (!form.orgName || !form.adminName || !form.adminEmail || !form.password) {
            setAddError('Please fill all required fields.'); return;
        }
        if (form.password.length < 8) { setAddError('Password must be at least 8 characters.'); return; }
        setAddLoading(true); setAddError('');
        try {
            const { data } = await apiClient.post('/admin/tenants', {
                organization_name: form.orgName,
                admin_name:        form.adminName,
                admin_email:       form.adminEmail,
                admin_password:    form.password,
                user_limit:        parseInt(form.seats) || 100,
                assigned_courses:  selectedCourses,
            });
            if (data.success) {
                setShowAdd(false); setForm({ orgName: '', adminName: '', adminEmail: '', password: '', seats: '100' });
                setSelectedCourses([]); fetchTenants();
            } else { setAddError(data.message ?? 'Failed to create tenant.'); }
        } catch (e: any) {
            setAddError(e?.response?.data?.message ?? 'Failed to create tenant.');
        } finally { setAddLoading(false); }
    };

    const handleSuspend = async () => {
        if (!suspendTenant) return;
        try {
            await apiClient.patch(`/admin/tenants/${suspendTenant.id}/status`, { status: 'suspended' });
            setSuspendTenant(null); fetchTenants();
        } catch (e: any) {
            alert(e?.response?.data?.message ?? 'Failed to suspend tenant.');
        }
    };

    const filteredCourses = courses.filter(c => c.course_title?.toLowerCase().includes(courseSearch.toLowerCase()));

    return (
        <SuperAdminLayout title="All Tenants">
            <div className="flex flex-col gap-6">

                {/* Summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Tenants',    value: tenants.length },
                        { label: 'Enterprise',       value: tenants.filter(t => t.plan === 'Enterprise').length },
                        { label: 'Professional',     value: tenants.filter(t => t.plan === 'Professional' || t.plan === 'Business').length },
                        { label: 'Starter / Trial',  value: tenants.filter(t => t.plan === 'Starter' || t.plan === 'Trial').length },
                    ].map(s => (
                        <div key={s.label} className="p-4 rounded-xl bg-white shadow-sm border border-slate-200">
                            <p className="text-xs text-slate-500">{s.label}</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters + Add */}
                <div className="flex flex-wrap items-center gap-3">
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or contact…"
                        className="flex-1 min-w-56 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:border-red-500 focus:outline-none"
                    />
                    <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none">
                        {['All', 'Enterprise', 'Professional', 'Starter', 'Trial'].map(o => <option key={o}>{o}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none">
                        {['All', 'Active', 'Trial', 'Suspended', 'Inactive'].map(o => <option key={o}>{o}</option>)}
                    </select>
                    <button onClick={() => { setShowAdd(true); setAddError(''); }} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                        + Add Tenant
                    </button>
                </div>

                {/* Error / Loading */}
                {error   && <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
                {loading && <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-slate-200 border-t-red-500 rounded-full animate-spin" /></div>}

                {/* Table */}
                {!loading && (
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-x-auto">
                        <table className="w-full text-sm min-w-[920px]">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="text-left px-5 py-3 w-32">Tenant ID</th>
                                    <th className="text-left px-5 py-3">Tenant Name</th>
                                    <th className="text-left px-5 py-3 w-32">Plan</th>
                                    <th className="text-left px-5 py-3 w-36">Seat Usage</th>
                                    <th className="text-left px-5 py-3 w-20">Health</th>
                                    <th className="text-left px-5 py-3 w-24">Risk</th>
                                    <th className="text-left px-5 py-3 w-28">Status</th>
                                    <th className="text-left px-5 py-3 w-28">Revenue</th>
                                    <th className="text-left px-5 py-3 w-28">Since</th>
                                    <th className="text-left px-5 py-3 w-28">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filtered.length === 0 && (
                                    <tr><td colSpan={10} className="text-center py-12 text-slate-400">No tenants found.</td></tr>
                                )}
                                {filtered.map(t => {
                                    const [used, max] = t.seats.split('/');
                                    const pct = max === '∞' ? 0 : Math.min(100, (parseInt(used) / parseInt(max)) * 100);
                                    return (
                                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-3.5 font-mono text-xs text-slate-400 truncate max-w-[8rem]" title={t.id}>{t.id.slice(0, 8)}…</td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-semibold text-slate-900">{t.name}</p>
                                                <p className="text-xs text-slate-500 mt-0.5">{t.contact}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${planBadge(t.plan)}`}>{t.plan}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${pct > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                                                    </div>
                                                    <span className="text-xs text-slate-600 whitespace-nowrap">{t.seats}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`font-bold ${t.health >= 85 ? 'text-green-500' : t.health >= 65 ? 'text-yellow-500' : 'text-red-500'}`}>{t.health}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${riskBadge(t.risk)}`}>{t.risk}</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge(t.status)}`}>{t.status}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-green-600 font-medium text-xs whitespace-nowrap">{t.revenue}</td>
                                            <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap">{t.since}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex gap-1.5 relative">
                                                    <Link href={`/admin/tenants/${t.id}`}>
                                                        <button className="text-xs px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors">View</button>
                                                    </Link>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setActiveDropdown(activeDropdown === t.id ? null : t.id); }}
                                                        className="text-xs px-3 py-1.5 rounded-md bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 border border-slate-300 hover:border-red-300 transition-colors"
                                                    >•••</button>
                                                    {activeDropdown === t.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)} />
                                                            <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl z-20 overflow-hidden">
                                                                <button onClick={() => { setEditTenant(t); setActiveDropdown(null); }} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50">Edit Tenant</button>
                                                                <div className="border-t border-slate-100" />
                                                                <button onClick={() => { openAssignCourses(t); setActiveDropdown(null); }} className="w-full text-left px-4 py-2.5 text-xs text-blue-600 hover:bg-blue-50">Assign Courses</button>
                                                                <div className="border-t border-slate-100" />
                                                                <button onClick={() => { setSuspendTenant(t); setActiveDropdown(null); }} className="w-full text-left px-4 py-2.5 text-xs text-orange-500 hover:bg-orange-50">Suspend Tenant</button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Add Tenant Modal ────────────────────────────────────────────── */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Add New Tenant</h3>
                            <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-700 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4 overflow-y-auto">
                            {addError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{addError}</div>}

                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Organization Name *</label>
                                <input value={form.orgName} onChange={e => setForm(f => ({ ...f, orgName: e.target.value }))} placeholder="e.g. Acme Corporation" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Admin Full Name *</label>
                                    <input value={form.adminName} onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))} placeholder="John Doe" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Admin Email *</label>
                                    <input type="email" value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} placeholder="admin@org.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Admin Password *</label>
                                    <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Seat Allocation</label>
                                    <input type="number" value={form.seats} onChange={e => setForm(f => ({ ...f, seats: e.target.value }))} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" />
                                </div>
                            </div>

                            {/* Course picker */}
                            <div className="relative">
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Assign Courses</label>
                                <div onClick={() => setCourseDropdown(v => !v)} className="w-full min-h-[42px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm cursor-pointer flex flex-wrap gap-1.5 items-center focus-within:border-red-500">
                                    {selectedCourses.length === 0
                                        ? <span className="text-slate-400 text-xs">Select courses…</span>
                                        : selectedCourses.map(id => {
                                            const c = courses.find(x => x.course_id === id);
                                            return (
                                                <span key={id} className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-md border border-red-200">
                                                    {(c?.course_title ?? id).slice(0, 22)}
                                                    <button onClick={e => { e.stopPropagation(); setSelectedCourses(s => s.filter(x => x !== id)); }} className="ml-1 hover:text-red-900">×</button>
                                                </span>
                                            );
                                        })
                                    }
                                </div>
                                {courseDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => { setCourseDropdown(false); setCourseSearch(''); }} />
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-20">
                                            <div className="p-2 border-b border-slate-100">
                                                <input autoFocus value={courseSearch} onChange={e => setCourseSearch(e.target.value)} onClick={e => e.stopPropagation()} placeholder="Search courses…" className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:outline-none" />
                                            </div>
                                            <div className="max-h-40 overflow-y-auto p-1">
                                                {filteredCourses.length === 0
                                                    ? <p className="text-center text-xs text-slate-400 py-4">{courseSearch ? 'No matches' : 'No courses available'}</p>
                                                    : filteredCourses.map(c => {
                                                        const sel = selectedCourses.includes(c.course_id);
                                                        return (
                                                            <div key={c.course_id} onClick={e => { e.stopPropagation(); setSelectedCourses(s => sel ? s.filter(x => x !== c.course_id) : [...s, c.course_id]); }} className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer text-xs ${sel ? 'bg-red-50 text-red-700' : 'hover:bg-slate-50 text-slate-700'}`}>
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${sel ? 'bg-red-500 border-red-500' : 'border-slate-300'}`}>
                                                                    {sel && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                                </div>
                                                                <span className="truncate">{c.course_title}</span>
                                                            </div>
                                                        );
                                                    })
                                                }
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={addLoading} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                                {addLoading ? 'Creating…' : 'Create Tenant'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Edit Tenant Modal ───────────────────────────────────────────── */}
            {editTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-900">Edit {editTenant.name}</h3>
                            <button onClick={() => setEditTenant(null)} className="text-slate-400 hover:text-slate-700"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Organization Name</label>
                                <input defaultValue={editTenant.name} id="edit-org-name" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Subscription Plan</label>
                                    <select id="edit-plan" defaultValue={editTenant.plan} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none appearance-none">
                                        {['Enterprise', 'Professional', 'Starter', 'Trial'].map(p => <option key={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Seat Allocation</label>
                                    <input type="number" id="edit-seats" defaultValue={parseInt(editTenant.seats.split('/')[1]) || 100} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500" />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setEditTenant(null)} className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
                            <button onClick={async () => {
                                const name  = (document.getElementById('edit-org-name') as HTMLInputElement)?.value;
                                const plan  = (document.getElementById('edit-plan')     as HTMLSelectElement)?.value;
                                const seats = (document.getElementById('edit-seats')    as HTMLInputElement)?.value;
                                try {
                                    await apiClient.put(`/admin/tenants/${editTenant.id}`, { organization_name: name, plan_type: plan, user_limit: parseInt(seats) });
                                    setEditTenant(null); fetchTenants();
                                } catch (e: any) { alert(e?.response?.data?.message ?? 'Update failed.'); }
                            }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assign Courses Modal ────────────────────────────────────────── */}
            {assignTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">Assign Courses — {assignTenant.name}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{assignedCourseIds.length} course{assignedCourseIds.length !== 1 ? 's' : ''} currently assigned</p>
                            </div>
                            <button onClick={() => setAssignTenant(null)} className="text-slate-400 hover:text-slate-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-4 border-b border-slate-100">
                            <input
                                value={assignSearch}
                                onChange={e => setAssignSearch(e.target.value)}
                                placeholder="Search courses…"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-red-500"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                            {allPlatformCourses.length === 0 ? (
                                <p className="text-center text-sm text-slate-400 py-10">No courses available on the platform.</p>
                            ) : (
                                allPlatformCourses
                                    .filter(c => !assignSearch || (c.title ?? c.course_title ?? '').toLowerCase().includes(assignSearch.toLowerCase()))
                                    .map(c => {
                                        const courseId = c.id ?? c.course_id;
                                        const title = c.title ?? c.course_title ?? courseId;
                                        const isAssigned = assignedCourseIds.includes(courseId);
                                        return (
                                            <div key={courseId} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{title}</p>
                                                    <p className="text-xs text-slate-500">{c.status ?? ''} {c.duration_minutes ? `· ${c.duration_minutes} min` : ''}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleCourseForTenant(courseId, isAssigned)}
                                                    disabled={assignSaving}
                                                    className={`shrink-0 ml-4 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50 ${
                                                        isAssigned
                                                            ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                            : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                                    }`}
                                                >
                                                    {isAssigned ? 'Remove' : 'Assign'}
                                                </button>
                                            </div>
                                        );
                                    })
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
                            <button onClick={() => setAssignTenant(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Suspend Tenant Modal ────────────────────────────────────────── */}
            {suspendTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto border border-red-200">
                                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="font-bold text-xl text-slate-900">Suspend {suspendTenant.name}?</h3>
                            <p className="text-sm text-slate-600">This will immediately revoke access for all users in this tenant.</p>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => setSuspendTenant(null)} className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900">Cancel</button>
                            <button onClick={handleSuspend} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors">Confirm Suspension</button>
                        </div>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}
