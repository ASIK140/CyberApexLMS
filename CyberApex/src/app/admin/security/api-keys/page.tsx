'use client';
import React, { useState } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const apiKeys = [
    { id: 'key_live_8f9x2', fullId: 'key_live_8f9x2B7nQpP13', name: 'SIEM Integration Prod', type: 'Production', scopes: ['audit:read', 'alerts:read'], created: 'Jan 15, 2025', lastUsed: '2 mins ago', expires: 'Never' },
    { id: 'key_live_m41z9', fullId: 'key_live_m41z9L0rKjX99', name: 'HRMS Sync', type: 'Production', scopes: ['users:write', 'users:read'], created: 'Dec 10, 2024', lastUsed: '1 hour ago', expires: 'Dec 10, 2025' },
    { id: 'key_test_a32b0', fullId: 'key_test_a32b0X9aQzW1', name: 'Dev Sandbox V2', type: 'Test', scopes: ['*'], created: 'Mar 01, 2025', lastUsed: '3 days ago', expires: 'Apr 01, 2025' },
    { id: 'key_live_c88y4', fullId: 'key_live_c88y4F1vMvB33', name: 'Reporting Dashboard API', type: 'Production', scopes: ['reports:read'], created: 'Feb 20, 2025', lastUsed: '5 mins ago', expires: 'Feb 20, 2026' },
];

export default function APIKeysPage() {
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [selectedKey, setSelectedKey] = useState<any | null>(null);

    return (
        <SuperAdminLayout title="API Keys">
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
                    <p className="text-slate-600 text-sm">Manage Super Admin API tokens for system integrations and automation.</p>
                    <button onClick={() => setActiveModal('generate-key')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all whitespace-nowrap">
                        Generate New Key
                    </button>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-4 pr-6">
                    <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <div>
                        <p className="text-sm text-blue-300 font-semibold mb-1">API Rate Limits & Quotas</p>
                        <p className="text-xs text-blue-400/80">Global API rate limit is set to 1000 requests / minute per production key. Exceeding limits will result in a 429 Too Many Requests response.</p>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm whitespace-nowrap">
                            <thead className="bg-slate-50/50 border-b border-slate-200">
                                <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                                    <th className="px-6 py-4 text-left font-semibold">Key Name & Prefix</th>
                                    <th className="px-6 py-4 text-left font-semibold">Environment</th>
                                    <th className="px-6 py-4 text-left font-semibold">Scopes</th>
                                    <th className="px-6 py-4 text-left font-semibold">Created</th>
                                    <th className="px-6 py-4 text-left font-semibold">Last Used</th>
                                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800/50">
                                {apiKeys.map((k, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4">
                                            <p className="font-semibold text-slate-900">{k.name}</p>
                                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">{k.id}...</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${k.type === 'Production' ? 'text-green-400 bg-green-400/10 border-green-500/30' : 'text-blue-400 bg-blue-400/10 border-blue-500/30'}`}>
                                                {k.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 flex-wrap max-w-[200px]">
                                                {k.scopes.map(s => <span key={s} className="px-1.5 py-0.5 text-[10px] bg-slate-100 text-slate-700 border border-slate-300 rounded">{s}</span>)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-slate-900 text-xs">{k.created}</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Exp: {k.expires}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-xs">{k.lastUsed}</td>
                                        <td className="px-6 py-4 text-right flex gap-2 justify-end">
                                            <button onClick={() => { setSelectedKey(k); setActiveModal('edit-key'); }} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-100 text-slate-900 rounded border border-slate-300 transition-colors">Edit</button>
                                            <button onClick={() => { setSelectedKey(k); setActiveModal('revoke-key'); }} className="px-3 py-1.5 text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded border border-red-500/20 transition-colors">Revoke</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── API Keys Modals ── */}
            {activeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 text-base">
                                {activeModal === 'generate-key' ? 'Generate API Key' :
                                    activeModal === 'edit-key' ? 'Edit API Key' : 'Revoke API Key'}
                            </h3>
                            <button onClick={() => { setActiveModal(null); setSelectedKey(null); }} className="text-slate-500 hover:text-slate-900 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-6">
                            {activeModal === 'generate-key' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Key Description</label>
                                        <input type="text" placeholder="e.g. Jenkins CI Deployment" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Environment</label>
                                            <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none">
                                                <option>Production</option>
                                                <option>Test</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Expiration</label>
                                            <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none">
                                                <option>30 days</option>
                                                <option>90 days</option>
                                                <option>1 year</option>
                                                <option>Never default</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Required Scopes</label>
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 max-h-32 overflow-y-auto space-y-1 text-sm text-slate-700">
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="accent-blue-500" /> users:read</label>
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="accent-blue-500" /> users:write</label>
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="accent-blue-500" /> alerts:read</label>
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="accent-blue-500" /> audit:read</label>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeModal === 'edit-key' && selectedKey && (
                                <div className="space-y-4">
                                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg text-xs font-mono text-slate-500">
                                        {selectedKey.fullId}
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Key Description</label>
                                        <input type="text" defaultValue={selectedKey.name} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none" />
                                    </div>
                                    <p className="text-xs text-slate-500">Note: Environment and Scopes cannot be edited once created. You must generate a new key.</p>
                                </div>
                            )}
                            {activeModal === 'revoke-key' && selectedKey && (
                                <div className="space-y-4">
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-300">
                                        <span className="font-bold text-slate-900">Warning:</span> You are about to permanently revoke <span className="font-bold text-slate-900">{selectedKey.name}</span>. Any systems relying on this key will immediately fail authentication.
                                    </div>
                                    <div className="text-xs text-slate-600">
                                        Prefix: <span className="font-mono text-slate-700">{selectedKey.id}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                            {activeModal === 'revoke-key' ? (
                                <>
                                    <button onClick={() => { setActiveModal(null); setSelectedKey(null); }} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                                    <button onClick={() => { setActiveModal(null); setSelectedKey(null); }} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors border border-red-600">Yes, Revoke Key</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => { setActiveModal(null); setSelectedKey(null); }} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                                    <button onClick={() => { setActiveModal(null); setSelectedKey(null); }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors border border-blue-500">
                                        {activeModal === 'generate-key' ? 'Create Key' : 'Save Changes'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </SuperAdminLayout>
    );
}
