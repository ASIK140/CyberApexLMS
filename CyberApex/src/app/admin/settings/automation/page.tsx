'use client';
import React, { useState } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const rules = [
  { id: 'AUTO-01', name: 'Remedial Training on Failure', description: 'If user fails phishing test 3 times â†’ Enroll in Advanced Phishing Course.', trigger: 'Phishing Campaign', action: 'Course Enrollment', status: 'Active', executions: 4210 },
  { id: 'AUTO-02', name: 'New User Onboarding', description: 'If new user synced from Azure AD/Okta â†’ Send Welcome Email.', trigger: 'User Creation', action: 'Send Email', status: 'Active', executions: 15890 },
  { id: 'AUTO-03', name: 'Overdue Escalation to Supervisor', description: 'If course completion < 20% on Day 25 â†’ Escalate to supervisor.', trigger: 'Course Deadline', action: 'Send Notification', status: 'Active', executions: 345 },
  { id: 'AUTO-04', name: 'Certificate Generation', description: 'On 100% course completion â†’ Generate and email PDF certificate.', trigger: 'Course Completion', action: 'Generate Document', status: 'Active', executions: 8900 },
  { id: 'AUTO-05', name: 'Inactive User Suspension', description: 'If user hasn\'t logged in for 90 days â†’ Disable LMS access.', trigger: 'User Activity', action: 'Modify Access', status: 'Disabled', executions: 0 },
];

export default function AutomationRulesPage() {
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedRule, setSelectedRule] = useState<any | null>(null);

  const filtered = rules.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.trigger.toLowerCase().includes(search.toLowerCase()));

  return (
    <SuperAdminLayout title="Automation Rules">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
          <p className="text-slate-600 text-sm">Configure global conditional workflows, event triggers, and automatic actions across the LMS and Phishing modules.</p>
          <button onClick={() => setActiveModal('create')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all whitespace-nowrap">
            + New Rule
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white shadow-sm border-b border-slate-200">
            <div className="relative w-full max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-slate-500">ðŸ”Ž</span>
              <input type="text" placeholder="Search rules by name or trigger..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="px-6 py-4 text-left font-semibold">Rule Name & Logic</th>
                  <th className="px-6 py-4 text-left font-semibold">Trigger Event</th>
                  <th className="px-6 py-4 text-left font-semibold">Resulting Action</th>
                  <th className="px-6 py-4 text-left font-semibold">Executions (30d)</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{r.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 whitespace-normal max-w-sm">{r.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-xs font-medium flex items-center gap-1.5 w-max">
                        <span>âš¡</span> {r.trigger}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-medium flex items-center gap-1.5 w-max">
                        <span>â–¶</span> {r.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-700 text-xs">
                      {r.executions.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <label className="flex items-center cursor-pointer">
                        <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                          <input type="checkbox" defaultChecked={r.status === 'Active'} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-blue-500 appearance-none cursor-pointer translate-x-5" />
                          <label className="toggle-label block overflow-hidden h-5 rounded-full bg-blue-500 cursor-pointer"></label>
                        </div>
                      </label>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setSelectedRule(r); setActiveModal('edit'); }} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-100 text-slate-900 rounded border border-slate-300 transition-colors">Edit Workflow</button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No automation rules found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {(activeModal === 'create' || activeModal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm">
              <h3 className="font-bold text-slate-900 text-lg">{activeModal === 'create' ? 'Create Automation Rule' : 'Edit Workflow Elements'}</h3>
              <button onClick={() => { setActiveModal(null); setSelectedRule(null); }} className="text-slate-500 hover:text-slate-900 text-xl">Ã—</button>
            </div>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Rule Name</label>
                <input type="text" defaultValue={selectedRule?.name} placeholder="e.g. Auto-enroll high risk users" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500" />
              </div>

              {/* visual workflow builder */}
              <div className="p-5 border border-slate-200 bg-slate-50 rounded-xl relative">
                {/* Vertical line connector */}
                <div className="absolute left-9 top-12 bottom-12 w-0.5 bg-slate-100"></div>

                {/* Step 1: Trigger */}
                <div className="flex gap-4 mb-8 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl shadow-[0_0_10px_rgba(168,85,247,0.2)]">âš¡</div>
                  <div className="flex-1 bg-white shadow-sm border border-slate-200 p-4 rounded-xl">
                    <p className="text-xs font-semibold text-purple-400 mb-3 uppercase tracking-wider">When this event occurs...</p>
                    <select defaultValue={selectedRule?.trigger || ''} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-purple-500 mb-3">
                      <option value="">Select Trigger Event</option>
                      <option>Phishing Campaign Failed (User clicks link)</option>
                      <option>Phishing Campaign Failed (User submits data)</option>
                      <option>Course Deadline Missed</option>
                      <option>User Created / Synced via SSO</option>
                    </select>
                    <div className="flex gap-2">
                      <button className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-100 px-2.5 py-1 rounded border border-slate-300 transition">+ Add Condition (AND)</button>
                    </div>
                  </div>
                </div>

                {/* Step 2: Action */}
                <div className="flex gap-4 relative z-10">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xl shadow-[0_0_10px_rgba(59,130,246,0.2)]">â–▶</div>
                  <div className="flex-1 bg-white shadow-sm border border-slate-200 p-4 rounded-xl">
                    <p className="text-xs font-semibold text-blue-400 mb-3 uppercase tracking-wider">Do this...</p>
                    <select defaultValue={selectedRule?.action || ''} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500 mb-3">
                      <option value="">Select Action</option>
                      <option>Enroll in Course (Select course...)</option>
                      <option>Send Email Notification (Select template...)</option>
                      <option>Adjust User Risk Score (+/-)</option>
                      <option>Disable Account Access</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-between items-center bg-white shadow-sm">
              <label className="flex items-center cursor-pointer gap-2">
                <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                  <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-blue-500 appearance-none cursor-pointer translate-x-5" />
                  <label className="toggle-label block overflow-hidden h-5 rounded-full bg-blue-500 cursor-pointer"></label>
                </div>
                <span className="text-sm font-medium text-slate-900">Rule Active</span>
              </label>
              <div className="flex gap-3">
                <button onClick={() => { setActiveModal(null); setSelectedRule(null); }} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                <button onClick={() => { setActiveModal(null); setSelectedRule(null); }} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors border border-blue-500">Save Rule</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
