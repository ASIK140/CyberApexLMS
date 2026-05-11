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

export default function TenantAdminImportPage() {
    const [dragActive, setDragActive] = useState(false);
    const [defaultRole, setDefaultRole] = useState('Employee');
    const [welcomeEmail, setWelcomeEmail] = useState('yes');
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    // Drag events
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setActiveModal('importing_csv');
            setTimeout(() => setActiveModal('import_success'), 1500);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setActiveModal('importing_csv');
            setTimeout(() => setActiveModal('import_success'), 1500);
        }
    };

    const handleAction = (type: string) => {
        setActiveModal(type);
    };

    const confirmAction = () => {
        setProcessing(true);
        setTimeout(() => {
            setProcessing(false);
            if (activeModal === 'syncScim') {
                setActiveModal('sync_success');
            } else {
                setActiveModal(null);
            }
        }, 1000);
    };

    return (
        <RoleLayout title="Import / SCIM Sync" subtitle="Tenant Admin · Acme Corporation" accentColor="purple" avatarText="TA" avatarGradient="bg-gradient-to-tr from-purple-500 to-pink-500" userName="Tenant Admin" userEmail="admin@acmecorp.com" navSections={navSections} currentRole="tenant-admin">
            <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">

                {/* Header */}
                <div className="flex justify-between items-start flex-col gap-2 border-b border-slate-200 pb-4">
                    <p className="text-slate-600 text-sm">Automatically provision users via SCIM integrations or manually bulk import via CSV.</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                    {/* SCIM Sync Panel */}
                    <div className="flex flex-col gap-6">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><span>🔄</span> SCIM Provisioning Status</h2>
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-full shadow-xl">
                            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-blue-500/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-md p-2">
                                        {/* Fake Microsoft Entra Logo */}
                                        <svg viewBox="0 0 23 23" className="w-full h-full"><path fill="#f25022" d="M1 1h10v10H1z" /><path fill="#7fba00" d="M12 1h10v10H12z" /><path fill="#00a4ef" d="M1 12h10v10H1z" /><path fill="#ffb900" d="M12 12h10v10H12z" /></svg>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-lg">Microsoft Entra ID</p>
                                        <p className="text-sm text-green-400 font-medium flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Active & Syncing</p>
                                    </div>
                                </div>
                                <button onClick={() => handleAction('syncScim')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all whitespace-nowrap">
                                    Sync Now
                                </button>
                            </div>

                            <div className="p-6 grid grid-cols-2 gap-6 bg-white shadow-sm flex-1">
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Users Synced</p>
                                    <p className="text-4xl font-bold text-slate-900">412</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Sync Errors</p>
                                    <p className="text-4xl font-bold text-slate-900">0</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Last Sync Time</p>
                                    <p className="text-sm font-semibold text-slate-700">Today, 08:30 AM</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Next Scheduled Sync</p>
                                    <p className="text-sm font-semibold text-slate-700">Today, 09:30 AM</p>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                                <p className="text-xs text-slate-500">Continuous sync every 60 minutes.</p>
                                <button onClick={() => handleAction('viewLogs')} className="text-blue-400 text-sm font-medium hover:text-blue-300 transition-colors flex items-center gap-1">
                                    View Sync Logs <span className="text-lg leading-none">→</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CSV Bulk Import Panel */}
                    <div className="flex flex-col gap-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><span>📂</span> CSV Bulk Import</h2>
                            <button onClick={() => handleAction('downloadTemplate')} className="text-purple-400 text-sm font-medium hover:text-purple-300 transition-colors flex items-center gap-1 border-b border-transparent hover:border-purple-300">
                                ⬇ Download Template
                            </button>
                        </div>
                        <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-full shadow-xl">
                            {/* Upload Area */}
                            <div className="p-6 bg-slate-50/50">
                                <div
                                    className={`w-full aspect-video md:aspect-[21/9] xl:aspect-[16/9] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${dragActive ? 'border-purple-500 bg-purple-500/5' : 'border-slate-300 hover:border-neutral-500 hover:bg-slate-50/50'}`}
                                    onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                                    onClick={() => document.getElementById('csv-upload')?.click()}
                                >
                                    <input type="file" id="csv-upload" className="hidden" accept=".csv" onChange={handleFileSelect} />
                                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl mb-2">📄</div>
                                    <p className="text-slate-900 font-medium">Click to upload or drag and drop</p>
                                    <p className="text-xs text-slate-500">CSV files only (Max. 2MB / 1000 rows)</p>
                                </div>
                            </div>

                            {/* Settings Area */}
                            <div className="p-6 border-t border-slate-200 flex-1 space-y-6">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Required CSV Columns</label>
                                    <div className="flex flex-wrap gap-2">
                                        {['First Name', 'Last Name', 'Email', 'Department', 'Supervisor Email'].map(col => (
                                            <span key={col} className="px-2.5 py-1 bg-slate-100 border border-slate-300 text-slate-700 rounded text-[11px] font-mono">{col}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Default Role</label>
                                        <div className="relative">
                                            <select value={defaultRole} onChange={e => setDefaultRole(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer">
                                                <option value="Employee">Employee (Learner)</option>
                                                <option value="Supervisor">Supervisor</option>
                                            </select>
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">▼</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-2 block uppercase tracking-wider">Welcome Email</label>
                                        <div className="relative">
                                            <select value={welcomeEmail} onChange={e => setWelcomeEmail(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500 appearance-none cursor-pointer">
                                                <option value="yes">Yes — send immediately</option>
                                                <option value="no">No — do not send</option>
                                            </select>
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">▼</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-slate-200 bg-white shadow-sm flex justify-end">
                                <button onClick={() => setActiveModal('importing_csv')} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all">
                                    Import Users
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* MODALS */}
            {activeModal === 'syncScim' && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 text-blue-400">
                            🔄
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg mb-2">Force Sync Directory?</h3>
                        <p className="text-sm text-slate-600 mb-6">This will pull the latest Delta from Microsoft Entra ID right now.</p>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => setActiveModal(null)} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors">Cancel</button>
                            <button onClick={confirmAction} disabled={processing} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md transition-all">
                                {processing ? 'Syncing...' : 'Sync Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeModal === 'sync_success' && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 text-green-400">
                            ✓
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg mb-2">Sync Completed</h3>
                        <p className="text-sm text-slate-600 mb-6">Successfully pulled 12 new records and deactivated 2 users.</p>
                        <button onClick={() => setActiveModal(null)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors">Done</button>
                    </div>
                </div>
            )}

            {activeModal === 'downloadTemplate' && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 text-purple-400">
                            📥
                        </div>
                        <h3 className="font-bold text-slate-900 text-lg mb-2">Downloading...</h3>
                        <p className="text-sm text-slate-600 mb-6">cyberapex_user_import_template.csv is downloading to your machine.</p>
                        <button onClick={() => setActiveModal(null)} className="w-full py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors">Close</button>
                    </div>
                </div>
            )}

            {activeModal === 'importing_csv' && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center animate-in zoom-in-95">
                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                        <h3 className="font-bold text-slate-900 text-lg mb-1">Validating CSV data...</h3>
                        <p className="text-sm text-slate-600">Please do not close this window.</p>
                    </div>
                </div>
            )}

            {activeModal === 'import_success' && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95">
                        <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 text-green-400">✓</div>
                        <h3 className="font-bold text-slate-900 text-lg mb-2">Import Successful</h3>
                        <p className="text-sm text-slate-600 mb-6">48 users imported successfully. 0 mapped to disabled accounts.</p>
                        <button onClick={() => setActiveModal(null)} className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg shadow-md transition-colors">Continue</button>
                    </div>
                </div>
            )}

            {activeModal === 'viewLogs' && (
                <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[70vh]">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm">
                            <h3 className="font-bold text-slate-900 text-lg">Detailed Sync Logs</h3>
                            <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-900 text-xl leading-none">×</button>
                        </div>
                        <div className="p-4 flex-1 overflow-auto bg-slate-50 font-mono text-xs">
                            <ul className="space-y-2">
                                <li className="text-slate-600"><span className="text-green-400">[2026-03-12 08:30:15]</span> INFO: SCIM delta sync initiated from Entra IP 52.124.X.X</li>
                                <li className="text-slate-600"><span className="text-green-400">[2026-03-12 08:30:16]</span> INFO: Received 4 group changes, 12 user updates</li>
                                <li className="text-slate-600"><span className="text-green-400">[2026-03-12 08:30:17]</span> INFO: Provisioning new user 'alice.smith@acmecorp.com'</li>
                                <li className="text-slate-600"><span className="text-yellow-400">[2026-03-12 08:30:18]</span> WARN: Skipping user 'bob.temp@acmecorp.com' - missing required attribute 'department'</li>
                                <li className="text-slate-600"><span className="text-green-400">[2026-03-12 08:30:19]</span> INFO: De-provisioning user 'd.jones@acmecorp.com' (AccountDisabled=True)</li>
                                <li className="text-slate-600"><span className="text-green-400">[2026-03-12 08:30:22]</span> INFO: Sync completed in 7s. 11 updated, 1 skipped.</li>
                            </ul>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-white shadow-sm flex justify-end gap-3">
                            <button className="px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300">Export Log</button>
                            <button onClick={() => setActiveModal(null)} className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </RoleLayout>
    );
}
