'use client';
import React, { useState } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const templates = [
  { id: 'TPL-001', name: 'New User Welcome', description: 'Sent when a user is synced/invited to the platform.', category: 'Onboarding', tags: ['System', 'Global'], lastUpdated: '2 weeks ago', active: true },
  { id: 'TPL-002', name: 'Training Reminder (Due Soon)', description: '7-day warning for pending required courses.', category: 'Training', tags: ['Automated'], lastUpdated: '1 month ago', active: true },
  { id: 'TPL-003', name: 'Training Overdue Escalation', description: 'Sent to user and supervisor when training deadline passes.', category: 'Training', tags: ['Automated', 'Escalation'], lastUpdated: '3 months ago', active: true },
  { id: 'TPL-004', name: 'Phishing Campaign Launch', description: 'System notification that a phishing campaign started.', category: 'Phishing', tags: ['Admin Only'], lastUpdated: '1 year ago', active: false },
  { id: 'TPL-005', name: 'Password Reset Request', description: 'Standard secure password reset link.', category: 'Security', tags: ['System', 'Global'], lastUpdated: '6 months ago', active: true },
  { id: 'TPL-006', name: 'Weekly Executive Summary', description: 'Report sent to Tenant Admins/CISO every Monday.', category: 'Reporting', tags: ['Automated'], lastUpdated: '2 months ago', active: true },
];

