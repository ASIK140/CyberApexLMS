'use client';
import React, { useState } from 'react';
import RoleLayout, { NavSection } from '@/components/layout/RoleLayout';

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
            { label: 'Email Templates', href: '/tenant-admin/email-templates', icon: '✉️' },
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

const INITIAL_RULES = [
    { id: 1, name: 'Failed Phish Remedial', trigger: 'User clicks phishing link', action: 'Assign "Phishing 101" Module', status: 'active', executions: 142 },
    { id: 2, name: 'New Hire Onboarding', trigger: 'User added via SCIM', action: 'Assign "Welcome Bundle"', status: 'active', executions: 45 },
    { id: 3, name: 'Habitual Offender Lockdown', trigger: 'Fails 3 phishing sims in 90 days', action: 'Notify Supervisor + Force Password Reset', status: 'active', executions: 8 },
    { id: 4, name: 'Inactivity Suspension', trigger: 'No login for 30 days', action: 'Disable local login access', status: 'inactive', executions: 0 },
    { id: 5, name: 'Certificate Expiry Warning', trigger: '30 days before cert expiration', action: 'Send email notification template', status: 'active', executions: 89 },
];

export default function TenantAdminAutomation() {
    const [rules, setRules] = useState(INITIAL_RULES);

    // Modal states
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [selectedRule, setSelectedRule] = useState<any>(null);
    const [processing, setProcessing] = useState(false);

    const toggleRuleStatus = (id: number) => {
        setRules(rules.map(r => r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r));
    };

    const openCreateModal = () => {
        setActiveModal('create_rule');
    };

    const openEditModal = (rule: any) => {
        setSelectedRule(rule);
        setActiveModal('edit_rule');
    };

    const openDeleteConfirm = (rule: any) => {
        setSelectedRule(rule);
        setActiveModal('delete_confirm');
    };

    const handleConfirmDelete = () => {
        setProcessing(true);
        setTimeout(() => {
            setRules(rules.filter(r => r.id !== selectedRule.id));
            setProcessing(false);
            setActiveModal(null);
        }, 1200);
    };

    const handleSaveRule = () => {
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            setActiveModal('save_success');
            setTimeout(() => setActiveModal(null), 3000);
        }, 1500);
    };

    const handleExport = () => {
        setActiveModal('loading');
        setTimeout(() => {
            setActiveModal('export_success');
            setTimeout(() => setActiveModal(null), 3000);
        }, 1500);
    };

    return (
        <RoleLayout title="Adaptive Rules Engine" subtitle="Tenant Admin · Acme Corporation" accentColor="purple" avatarText="TA" avatarGradient="bg-gradient-to-tr from-purple-500 to-pink-500" userName="Tenant Admin" userEmail="admin@acmecorp.com" navSections={navSections} currentRole="tenant-admin">
            <div className="flex flex-col gap-6 max-w-[1200px] w-full mx-auto">
                <div className="flex justify-between items-center sm:flex-row flex-col gap-4">
                    <div>
                        <p className="text-slate-600 text-sm">Define automated triggers and responses to enforce policies without manual intervention.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setActiveModal('view_audit')} className="px-4 py-2 bg-white shadow-sm border border-slate-200 hover:border-neutral-600 rounded-lg text-sm text-slate-700 transition w-full sm:w-auto text-center font-bold">
                            View Execution Logs
                        </button>
                        <button onClick={openCreateModal} className="px-5 py-2 w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all">
                            + Create New Rule
                        </button>
                    </div>
                </div>

                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm/50">
                        <div className="relative w-72">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">🔍</span>
                            <input type="text" placeholder="Search rules..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" />
                        </div>
                        <button onClick={handleExport} className="text-slate-600 hover:text-slate-900 text-sm font-semibold">Export CSV ↓</button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-bold tracking-wider">Rule Name</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">IF (Trigger)</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">THEN (Action)</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Executions</th>
                                    <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                                    <th className="px-6 py-4 font-bold tracking-wider text-right">Settings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/50">
                                {rules.map(rule => (
                                    <tr key={rule.id} className="hover:bg-slate-100/20 transition-colors group">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900">{rule.name}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium">
                                                <span className="opacity-50">⚡</span> {rule.trigger}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
                                                <span className="opacity-50">▶</span> {rule.action}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-600 font-mono">{rule.executions}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <label className="relative inline-flex items-center cursor-pointer group-hover:opacity-100 opacity-90">
                                                <input type="checkbox" className="sr-only peer" checked={rule.status === 'active'} onChange={() => toggleRuleStatus(rule.id)} />
                                                <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                            </label>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-3">
                                            <button onClick={() => openEditModal(rule)} className="text-purple-400 hover:text-purple-300 font-semibold transition text-xs">Edit</button>
                                            <button onClick={() => openDeleteConfirm(rule)} className="text-neutral-600 hover:text-red-500 font-semibold transition text-xs">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {rules.length === 0 && (
                            <div className="p-8 text-center text-slate-500">No automation rules configured.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODALS */}
            {activeModal === 'loading' && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl shadow-xl p-8 flex flex-col items-center animate-in zoom-in-95">
                        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                        <p className="font-bold text-slate-900">Preparing Export...</p>
                    </div>
                </div>
            )}

            {activeModal === 'export_success' && (
                <div className="fixed bottom-6 right-6 bg-slate-100 border-l-4 border-green-500 text-slate-900 px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
                    <span className="text-green-400 text-xl">⬇</span>
                    <div>
                        <p className="font-bold text-sm">Download Started</p>
                        <p className="text-xs text-slate-600 mt-0.5">rules_export.csv is downloading.</p>
                    </div>
                </div>
            )}

            {activeModal === 'save_success' && (
                <div className="fixed bottom-6 right-6 bg-green-600/90 backdrop-blur-sm border border-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
                    <span className="text-slate-900 text-xl">✓</span>
                    <div>
                        <p className="font-bold text-sm">Rule Saved</p>
                        <p className="text-xs text-green-100 mt-0.5">Changes applied to automation engine.</p>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {activeModal === 'delete_confirm' && selectedRule && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 text-red-500">
                            🗑
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg mb-2">Delete Rule?</h3>
                        <p className="text-sm text-slate-600 mb-6">Are you sure you want to delete <strong className="text-slate-900">'{selectedRule.name}'</strong>? This automated workflow will immediately stop functioning.</p>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setActiveModal(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition">Cancel</button>
                            <button onClick={handleConfirmDelete} disabled={processing} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg shadow-[0_0_15px_rgba(220,38,38,0.3)] transition">
                                {processing ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create / Edit Modal Placeholder */}
            {(activeModal === 'create_rule' || activeModal === 'edit_rule') && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-900 text-lg">
                                {activeModal === 'create_rule' ? 'Create Automation Rule' : `Edit: ${selectedRule?.name}`}
                            </h3>
                            <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-900 text-xl leading-none">×</button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Rule Name</label>
                                <input type="text" defaultValue={activeModal === 'edit_rule' ? selectedRule?.name : ''} placeholder="e.g. Remedial Training Assignment" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500" />
                            </div>

                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none"></div>
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <span className="text-purple-400">⚡ IF</span> Condition (Trigger)
                                </h4>
                                <select className="w-full px-4 py-2.5 bg-white shadow-sm border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500">
                                    <option>User clicks phishing link</option>
                                    <option>User fails 3 phishing sims</option>
                                    <option>User added via SCIM</option>
                                    <option>Training deadline reached</option>
                                </select>
                            </div>

                            <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[40px] pointer-events-none"></div>
                                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <span className="text-blue-400">▶ THEN</span> Action
                                </h4>
                                <select className="w-full px-4 py-2.5 bg-white shadow-sm border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500">
                                    <option>Assign Training Module...</option>
                                    <option>Send Email Notification</option>
                                    <option>Notify Supervisor</option>
                                    <option>Send Slack Message</option>
                                    <option>Lock Account</option>
                                </select>
                                <div className="pt-3 border-t border-slate-100">
                                    <select defaultValue="" className="w-full px-4 py-2 bg-white shadow-sm border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none placeholder-neutral-500">
                                        <option value="" disabled>Select specific entity...</option>
                                        <option>Phishing 101 Module</option>
                                        <option>Data Security Basics</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                            <label className="text-sm text-slate-600 flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" className="accent-purple-500" defaultChecked /> Enable immediately
                            </label>
                            <div className="flex gap-3">
                                <button onClick={() => setActiveModal(null)} className="px-5 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                                <button onClick={handleSaveRule} disabled={processing} className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg shadow-md transition-colors min-w-[100px]">
                                    {processing ? 'Saving...' : 'Save Workflow'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Audit Log Modal */}
            {activeModal === 'view_audit' && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in slide-in-from-bottom-5">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Rule Execution Logs</h3>
                                <p className="text-xs text-slate-600">Recent automation activities across the tenant.</p>
                            </div>
                            <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-900 text-2xl pb-1">&times;</button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-0 bg-white shadow-sm">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 z-10 text-slate-500">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Timestamp</th>
                                        <th className="px-6 py-3 font-semibold">Rule Triggered</th>
                                        <th className="px-6 py-3 font-semibold">Target User</th>
                                        <th className="px-6 py-3 font-semibold">Action Taken</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-800/50">
                                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                                        <tr key={num} className="hover:bg-slate-50 border border-slate-100">
                                            <td className="px-6 py-3 text-slate-700 font-mono text-xs">2026-06-15 14:32:0{num}</td>
                                            <td className="px-6 py-3 text-purple-400 font-semibold text-xs">Failed Phish Remedial</td>
                                            <td className="px-6 py-3 text-slate-900">jdoe@acmecorp.com</td>
                                            <td className="px-6 py-3 text-slate-600 text-xs">Assigned 'Phishing 101'</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </RoleLayout>
    );
}
