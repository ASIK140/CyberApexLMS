'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { apiClient } from '@/utils/api';

export default function TenantDetailsPage() {
    const params = useParams();
    const id = params?.id as string;
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);
    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState<any[]>([]);
    const [isAssignCourseModalOpen, setIsAssignCourseModalOpen] = useState(false);
    const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
    const [isCourseDropdownOpen, setIsCourseDropdownOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [recentLogs, setRecentLogs] = useState<any[]>([]);

    const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>([]);

    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMessage, setResetMessage] = useState({ type: '', text: '' });

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            setResetMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
            return;
        }

        setResetLoading(true);
        setResetMessage({ type: '', text: '' });

        try {
            const { data } = await apiClient.post(`/admin/tenants/${id}/reset-password`, { newPassword });
            if (data.success) {
                setResetMessage({ type: 'success', text: data.message });
                setNewPassword('');
                setTimeout(() => {
                    setIsResetPasswordModalOpen(false);
                    setResetMessage({ type: '', text: '' });
                }, 2000);
            } else {
                setResetMessage({ type: 'error', text: data.message || 'Failed to reset password.' });
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'An unexpected error occurred.';
            setResetMessage({ type: 'error', text: msg });
        } finally {
            setResetLoading(false);
        }
    };

    const openAuditModal = async () => {
        setIsAuditModalOpen(true);
        setAuditLoading(true);
        try {
            const { apiFetch } = await import('@/utils/api');
            const res = await apiFetch(`/admin/audit-log?tenant_id=${tenant?.tenant_id || tenant?.id || ''}`);
            const json = await res.json();
            if (json.success) setAuditLogs(json.data);
        } catch (err) { console.error(err); } finally { setAuditLoading(false); }
    };

    const handleExportAudit = async () => {
        try {
            const { apiFetch } = await import('@/utils/api');
            const res = await apiFetch(`/admin/audit-log/export?format=csv&tenant_id=${tenant?.tenant_id || tenant?.id || ''}`);
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tenant_audit_log_${tenant?.tenant_id || 'export'}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const { apiFetch } = await import('@/utils/api');
                const [resTenant, resCourses, resTenantCourses, resLogs] = await Promise.all([
                    apiFetch(`/admin/tenants/${id}`),
                    apiFetch('/admin/content-library'),
                    apiFetch(`/admin/tenants/${id}/courses`),
                    apiFetch(`/admin/audit-log?tenant_id=${id}`)
                ]);
                const jsonTenant = await resTenant.json();
                const jsonCourses = await resCourses.json();
                const jsonTenantCourses = await resTenantCourses.json();
                const jsonLogs = await resLogs.json();

                if (jsonLogs.success) {
                    setRecentLogs(jsonLogs.data.slice(0, 5));
                }
                if (jsonTenant.success) {
                    setTenant(jsonTenant.data);
                }
                if (jsonCourses.success) {
                    setCourses(jsonCourses.data);
                }
                if (jsonTenantCourses.success) {
                    const ids = (jsonTenantCourses.data || []).map((a: any) => a.course_id);
                    setAssignedCourseIds(ids);
                    setSelectedCourses(ids);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <SuperAdminLayout title="Tenant Details">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                </div>
            </SuperAdminLayout>
        );
    }

    if (!tenant) {
        return (
            <SuperAdminLayout title="Tenant Details">
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <p className="text-slate-500">Tenant not found or an error occurred.</p>
                    <Link href="/admin/tenants">
                        <button className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg transition-colors">
                            Back to Tenants
                        </button>
                    </Link>
                </div>
            </SuperAdminLayout>
        );
    }

    const usagePercent = Math.min(100, Math.round((tenant.seat_count / (tenant.user_limit || 1)) * 100));

    return (
        <SuperAdminLayout title="Tenant Details">
            <div className="flex flex-col gap-6">

                {/* Header Actions */}
                <div className="flex items-center justify-between -mt-2">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/tenants">
                            <button className="p-2 text-slate-600 hover:text-slate-900 bg-white shadow-sm border border-slate-300 hover:border-neutral-500 rounded-lg transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </button>
                        </Link>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                {tenant.organization_name}
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${tenant.status === 'active' ? 'text-green-600 bg-green-100 border border-green-200' : 'text-orange-600 bg-orange-100 border border-orange-200'}`}>
                                    {tenant.status}
                                </span>
                            </h2>
                            <p className="text-xs text-slate-600">ID: {tenant.tenant_id} • {tenant.plan_type} Plan • Industry: {tenant.industry || 'N/A'}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg border border-slate-300 transition-colors">
                            Edit Details
                        </button>
                        <button onClick={() => { setSelectedCourses([...assignedCourseIds]); setIsAssignCourseModalOpen(true); }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg border border-slate-300 transition-colors">
                            Assign Course
                        </button>
                        <button onClick={() => setIsResetPasswordModalOpen(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg border border-slate-300 transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                            Reset Password
                        </button>
                        <button onClick={() => setIsImpersonateModalOpen(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg border border-slate-300 transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Impersonate Admin
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Quick Stats & Info */}
                    <div className="flex flex-col gap-6">

                        {/* Usage Card */}
                        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4">License Usage</h3>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-2xl font-bold text-slate-900">{tenant.seat_count} <span className="text-sm font-normal text-slate-500">/ {tenant.user_limit} seats</span></span>
                                <span className="text-sm font-bold text-blue-500">{usagePercent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 mb-4 border border-slate-200 hidden overflow-hidden sm:block">
                                <div className={`h-full rounded-full ${usagePercent > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${usagePercent}%` }}></div>
                            </div>

                            <div className="space-y-3 mt-6 border-t border-slate-200 pt-4">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">Monthly Revenue</span>
                                    <span className="text-slate-900 font-medium">${parseFloat(tenant.monthly_revenue).toFixed(2)}</span>
                                </div>

                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-600">Created At</span>
                                    <span className="text-slate-900 font-medium">{new Date(tenant.createdAt || tenant.created_at || Date.now()).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact Card */}
                        <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4">Primary Contact</h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold border border-slate-300 uppercase text-slate-600">
                                    {tenant.organization_name?.substring(0, 2)}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-slate-900">{tenant.admin_email.split('@')[0]}</p>
                                    <p className="text-xs text-slate-600">Tenant Admin</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-2 text-slate-700">
                                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    {tenant.admin_email}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Activity, Billing & Settings */}
                    <div className="lg:col-span-2 flex flex-col gap-6">

                        {/* Assigned Courses */}
                        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-200 bg-white shadow-sm/50 flex items-center justify-between">
                                <h3 className="font-bold text-slate-900">Assigned Courses</h3>
                                <span className="text-xs text-slate-500 font-medium">
                                    {assignedCourseIds.length} Total
                                </span>
                            </div>
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {assignedCourseIds.length === 0 ? (
                                    <div className="text-sm text-slate-500 col-span-2">No courses currently assigned to this tenant.</div>
                                ) : assignedCourseIds.map((courseId: string, i: number) => {
                                    const c = courses.find(course => course.course_id === courseId);
                                    const title = c ? c.course_title : `Course ID: ${courseId}`;
                                    return (
                                        <div key={i} className="group relative flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                                                <span className="text-sm font-medium text-slate-800 line-clamp-2 pr-6" title={title}>{title}</span>
                                            </div>
                                            <button
                                                onClick={() => setCourseToDelete(courseId)}
                                                className="absolute right-3 opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                                title="Remove course"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Recent Activity Log */}
                        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden flex-1">
                            <div className="px-5 py-4 border-b border-slate-200 bg-white shadow-sm/50 flex items-center justify-between">
                                <h3 className="font-bold text-slate-900">Recent Tenant Activity</h3>
                                <button onClick={openAuditModal} className="text-xs text-red-600 hover:underline">View Full Audit Log</button>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {recentLogs.length === 0 ? (
                                    <div className="p-5 text-sm text-center text-slate-500">No recent activity.</div>
                                ) : recentLogs.map((log, i) => (
                                    <div key={log.log_id || i} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-sm shrink-0 font-bold text-slate-500">
                                            {(log.actor_name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{log.action}</p>
                                            <p className="text-xs text-slate-500 mt-1">{log.actor_name || 'System'} • {new Date(log.timestamp).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            {/* Edit Details Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm/50">
                            <h3 className="font-bold text-lg text-slate-900">Edit Tenant Details</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Organization Name *</label>
                                <input type="text" defaultValue={tenant.organization_name} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Industry</label>
                                    <input type="text" defaultValue={tenant.industry} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Contact Email *</label>
                                    <input type="email" defaultValue={tenant.admin_email} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 bg-white shadow-sm/50 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                                Save Details
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Impersonate Admin Modal */}
            {isImpersonateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-100">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </div>
                            <h3 className="font-bold text-xl text-slate-900">Impersonate Tenant Admin?</h3>
                            <p className="text-sm text-slate-600">
                                You are about to log in as the Tenant Admin for <strong className="text-slate-800">{tenant.organization_name}</strong>. All actions taken during this session will be logged in the centralized audit trail under your Super Admin credentials.
                            </p>

                            <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-left">
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Reason for Impersonation (Required for Audit)</label>
                                <textarea rows={2} className="w-full px-3 py-2 bg-white shadow-sm border border-slate-200 rounded-md text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors" placeholder="e.g. Assisting with setup..."></textarea>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 bg-white shadow-sm/50 flex justify-end gap-3">
                            <button onClick={() => setIsImpersonateModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                                Cancel
                            </button>
                            <Link href="/tenant-admin">
                                <button onClick={() => setIsImpersonateModalOpen(false)} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
                                    Begin Session
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
            {/* Assign Course Modal */}
            {isAssignCourseModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm/50">
                            <h3 className="font-bold text-lg text-slate-900">Assign Courses</h3>
                            <button onClick={() => setIsAssignCourseModalOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-4 min-h-[300px]">
                            <div className="flex flex-col relative">
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">Select Courses to Assign</label>
                                <div 
                                    className="w-full min-h-[42px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 transition-all cursor-pointer flex flex-wrap gap-1.5 items-center"
                                    onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                                >
                                    {selectedCourses.length === 0 ? (
                                        <span className="text-slate-400">Select courses...</span>
                                    ) : (
                                        selectedCourses.map(cid => {
                                            const course = courses.find(c => c.course_id === cid);
                                            const title = course?.course_title || 'Unknown Course';
                                            return (
                                                <span key={cid} className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-md border border-red-200">
                                                    {title.substring(0, 20)}{title.length > 20 ? '...' : ''}
                                                    <button 
                                                        className="hover:text-red-900 ml-1 w-4 h-4 rounded-full hover:bg-red-200 flex items-center justify-center transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedCourses(selectedCourses.filter(id => id !== cid));
                                                        }}
                                                    >
                                                        &times;
                                                    </button>
                                                </span>
                                            );
                                        })
                                    )}
                                </div>

                                {isCourseDropdownOpen && (
                                    <div className="mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-sm max-h-48 overflow-y-auto animate-in fade-in duration-200 custom-scrollbar">
                                        <div className="p-1 space-y-0.5">
                                            {courses.map((course: any) => {
                                                const isSelected = selectedCourses.includes(course.course_id);
                                                return (
                                                    <div 
                                                        key={course.course_id}
                                                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-red-50 text-red-700' : 'hover:bg-slate-50 text-slate-700'}`}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedCourses(selectedCourses.filter(id => id !== course.course_id));
                                                            } else {
                                                                setSelectedCourses([...selectedCourses, course.course_id]);
                                                            }
                                                        }}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-red-500 border-red-500' : 'border-slate-300'}`}>
                                                            {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                        </div>
                                                        <span className="text-xs font-medium leading-tight select-none flex-1">{course.course_title}</span>
                                                    </div>
                                                );
                                            })}
                                            {courses.length === 0 && <div className="p-3 text-xs text-center text-slate-500">No courses found</div>}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 bg-white shadow-sm/50 flex justify-end gap-3">
                            <button onClick={() => setIsAssignCourseModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const { apiFetch } = await import('@/utils/api');
                                        const toAdd    = selectedCourses.filter(cid => !assignedCourseIds.includes(cid));
                                        const toRemove = assignedCourseIds.filter(cid => !selectedCourses.includes(cid));
                                        await Promise.all([
                                            ...toAdd.map(cid => apiFetch(`/admin/tenants/${id}/courses`, {
                                                method: 'POST',
                                                body: JSON.stringify({ course_id: cid }),
                                            })),
                                            ...toRemove.map(cid => apiFetch(`/admin/tenants/${id}/courses/${cid}`, {
                                                method: 'DELETE',
                                            })),
                                        ]);
                                        setAssignedCourseIds(selectedCourses);
                                        setIsAssignCourseModalOpen(false);
                                    } catch (err) { console.error(err); }
                                }}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                            >
                                Save Assignments
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Delete Course Confirmation Modal */}
            {courseToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-100">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </div>
                            <h3 className="font-bold text-xl text-slate-900">Remove Course?</h3>
                            <p className="text-sm text-slate-600">
                                Are you sure you want to unassign this course from the tenant? Users will immediately lose access to it.
                            </p>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setCourseToDelete(null)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!courseToDelete) return;
                                    try {
                                        const { apiFetch } = await import('@/utils/api');
                                        await apiFetch(`/admin/tenants/${id}/courses/${courseToDelete}`, { method: 'DELETE' });
                                        setAssignedCourseIds(prev => prev.filter(cid => cid !== courseToDelete));
                                        setSelectedCourses(prev => prev.filter(cid => cid !== courseToDelete));
                                        setCourseToDelete(null);
                                    } catch (err) { console.error(err); }
                                }}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                            >
                                Remove Course
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Full Audit Log Modal */}
            {isAuditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm/50">
                            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Full Audit Log
                            </h3>
                            <div className="flex items-center gap-3">
                                <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded border border-slate-300 transition-colors flex items-center gap-1.5" onClick={handleExportAudit}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Export Report
                                </button>
                                <button onClick={() => setIsAuditModalOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Timestamp</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">IP Address</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {auditLoading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                                                    Loading logs...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : auditLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">No audit logs found for this tenant.</td>
                                        </tr>
                                    ) : auditLogs.map((log, i) => (
                                        <tr key={log.log_id || i} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{log.action}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                        {(log.actor_name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                    {log.actor_name || 'System'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-400">{log.ip_address || 'N/A'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 bg-white shadow-sm/50 flex justify-between items-center">
                            <span className="text-xs text-slate-500">Showing {auditLogs.length} logs</span>
                            <button onClick={() => setIsAuditModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Reset Password Modal */}
            {isResetPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm/50">
                            <h3 className="font-bold text-lg text-slate-900">Reset Tenant Admin Password</h3>
                            <button onClick={() => { setIsResetPasswordModalOpen(false); setResetMessage({ type: '', text: '' }); }} className="text-slate-500 hover:text-slate-900 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Enter a new password for the admin user of <strong className="text-slate-800">{tenant.organization_name}</strong>.
                            </p>
                            
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">New Password</label>
                                <input 
                                    type="password" 
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimum 8 characters"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors" 
                                />
                            </div>

                            {resetMessage.text && (
                                <div className={`p-3 rounded-lg text-xs font-medium ${resetMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                                    {resetMessage.text}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 bg-white shadow-sm/50 flex justify-end gap-3">
                            <button 
                                onClick={() => { setIsResetPasswordModalOpen(false); setResetMessage({ type: '', text: '' }); }} 
                                className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors disabled:opacity-50"
                                disabled={resetLoading}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleResetPassword} 
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50"
                                disabled={resetLoading}
                            >
                                {resetLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                        Resetting...
                                    </>
                                ) : 'Reset Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}