export default function NotificationTemplatesPage() {
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  const filtered = templates.filter(t => t.name.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <SuperAdminLayout title="Notification Templates">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
          <p className="text-slate-600 text-sm">Manage global email and in-app notification templates used across all tenants.</p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all whitespace-nowrap">
            + Create Template
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-white shadow-sm">
            <div className="relative w-full max-w-sm">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-500">🔍</span>
              <input type="text" placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="px-6 py-4 text-left font-semibold">Template Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Category</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-left font-semibold">Last Updated</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{t.name}</p>
                      <div className="flex gap-1 mt-1">
                        {t.tags.map((tag: string) => <span key={tag} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300">{tag}</span>)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 border border-slate-300 text-slate-700 rounded text-[11px]">{t.category}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${t.active ? 'bg-green-400/10 text-green-400 border-green-500/20' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                        {t.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{t.lastUpdated}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setSelectedTemplate(t); setActiveModal('edit'); }} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-100 text-slate-900 rounded border border-slate-300 transition-colors">Edit Code</button>
                        <button className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-100 text-slate-700 rounded border border-slate-300 transition-colors">Preview</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Template Modal */}
      {activeModal === 'edit' && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 h-[80vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{selectedTemplate.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedTemplate.id}</p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center cursor-pointer">
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" defaultChecked={selectedTemplate.active} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-blue-500 appearance-none cursor-pointer translate-x-5" />
                    <label className="toggle-label block overflow-hidden h-5 rounded-full bg-blue-500 cursor-pointer"></label>
                  </div>
                  <span className="text-xs font-medium text-slate-600">{selectedTemplate.active ? 'Active' : 'Disabled'}</span>
                </label>
                <button onClick={() => { setActiveModal(null); setSelectedTemplate(null); }} className="text-slate-500 hover:text-slate-900 text-2xl leading-none">Ã</button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
              {/* Editor Area */}
              <div className="flex-1 flex flex-col border-r border-slate-200 bg-slate-50">
                <div className="p-4 border-b border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Email Subject Line</label>
                  <input type="text" defaultValue={`[CyberApex] Action Required: ${selectedTemplate.name}`} className="w-full bg-transparent border-none text-slate-900 font-medium focus:outline-none" />
                </div>
                <div className="flex-1 relative">
                  {/* Fake Code Editor */}
                  <div className="absolute inset-0 p-4 font-mono text-[13px] text-slate-700 leading-relaxed overflow-y-auto">
                    <span className="text-blue-400">&lt;!DOCTYPE</span> <span className="text-blue-300">html</span><span className="text-blue-400">&gt;</span><br />
                    <span className="text-blue-400">&lt;html&gt;</span><br />
                    <span className="text-blue-400">&lt;head&gt;</span><br />
                    &nbsp;&nbsp;<span className="text-blue-400">&lt;style&gt;</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;body {'{ font-family: sans-serif; bg-color: #f5f5f5; }'}<br />
                    &nbsp;&nbsp;<span className="text-blue-400">&lt;/style&gt;</span><br />
                    <span className="text-blue-400">&lt;/head&gt;</span><br />
                    <span className="text-blue-400">&lt;body&gt;</span><br />
                    &nbsp;&nbsp;<span className="text-blue-400">&lt;div</span> <span className="text-blue-300">class</span>=<span className="text-green-300">"container"</span><span className="text-blue-400">&gt;</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">&lt;h2&gt;</span>Hello <span className="text-orange-400">{`{{user.firstName}}`}</span>,<span className="text-blue-400">&lt;/h2&gt;</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">&lt;p&gt;</span>This is an automated notification from <span className="text-orange-400">{`{{tenant.name}}`}</span>.<span className="text-blue-400">&lt;/p&gt;</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">&lt;p&gt;</span>Please log in to review your pending tasks.<span className="text-blue-400">&lt;/p&gt;</span><br />
                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-400">&lt;a</span> <span className="text-blue-300">href</span>=<span className="text-green-300">"{`{{system.loginUrl}}`}"</span> <span className="text-blue-300">class</span>=<span className="text-green-300">"btn"</span><span className="text-blue-400">&gt;</span>Log In<span className="text-blue-400">&lt;/a&gt;</span><br />
                    &nbsp;&nbsp;<span className="text-blue-400">&lt;/div&gt;</span><br />
                    <span className="text-blue-400">&lt;/body&gt;</span><br />
                    <span className="text-blue-400">&lt;/html&gt;</span>
                  </div>
                </div>
              </div>

              {/* Sidebar Variables */}
              <div className="w-full lg:w-72 bg-white shadow-sm p-4 overflow-y-auto">
                <h4 className="font-semibold text-slate-900 text-sm mb-3">Available Variables</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1.5">User Context</p>
                    <div className="space-y-1">
                      <code className="block text-[11px] text-orange-400 bg-slate-50 px-2 py-1 rounded cursor-pointer hover:bg-slate-100">{`{{user.firstName}}`}</code>
                      <code className="block text-[11px] text-orange-400 bg-slate-50 px-2 py-1 rounded cursor-pointer hover:bg-slate-100">{`{{user.lastName}}`}</code>
                      <code className="block text-[11px] text-orange-400 bg-slate-50 px-2 py-1 rounded cursor-pointer hover:bg-slate-100">{`{{user.email}}`}</code>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1.5">Tenant Context</p>
                    <div className="space-y-1">
                      <code className="block text-[11px] text-green-400 bg-slate-50 px-2 py-1 rounded cursor-pointer hover:bg-slate-100">{`{{tenant.name}}`}</code>
                      <code className="block text-[11px] text-green-400 bg-slate-50 px-2 py-1 rounded cursor-pointer hover:bg-slate-100">{`{{tenant.supportEmail}}`}</code>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase mb-1.5">System Links</p>
                    <div className="space-y-1">
                      <code className="block text-[11px] text-blue-400 bg-slate-50 px-2 py-1 rounded cursor-pointer hover:bg-slate-100">{`{{system.loginUrl}}`}</code>
                      <code className="block text-[11px] text-blue-400 bg-slate-50 px-2 py-1 rounded cursor-pointer hover:bg-slate-100">{`{{action.link}}`}</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 bg-white shadow-sm">
              <button onClick={() => { setActiveModal(null); setSelectedTemplate(null); }} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button onClick={() => { setActiveModal(null); setSelectedTemplate(null); }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors border border-blue-500">Save Template</button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
