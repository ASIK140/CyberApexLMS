'use client';
import React, { useState } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const activityLogs = [
  { id: 'ACT-1001', tenant: 'Global Finance Ltd.', user: 'Sarah Mitchell', event: 'Course Completed', detail: 'Advanced Phishing Awareness (Level 3)', type: 'course', timestamp: '2025-03-07 14:53', ip: '10.14.2.91' },
  { id: 'ACT-1002', tenant: 'TechNova Inc.', user: 'Dev Kapoor', event: 'Phishing Simulation Failed', detail: 'Q1 Simulation – Clicked suspicious link', type: 'phishing', timestamp: '2025-03-07 14:41', ip: '10.22.5.18' },
  { id: 'ACT-1003', tenant: 'Acme Corporation', user: 'Admin User', event: 'Policy Acknowledged', detail: 'GDPR Data Handling Policy v3.2', type: 'compliance', timestamp: '2025-03-07 14:30', ip: '10.31.1.5' },
  { id: 'ACT-1004', tenant: 'MediCare Group', user: 'Priya Sharma', event: 'Login Success', detail: 'SSO – Microsoft Azure AD', type: 'auth', timestamp: '2025-03-07 14:22', ip: '192.168.10.44' },
  { id: 'ACT-1005', tenant: 'SecureBank PLC', user: 'James Whitmore', event: 'Quiz Failed', detail: 'Social Engineering Awareness quiz – Score: 48%', type: 'course', timestamp: '2025-03-07 14:10', ip: '172.16.8.20' },
  { id: 'ACT-1006', tenant: 'RetailMax', user: 'Anna Lee', event: 'Login Failed', detail: 'Invalid credentials – 3rd attempt', type: 'auth', timestamp: '2025-03-07 13:58', ip: '10.45.0.12' },
  { id: 'ACT-1007', tenant: 'Global Finance Ltd.', user: 'Admin', event: 'User Invited', detail: 'New user: j.morrison@globalfinance.com', type: 'admin', timestamp: '2025-03-07 13:45', ip: '10.14.2.1' },
  { id: 'ACT-1008', tenant: 'LegalShield', user: 'Mark Chen', event: 'Course Completed', detail: 'HIPAA Compliance Basics', type: 'course', timestamp: '2025-03-07 13:30', ip: '10.9.3.77' },
  { id: 'ACT-1009', tenant: 'TechNova Inc.', user: 'Admin', event: 'SSO Configuration Changed', detail: 'SAML IdP endpoint updated', type: 'admin', timestamp: '2025-03-07 13:22', ip: '10.22.0.1' },
  { id: 'ACT-1010', tenant: 'Acme Corporation', user: 'Ravi Patel', event: 'Phishing Simulation Passed', detail: 'Q1 Simulation – Reported suspicious email', type: 'phishing', timestamp: '2025-03-07 13:05', ip: '10.31.4.9' },
  { id: 'ACT-1011', tenant: 'SecureBank PLC', user: 'Emma Clarke', event: 'Report Downloaded', detail: 'Compliance Summary – Feb 2025', type: 'compliance', timestamp: '2025-03-07 12:55', ip: '172.16.8.44' },
  { id: 'ACT-1012', tenant: 'MediCare Group', user: 'Admin', event: 'Module Assigned', detail: 'ISO 27001 Awareness – 82 users', type: 'admin', timestamp: '2025-03-07 12:40', ip: '192.168.10.1' },
];

const usageMetrics = [
  { tenant: 'Global Finance Ltd.', logins: 287, courseActions: 142, simulations: 18, adminActions: 12, lastEvent: '14:53' },
  { tenant: 'Acme Corporation', logins: 210, courseActions: 98, simulations: 14, adminActions: 8, lastEvent: '14:30' },
  { tenant: 'TechNova Inc.', logins: 128, courseActions: 64, simulations: 22, adminActions: 6, lastEvent: '14:41' },
  { tenant: 'MediCare Group', logins: 89, courseActions: 77, simulations: 9, adminActions: 5, lastEvent: '14:22' },
  { tenant: 'SecureBank PLC', logins: 391, courseActions: 203, simulations: 31, adminActions: 19, lastEvent: '14:10' },
  { tenant: 'RetailMax', logins: 44, courseActions: 22, simulations: 5, adminActions: 2, lastEvent: '13:58' },
  { tenant: 'LegalShield', logins: 35, courseActions: 33, simulations: 4, adminActions: 1, lastEvent: '13:30' },
];

