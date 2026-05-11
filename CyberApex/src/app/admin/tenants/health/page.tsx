'use client';
import React, { useState } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const tenants = [
  {
    id: 'T-001', name: 'Global Finance Ltd.', plan: 'Enterprise', seats: 287, activeUsers: 261,
    engagementRate: 91, courseCompletion: 84, riskScore: 22, phishingClickRate: 4.1,
    lastActivity: '2025-03-07', complianceStatus: 'Compliant', healthStatus: 'Healthy', trend: 'up',
  },
  {
    id: 'T-002', name: 'Acme Corporation', plan: 'Enterprise', seats: 340, activeUsers: 289,
    engagementRate: 85, courseCompletion: 72, riskScore: 38, phishingClickRate: 8.2,
    lastActivity: '2025-03-07', complianceStatus: 'At Risk', healthStatus: 'Warning', trend: 'down',
  },
  {
    id: 'T-003', name: 'TechNova Inc.', plan: 'Pro', seats: 124, activeUsers: 98,
    engagementRate: 79, courseCompletion: 68, riskScore: 45, phishingClickRate: 11.3,
    lastActivity: '2025-03-06', complianceStatus: 'Non-Compliant', healthStatus: 'Critical', trend: 'down',
  },
  {
    id: 'T-004', name: 'MediCare Group', plan: 'Pro', seats: 89, activeUsers: 82,
    engagementRate: 92, courseCompletion: 88, riskScore: 18, phishingClickRate: 2.9,
    lastActivity: '2025-03-07', complianceStatus: 'Compliant', healthStatus: 'Healthy', trend: 'up',
  },
  {
    id: 'T-005', name: 'SecureBank PLC', plan: 'Enterprise', seats: 450, activeUsers: 391,
    engagementRate: 87, courseCompletion: 79, riskScore: 31, phishingClickRate: 6.4,
    lastActivity: '2025-03-07', complianceStatus: 'At Risk', healthStatus: 'Warning', trend: 'stable',
  },
  {
    id: 'T-006', name: 'RetailMax', plan: 'Starter', seats: 65, activeUsers: 44,
    engagementRate: 68, courseCompletion: 55, riskScore: 62, phishingClickRate: 18.7,
    lastActivity: '2025-03-05', complianceStatus: 'Non-Compliant', healthStatus: 'Critical', trend: 'down',
  },
  {
    id: 'T-007', name: 'LegalShield', plan: 'Starter', seats: 38, activeUsers: 35,
    engagementRate: 92, courseCompletion: 91, riskScore: 14, phishingClickRate: 1.8,
    lastActivity: '2025-03-07', complianceStatus: 'Compliant', healthStatus: 'Healthy', trend: 'up',
  },
];

const healthBadge = (status: string) => ({
  Healthy: 'text-green-400 bg-green-400/10 border-green-500/20',
  Warning: 'text-orange-400 bg-orange-400/10 border-orange-500/20',
  Critical: 'text-red-400 bg-red-400/10 border-red-500/20',
}[status] || 'text-slate-600 bg-slate-100 border-slate-300');

const complianceBadge = (status: string) => ({
  'Compliant': 'text-green-400 bg-green-400/10 border-green-500/20',
  'At Risk': 'text-orange-400 bg-orange-400/10 border-orange-500/20',
  'Non-Compliant': 'text-red-400 bg-red-400/10 border-red-500/20',
}[status] || 'text-slate-600 bg-slate-100 border-slate-300');

const planBadge = (plan: string) => ({
  Enterprise: 'text-purple-400 border-purple-500/30',
  Pro: 'text-blue-400 border-blue-500/30',
  Starter: 'text-slate-600 border-neutral-600',
}[plan] || 'text-slate-600 border-slate-300');

const riskColor = (score: number) => {
  if (score >= 50) return 'text-red-400';
  if (score >= 30) return 'text-orange-400';
  return 'text-green-400';
};

const riskBarColor = (score: number) => {
  if (score >= 50) return 'bg-red-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-green-500';
};


