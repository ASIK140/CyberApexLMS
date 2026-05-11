'use client';
import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const admins = [
    { id: 1, name: 'Alice Systems', email: 'alice.sys@cyberapex.io', role: 'Super Admin', mfa: true, lastLogin: '2 mins ago', added: 'Jan 2022' },
    { id: 2, name: 'Bob Security', email: 'bob.sec@cyberapex.io', role: 'Security Ops', mfa: true, lastLogin: '1 hour ago', added: 'Mar 2023' },
    { id: 3, name: 'Charlie Analytics', email: 'charlie.data@cyberapex.io', role: 'Global Analyst', mfa: false, lastLogin: '4 days ago', added: 'Aug 2024' },
    { id: 4, name: 'Diana Support', email: 'diana.supp@cyberapex.io', role: 'Support Agent', mfa: true, lastLogin: '10 mins ago', added: 'Nov 2024' },
];

export default function AdminAccountsPage() {
    const [admins, setAdmins] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
    const [globalMfa, setGlobalMfa] = useState(true);
    const [inviteData, setInviteData] = useState({ name: '', email: '', role: 'support' });

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const { apiFetch } = await import('@/utils/api');
            const res = await apiFetch('/admin/accounts');
            const json = await res.json();
            if (json.success) {
                setAdmins(json.data);
                if (json.settings) {
                    setGlobalMfa(json.settings.mfa_enforced_globally);
                }
            } else {
                setError('Failed to fetch admin accounts');
            }
        } catch (err) {
            setError('Network error connecting to API');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    const toggleGlobalMfa = async () => {
        const newVal = !globalMfa;
        setGlobalMfa(newVal);
        try {
            const { apiFetch } = await import('@/utils/api');
            await apiFetch('/admin/accounts/settings', {
                method: 'PUT',
                body: JSON.stringify({ mfa_enforced_globally: newVal })
            });
        } catch (err) {
            console.error('Failed to update global MFA', err);
        }
    };

    const filtered = admins.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));

    if (loading) return (
        <SuperAdminLayout title="Admin Accounts">
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-slate-600">Loading admin roster...</span>
            </div>
        </SuperAdminLayout>
    );

    if (error) return (
        <SuperAdminLayout title="Admin Accounts">
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <p className="font-bold">Error</p>
                <p className="text-sm">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Retry</button>
            </div>
        </SuperAdminLayout>
    );

    return (
        <SuperAdminLayout title="Admin Accounts">
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
                    <p className="text-slate-600 text-sm">Manage users with global access to the Super Admin platform. Enforce MFA and view login activity.</p>
                    <button onClick={() => setActiveModal('add')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all whitespace-nowrap">
                        + Invite Admin
                    </button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white shadow-sm border-b border-slate-200">
                        <div className="relative w-full max-w-sm">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </span>
                            <input type="text" placeholder="Search admins by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-600">Enforce MFA for all admins?</span>
                            <button 
                                onClick={toggleGlobalMfa}
                                className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${globalMfa ? 'bg-blue-500' : 'bg-neutral-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${globalMfa ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm whitespace-nowrap">
                            <thead className="bg-slate-50/50 border-b border-slate-200">
                                <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                                    <th className="px-6 py-4 text-left font-semibold">User Details</th>
                                    <th className="px-6 py-4 text-left font-semibold">Global Role</th>
                                    <th className="px-6 py-4 text-left font-semibold">MFA Status</th>
                                    <th className="px-6 py-4 text-left font-semibold">Last Login</th>
                                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/50">
                                {filtered.map(admin => (
                                    <tr key={admin.admin_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-900 text-xs">
                                                {admin.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-900">{admin.name}</p>
                                                <p className="text-[11px] text-slate-600 mt-0.5">{admin.email}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-[11px] font-medium rounded border ${admin.role === 'super_admin' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-slate-100 text-slate-700 border-slate-300'}`}>
                                                {admin.role.replace(/_/g, ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1.5 text-xs font-medium ${(admin.mfa_enabled || globalMfa) ? 'text-green-400' : 'text-slate-500'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${(admin.mfa_enabled || globalMfa) ? 'bg-green-400' : 'bg-neutral-600'}`}></span>
                                                {(admin.mfa_enabled || globalMfa) ? 'Enabled' : 'Disabled'}
                                                {globalMfa && !admin.mfa_enabled && <span className="text-[10px] text-blue-400/80 ml-1 opacity-80">(Enforced)</span>}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-xs">
                                            {admin.last_login || 'Never'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => {
                                                    setEditingAdmin(admin);
                                                    setActiveModal('edit');
                                                }}
                                                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-100 text-slate-900 rounded border border-slate-300 transition-colors"
                                            >
                                                Edit Access
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {activeModal === 'add' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm">
                            <h3 className="font-bold text-slate-900 text-lg">Invite Global Admin</h3>
                            <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-900 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email Address</label>
                                <input id="invite-email" type="email" placeholder="name@cyberapex.io" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full Name</label>
                                <input id="invite-name" type="text" placeholder="e.g. Jane Doe" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Global Permission Level</label>
                                <select id="invite-role" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500">
                                    <option value="super_admin">Super Admin (Full Access)</option>
                                    <option value="platform_ops">Security Ops (Read/Write Security only)</option>
                                    <option value="content_manager">Global Analyst (Read-only)</option>
                                    <option value="support">Support Agent (Tenant management only)</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-white shadow-sm">
                            <button onClick={() => setActiveModal(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                            <button 
                                onClick={async () => {
                                    const { apiFetch } = await import('@/utils/api');
                                    const email = (document.getElementById('invite-email') as HTMLInputElement).value;
                                    const name = (document.getElementById('invite-name') as HTMLInputElement).value;
                                    const role = (document.getElementById('invite-role') as HTMLSelectElement).value;
                                    
                                    try {
                                        const res = await apiFetch('/admin/accounts', {
                                            method: 'POST',
                                            body: JSON.stringify({ name, email, role, password: 'TemporaryPassword123!' })
                                        });
                                        if (res.ok) {
                                            setActiveModal(null);
                                            fetchAdmins();
                                        }
                                    } catch (err) {
                                        console.error('Invite failed', err);
                                    }
                                }}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors border border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                            >
                                Send Invite Link
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {activeModal === 'edit' && editingAdmin && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm">
                            <h3 className="font-bold text-slate-900 text-lg">Edit Admin: {editingAdmin.name}</h3>
                            <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-900 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full Name</label>
                                <input id="edit-name" type="text" defaultValue={editingAdmin.name} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email Address</label>
                                <input id="edit-email" type="email" defaultValue={editingAdmin.email} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed" disabled />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Global Permission Level</label>
                                <select id="edit-role" defaultValue={editingAdmin.role} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500">
                                    <option value="super_admin">Super Admin (Full Access)</option>
                                    <option value="platform_ops">Security Ops (Read/Write Security only)</option>
                                    <option value="content_manager">Global Analyst (Read-only)</option>
                                    <option value="support">Support Agent (Tenant management only)</option>
                                </select>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                                <div>
                                    <p className="text-xs font-bold text-slate-900 mb-0.5">Multi-Factor Authentication (MFA)</p>
                                    <p className="text-[10px] text-slate-500">Require secondary verification for this admin.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        id="edit-mfa"
                                        defaultChecked={editingAdmin.mfa_enabled}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
                                <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mb-1">Warning</p>
                                <p className="text-[11px] text-slate-500 leading-relaxed">Changing an admin's role will immediately revoke their existing permissions and grant new ones based on the selected tier.</p>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-white shadow-sm">
                            <button onClick={() => setActiveModal(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                            <button 
                                onClick={async () => {
                                    const { apiFetch } = await import('@/utils/api');
                                    const name = (document.getElementById('edit-name') as HTMLInputElement).value;
                                    const role = (document.getElementById('edit-role') as HTMLSelectElement).value;
                                    const mfa_enabled = (document.getElementById('edit-mfa') as HTMLInputElement).checked;
                                    
                                    try {
                                        const res = await apiFetch(`/admin/accounts/${editingAdmin.admin_id}`, {
                                            method: 'PUT',
                                            body: JSON.stringify({ name, role, mfa_enabled })
                                        });
                                        if (res.ok) {
                                            setActiveModal(null);
                                            fetchAdmins();
                                        }
                                    } catch (err) {
                                        console.error('Update failed', err);
                                    }
                                }}
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors border border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}