const eventTypeBadge = (type: string) => ({
  course: 'text-blue-400 bg-blue-400/10 border-blue-500/20',
  phishing: 'text-orange-400 bg-orange-400/10 border-orange-500/20',
  compliance: 'text-green-400 bg-green-400/10 border-green-500/20',
  auth: 'text-purple-400 bg-purple-400/10 border-purple-500/20',
  admin: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20',
}[type] || 'text-slate-600 bg-slate-100 border-slate-300');

const eventTypeLabel = (type: string) => ({
  course: 'Course',
  phishing: 'Phishing',
  compliance: 'Compliance',
  auth: 'Auth',
  admin: 'Admin',
}[type] || type);

export default function TenantActivityPage() {
  const [search, setSearch] = useState('');
  const [tenantFilter, setTenantFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [activeTab, setActiveTab] = useState<'logs' | 'usage'>('logs');
  const [detailLog, setDetailLog] = useState<any | null>(null);

  const tenantNames = ['All', ...Array.from(new Set(activityLogs.map(l => l.tenant)))];

  const filteredLogs = activityLogs.filter(l => {
    const matchSearch = l.user.toLowerCase().includes(search.toLowerCase()) || l.event.toLowerCase().includes(search.toLowerCase()) || l.tenant.toLowerCase().includes(search.toLowerCase());
    const matchTenant = tenantFilter === 'All' || l.tenant === tenantFilter;
    const matchType = typeFilter === 'All' || l.type === typeFilter;
    return matchSearch && matchTenant && matchType;
  });

  return (
    <SuperAdminLayout title="Tenant Activity">
      <div className="flex flex-col gap-6">

        {/* Subtitle */}
        <p className="text-slate-600 text-sm -mt-2">Real-time activity logs and usage metrics across all tenant workspaces.</p>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Events Today', value: activityLogs.length, color: 'text-slate-900', bar: 'bg-white' },
            { label: 'Course Events', value: activityLogs.filter(l => l.type === 'course').length, color: 'text-blue-400', bar: 'bg-blue-500' },
            { label: 'Phishing Events', value: activityLogs.filter(l => l.type === 'phishing').length, color: 'text-orange-400', bar: 'bg-orange-500' },
            { label: 'Auth Events', value: activityLogs.filter(l => l.type === 'auth').length, color: 'text-purple-400', bar: 'bg-purple-500' },
            { label: 'Admin Events', value: activityLogs.filter(l => l.type === 'admin').length, color: 'text-yellow-400', bar: 'bg-yellow-500' },
          ].map(s => (
            <div key={s.label} className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1 ${s.bar}`}></div>
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-white shadow-sm border border-slate-200 rounded-xl p-1 w-fit">
          <button onClick={() => setActiveTab('logs')} className={`px-5 py-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'logs' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            Activity Logs
          </button>
          <button onClick={() => setActiveTab('usage')} className={`px-5 py-2 text-xs font-semibold rounded-lg transition-colors ${activeTab === 'usage' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
            Usage Summary
          </button>
        </div>

        {activeTab === 'logs' && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 sm:max-w-sm">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" placeholder="Search by user, event or tenant..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-neutral-600 transition-colors" />
              </div>
              <select value={tenantFilter} onChange={e => setTenantFilter(e.target.value)} className="px-4 py-2.5 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none appearance-none cursor-pointer">
                {tenantNames.map(t => <option key={t}>{t}</option>)}
              </select>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-4 py-2.5 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none appearance-none cursor-pointer">
                {['All', 'course', 'phishing', 'compliance', 'auth', 'admin'].map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : eventTypeLabel(t)}</option>)}
              </select>
            </div>

            {/* Activity Log Table */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm whitespace-nowrap">
                  <thead className="bg-slate-50/50 border-b border-slate-200">
                    <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                      <th className="px-5 py-3.5 text-left font-semibold">Event ID</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Tenant</th>
                      <th className="px-5 py-3.5 text-left font-semibold">User</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Event</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Type</th>
                      <th className="px-5 py-3.5 text-left font-semibold">Timestamp</th>
                      <th className="px-5 py-3.5 text-right font-semibold">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50">
                    {filteredLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{log.id}</td>
                        <td className="px-5 py-3.5 font-semibold text-slate-900 text-xs">{log.tenant}</td>
                        <td className="px-5 py-3.5 text-slate-700 text-xs">{log.user}</td>
                        <td className="px-5 py-3.5">
                          <div>
                            <p className="text-slate-900 text-xs font-medium">{log.event}</p>
                            <p className="text-slate-500 text-[10px] mt-0.5 truncate max-w-xs">{log.detail}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${eventTypeBadge(log.type)}`}>{eventTypeLabel(log.type)}</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">{log.timestamp}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button onClick={() => setDetailLog(log)} className="px-3 py-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-300 transition-colors">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredLogs.length === 0 && (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">No activity logs match your filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 bg-white shadow-sm/50">
                <span>Showing {filteredLogs.length} of {activityLogs.length} events</span>
                <div className="flex gap-1">
                  <button className="px-3 py-1.5 rounded bg-slate-100 text-slate-600 opacity-50 cursor-not-allowed">Prev</button>
                  <button className="px-3 py-1.5 rounded bg-blue-600/20 text-blue-400 font-medium">1</button>
                  <button className="px-3 py-1.5 rounded bg-slate-100 text-slate-600 hover:text-slate-900">Next</button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'usage' && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900 text-sm">Tenant Usage Summary — Today</h3>
              <p className="text-xs text-slate-500 mt-0.5">Aggregated event counts per tenant for the current day</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                    <th className="px-5 py-3.5 text-left font-semibold">Tenant</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Total Logins</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Course Actions</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Simulation Events</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Admin Actions</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Last Event</th>
                    <th className="px-5 py-3.5 text-left font-semibold">Activity Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {usageMetrics.map(m => {
                    const total = m.logins + m.courseActions + m.simulations + m.adminActions;
                    const maxTotal = Math.max(...usageMetrics.map(x => x.logins + x.courseActions + x.simulations + x.adminActions));
                    const activityPct = Math.round((total / maxTotal) * 100);
                    return (
                      <tr key={m.tenant} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-900">{m.tenant}</td>
                        <td className="px-5 py-4 text-blue-400 font-semibold">{m.logins}</td>
                        <td className="px-5 py-4 text-purple-400 font-semibold">{m.courseActions}</td>
                        <td className="px-5 py-4 text-orange-400 font-semibold">{m.simulations}</td>
                        <td className="px-5 py-4 text-yellow-400 font-semibold">{m.adminActions}</td>
                        <td className="px-5 py-4 text-slate-600 text-xs">Today {m.lastEvent}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-28 bg-slate-100 rounded-full h-2">
                              <div className={`h-2 rounded-full ${activityPct >= 70 ? 'bg-green-500' : activityPct >= 40 ? 'bg-blue-500' : 'bg-neutral-600'}`} style={{ width: `${activityPct}%` }}></div>
                            </div>
                            <span className="text-xs text-slate-600">{activityPct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Event Detail Modal ── */}
      {detailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Event Detail</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{detailLog.id}</p>
              </div>
              <button onClick={() => setDetailLog(null)} className="text-slate-500 hover:text-slate-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${eventTypeBadge(detailLog.type)}`}>{eventTypeLabel(detailLog.type)}</span>
                <span className="text-xs text-slate-500">{detailLog.timestamp}</span>
              </div>
              {[
                { label: 'Event', value: detailLog.event },
                { label: 'Detail', value: detailLog.detail },
                { label: 'Tenant', value: detailLog.tenant },
                { label: 'User', value: detailLog.user },
                { label: 'IP Address', value: detailLog.ip },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-start gap-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs text-slate-500 w-24 flex-shrink-0">{item.label}</p>
                  <p className="text-sm text-slate-900 text-right font-medium">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setDetailLog(null)} className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Close</button>
              <button className="px-5 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-medium rounded-lg border border-slate-300 transition-colors">Flag Event</button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