export default function TenantHealthPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState('All');
  const [alertModalTenant, setAlertModalTenant] = useState<any | null>(null);
  const [detailModalTenant, setDetailModalTenant] = useState<any | null>(null);

  const filtered = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHealth = healthFilter === 'All' || t.healthStatus === healthFilter;
    return matchesSearch && matchesHealth;
  });

  const healthyCount = tenants.filter(t => t.healthStatus === 'Healthy').length;
  const warningCount = tenants.filter(t => t.healthStatus === 'Warning').length;
  const criticalCount = tenants.filter(t => t.healthStatus === 'Critical').length;
  const avgEngagement = Math.round(tenants.reduce((a, t) => a + t.engagementRate, 0) / tenants.length);
  const avgCompletion = Math.round(tenants.reduce((a, t) => a + t.courseCompletion, 0) / tenants.length);
  const avgRisk = Math.round(tenants.reduce((a, t) => a + t.riskScore, 0) / tenants.length);

  return (
    <SuperAdminLayout title="Tenant Health">
      <div className="flex flex-col gap-6">

        {/* Subtitle */}
        <p className="text-slate-600 text-sm -mt-2">Monitor health status, engagement, compliance, and risk across all tenants.</p>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 relative overflow-hidden col-span-1">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
            <p className="text-xs text-slate-500 mb-1">Healthy</p>
            <p className="text-3xl font-bold text-green-400">{healthyCount}</p>
            <p className="text-xs text-slate-500 mt-1">tenants</p>
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 relative overflow-hidden col-span-1">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
            <p className="text-xs text-slate-500 mb-1">Warning</p>
            <p className="text-3xl font-bold text-orange-400">{warningCount}</p>
            <p className="text-xs text-slate-500 mt-1">tenants</p>
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 relative overflow-hidden col-span-1">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            <p className="text-xs text-slate-500 mb-1">Critical</p>
            <p className="text-3xl font-bold text-red-400">{criticalCount}</p>
            <p className="text-xs text-slate-500 mt-1">tenants</p>
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 relative overflow-hidden col-span-1">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
            <p className="text-xs text-slate-500 mb-1">Avg Engagement</p>
            <p className="text-3xl font-bold text-blue-400">{avgEngagement}%</p>
            <p className="text-xs text-slate-500 mt-1">across all</p>
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 relative overflow-hidden col-span-1">
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
            <p className="text-xs text-slate-500 mb-1">Avg Completion</p>
            <p className="text-3xl font-bold text-purple-400">{avgCompletion}%</p>
            <p className="text-xs text-slate-500 mt-1">course rate</p>
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-4 relative overflow-hidden col-span-1">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
            <p className="text-xs text-slate-500 mb-1">Avg Risk Score</p>
            <p className={`text-3xl font-bold ${riskColor(avgRisk)}`}>{avgRisk}</p>
            <p className="text-xs text-slate-500 mt-1">out of 100</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
          <div className="relative w-full sm:w-80">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text" placeholder="Search tenants..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {['All', 'Healthy', 'Warning', 'Critical'].map(f => (
              <button
                key={f} onClick={() => setHealthFilter(f)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${healthFilter === f
                  ? f === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/40'
                    : f === 'Warning' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                      : f === 'Healthy' ? 'bg-green-500/20 text-green-400 border-green-500/40'
                        : 'bg-slate-100 text-slate-900 border-slate-300'
                  : 'bg-white shadow-sm text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50 border border-slate-100'
                  }`}
              >{f}</button>
            ))}
          </div>
        </div>

        {/* Tenant Health Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="px-5 py-3.5 font-semibold">Tenant</th>
                  <th className="px-5 py-3.5 font-semibold">Plan</th>
                  <th className="px-5 py-3.5 font-semibold">Health</th>
                  <th className="px-5 py-3.5 font-semibold">Active Users</th>
                  <th className="px-5 py-3.5 font-semibold">Engagement</th>
                  <th className="px-5 py-3.5 font-semibold">Course Completion</th>
                  <th className="px-5 py-3.5 font-semibold">Risk Score</th>
                  <th className="px-5 py-3.5 font-semibold">Phishing Rate</th>
                  <th className="px-5 py-3.5 font-semibold">Compliance</th>
                  <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {filtered.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Last active: {t.lastActivity}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-full border bg-slate-50 ${planBadge(t.plan)}`}>{t.plan}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${healthBadge(t.healthStatus)}`}>
                        {t.healthStatus === 'Healthy' ? '● ' : t.healthStatus === 'Warning' ? '▲ ' : '◆ '}{t.healthStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-slate-900 font-semibold text-sm">{t.activeUsers} <span className="text-slate-500 font-normal text-xs">/ {t.seats}</span></p>
                        <div className="mt-1.5 w-24 bg-slate-100 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(t.activeUsers / t.seats) * 100}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className={`font-semibold text-sm ${t.engagementRate >= 85 ? 'text-green-400' : t.engagementRate >= 70 ? 'text-orange-400' : 'text-red-400'}`}>{t.engagementRate}%</p>
                        <div className="mt-1.5 w-20 bg-slate-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${t.engagementRate >= 85 ? 'bg-green-500' : t.engagementRate >= 70 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${t.engagementRate}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <p className={`font-semibold text-sm ${t.courseCompletion >= 80 ? 'text-green-400' : t.courseCompletion >= 60 ? 'text-orange-400' : 'text-red-400'}`}>{t.courseCompletion}%</p>
                        <div className="mt-1.5 w-20 bg-slate-100 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${t.courseCompletion >= 80 ? 'bg-green-500' : t.courseCompletion >= 60 ? 'bg-orange-500' : 'bg-red-500'}`} style={{ width: `${t.courseCompletion}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-100 rounded-full h-2">
                          <div className={`h-2 rounded-full ${riskBarColor(t.riskScore)}`} style={{ width: `${t.riskScore}%` }}></div>
                        </div>
                        <span className={`text-sm font-bold ${riskColor(t.riskScore)}`}>{t.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-semibold ${t.phishingClickRate >= 10 ? 'text-red-400' : t.phishingClickRate >= 6 ? 'text-orange-400' : 'text-green-400'}`}>
                        {t.phishingClickRate}%
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${complianceBadge(t.complianceStatus)}`}>{t.complianceStatus}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex gap-1.5 justify-end">
                        <button onClick={() => setDetailModalTenant(t)} className="px-3 py-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-300 transition-colors">
                          View
                        </button>
                        {(t.healthStatus === 'Critical' || t.healthStatus === 'Warning') && (
                          <button onClick={() => setAlertModalTenant(t)} className="px-3 py-1.5 text-[11px] font-bold bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg border border-red-500/20 transition-colors">
                            Alert
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={10} className="px-6 py-12 text-center text-slate-500">No tenants match your filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 bg-white shadow-sm/50">
            <span>Showing {filtered.length} of {tenants.length} tenants</span>
            <div className="flex gap-2 items-center">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span> Compliant: {tenants.filter(t => t.complianceStatus === 'Compliant').length}
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block ml-2"></span> At Risk: {tenants.filter(t => t.complianceStatus === 'At Risk').length}
              <span className="w-2 h-2 rounded-full bg-red-400 inline-block ml-2"></span> Non-Compliant: {tenants.filter(t => t.complianceStatus === 'Non-Compliant').length}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tenant Detail Modal ── */}
      {detailModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm/50">
              <div>
                <h3 className="font-bold text-lg text-slate-900">{detailModalTenant.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{detailModalTenant.id} &bull; {detailModalTenant.plan} Plan</p>
              </div>
              <button onClick={() => setDetailModalTenant(null)} className="text-slate-500 hover:text-slate-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Health Status', value: detailModalTenant.healthStatus, color: detailModalTenant.healthStatus === 'Healthy' ? 'text-green-400' : detailModalTenant.healthStatus === 'Warning' ? 'text-orange-400' : 'text-red-400' },
                  { label: 'Compliance', value: detailModalTenant.complianceStatus, color: detailModalTenant.complianceStatus === 'Compliant' ? 'text-green-400' : detailModalTenant.complianceStatus === 'At Risk' ? 'text-orange-400' : 'text-red-400' },
                  { label: 'Active Users', value: `${detailModalTenant.activeUsers} / ${detailModalTenant.seats}`, color: 'text-slate-900' },
                  { label: 'Engagement Rate', value: `${detailModalTenant.engagementRate}%`, color: 'text-blue-400' },
                  { label: 'Course Completion', value: `${detailModalTenant.courseCompletion}%`, color: 'text-purple-400' },
                  { label: 'Phishing Click Rate', value: `${detailModalTenant.phishingClickRate}%`, color: detailModalTenant.phishingClickRate >= 10 ? 'text-red-400' : 'text-orange-400' },
                  { label: 'Risk Score', value: `${detailModalTenant.riskScore} / 100`, color: riskColor(detailModalTenant.riskScore) },
                  { label: 'Last Activity', value: detailModalTenant.lastActivity, color: 'text-slate-700' },
                ].map(item => (
                  <div key={item.label} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                    <p className={`text-base font-bold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-white shadow-sm/50 flex justify-end gap-3">
              <button onClick={() => setDetailModalTenant(null)} className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Close</button>
              <button onClick={() => { setAlertModalTenant(detailModalTenant); setDetailModalTenant(null); }} className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors">Send Alert</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Alert Modal ── */}
      {alertModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900">Send Health Alert</h3>
              <button onClick={() => setAlertModalTenant(null)} className="text-slate-500 hover:text-slate-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-300">
                Tenant <span className="font-bold text-slate-900">{alertModalTenant.name}</span> is currently in a <span className="font-bold">{alertModalTenant.healthStatus}</span> health state. An alert will be sent to their Tenant Admin.
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Alert Type</label>
                <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors appearance-none cursor-pointer">
                  <option>Engagement Warning</option>
                  <option>Compliance Deadline Reminder</option>
                  <option>High Risk Score Alert</option>
                  <option>Phishing Training Required</option>
                  <option>General Health Advisory</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Additional Message (Optional)</label>
                <textarea rows={3} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors resize-none" placeholder="Include a personal note for the tenant admin..."></textarea>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setAlertModalTenant(null)} className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Cancel</button>
              <button onClick={() => setAlertModalTenant(null)} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                Send Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
