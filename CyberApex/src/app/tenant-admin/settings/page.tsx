'use client';
import { useState, useEffect } from 'react';
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

export default function TenantSettingsPage() {
    const user = useAuthStore((s) => s.user);

    const [dashData, setDashData] = useState<any>(null);
    const [loading, setLoading]   = useState(true);

    // Password change state
    const [currentPw, setCurrentPw]   = useState('');
    const [newPw, setNewPw]           = useState('');
    const [confirmPw, setConfirmPw]   = useState('');
    const [pwSaving, setPwSaving]     = useState(false);
    const [pwMsg, setPwMsg]           = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        apiClient.get('/tenant/dashboard')
            .then(res => setDashData(res.data?.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleChangePassword = async () => {
        if (!currentPw || !newPw || !confirmPw) {
            setPwMsg({ type: 'error', text: 'All password fields are required.' });
            return;
        }
        if (newPw.length < 8) {
            setPwMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
            return;
        }
        if (newPw !== confirmPw) {
            setPwMsg({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        setPwSaving(true);
        setPwMsg(null);
        try {
            await apiClient.post('/v1/auth/password/change', { currentPassword: currentPw, newPassword: newPw });
            setPwMsg({ type: 'success', text: 'Password changed successfully.' });
            setCurrentPw(''); setNewPw(''); setConfirmPw('');
        } catch (err: any) {
            const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Failed to change password.';
            setPwMsg({ type: 'error', text: msg });
        } finally {
            setPwSaving(false);
        }
    };

    return (
        <RoleLayout
            title="Settings"
            subtitle={`Tenant Admin · ${user?.email}`}
            accentColor="purple"
            avatarText={user?.firstName?.charAt(0) || 'U'}
            avatarGradient="bg-gradient-to-tr from-purple-500 to-pink-500"
            userName={`${user?.firstName} ${user?.lastName}`}
            userEmail={user?.email || ''}
            navSections={navSections}
            currentRole="tenant-admin"
        >
            <div className="flex flex-col gap-6 max-w-2xl">

                {/* Organization Info */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="font-bold text-slate-900">Organization Info</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Your tenant plan and usage details.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        {loading ? (
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                                Loading...
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Admin Email',       value: user?.email || '—' },
                                    { label: 'Role',              value: 'Tenant Admin' },
                                    { label: 'Total Employees',   value: dashData?.total_employees ?? '—' },
                                    { label: 'Active Employees',  value: dashData?.active_employees ?? '—' },
                                    { label: 'Certificates Issued', value: dashData?.certificates_issued ?? '—' },
                                    { label: 'Training Completion', value: dashData?.training_completion_rate != null ? `${dashData.training_completion_rate}%` : '—' },
                                ].map(item => (
                                    <div key={item.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                                        <p className="font-semibold text-slate-900">{String(item.value)}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Change Password */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="font-bold text-slate-900">Change Password</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Update your admin account password.</p>
                    </div>
                    <div className="p-6 space-y-4">
                        {pwMsg && (
                            <div className={`px-4 py-3 rounded-lg text-sm ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                {pwMsg.text}
                            </div>
                        )}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Current Password</label>
                            <input
                                type="password"
                                value={currentPw}
                                onChange={e => setCurrentPw(e.target.value)}
                                placeholder="Enter current password"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">New Password (min 8 chars)</label>
                            <input
                                type="password"
                                value={newPw}
                                onChange={e => setNewPw(e.target.value)}
                                placeholder="Enter new password"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Confirm New Password</label>
                            <input
                                type="password"
                                value={confirmPw}
                                onChange={e => setConfirmPw(e.target.value)}
                                placeholder="Repeat new password"
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={handleChangePassword}
                                disabled={pwSaving}
                                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                            >
                                {pwSaving ? 'Saving...' : 'Update Password'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Links */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                        <h2 className="font-bold text-slate-900">Quick Links</h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { href: '/tenant-admin/sso',      label: 'SSO Configuration',  icon: '🔑', desc: 'Configure SAML/OIDC single sign-on' },
                            { href: '/tenant-admin/import',   label: 'Bulk Import Users',   icon: '📤', desc: 'Import employees via CSV or SCIM' },
                            { href: '/tenant-admin/groups',   label: 'Group Management',    icon: '🏢', desc: 'Create departments and assign courses' },
                            { href: '/tenant-admin/courses',  label: 'Manage Courses',      icon: '📚', desc: 'View and assign training courses' },
                        ].map(link => (
                            <a key={link.href} href={link.href}
                                className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/30 transition-colors group">
                                <span className="text-2xl">{link.icon}</span>
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">{link.label}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{link.desc}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </RoleLayout>
    );
}
