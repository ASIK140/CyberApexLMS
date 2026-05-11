'use client';
import React from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

export default function PlatformAnalyticsPage() {
  const kpiData = [
    { title: 'Uptime (Last 30 Days)', value: '99.97%', trend: 'Target 99.9% ✓', statusColor: 'text-green-400', bgGlow: 'bg-green-500/10' },
    { title: 'API Latency P95', value: '142 ms', trend: '12 ms lower than yesterday', statusColor: 'text-blue-400', bgGlow: 'bg-blue-500/10' },
    { title: 'Error Rate (Last 24 Hours)', value: '0.03%', trend: 'Below threshold', statusColor: 'text-green-400', bgGlow: 'bg-green-500/10' },
    { title: 'Active Sessions', value: '1,247', trend: 'Right now', statusColor: 'text-blue-400', bgGlow: 'bg-blue-500/10' },
  ];

  const serviceStatuses = [
    { name: 'Authentication Service', desc: 'All SSO / OIDC providers – 100% success', statusText: 'Operational', statusColor: 'text-green-400', statusBg: 'bg-green-500/10 border-green-500/20', dotColor: 'bg-green-400' },
    { name: 'Course Delivery CDN', desc: 'Video streaming EU / US – 98 ms average', statusText: 'Operational', statusColor: 'text-green-400', statusBg: 'bg-green-500/10 border-green-500/20', dotColor: 'bg-green-400' },
    { name: 'Email Delivery Service (SES)', desc: '2 tenant DMARC failures', statusText: 'Degraded', statusColor: 'text-orange-400', statusBg: 'bg-orange-500/10 border-orange-500/20', dotColor: 'bg-orange-400' },
    { name: 'Reporting Engine', desc: 'PDF and Excel exports – 100% success', statusText: 'Operational', statusColor: 'text-green-400', statusBg: 'bg-green-500/10 border-green-500/20', dotColor: 'bg-green-400' },
    { name: 'SCIM / SSO Sync', desc: '11 out of 12 tenants syncing', statusText: 'Operational', statusColor: 'text-green-400', statusBg: 'bg-green-500/10 border-green-500/20', dotColor: 'bg-green-400' },
  ];

  const recentIncidents = [
    { time: 'Mar 28 09:14', service: 'Email', desc: 'Acme SES degraded', statusText: 'Ongoing', statusColor: 'text-yellow-400', statusBg: 'bg-yellow-500/10 border-yellow-500/20' },
    { time: 'Mar 27 14:30', service: 'SSO', desc: 'HealthCo Okta certificate expired', statusText: 'Investigating', statusColor: 'text-blue-400', statusBg: 'bg-blue-500/10 border-blue-500/20' },
    { time: 'Mar 26 08:00', service: 'API', desc: 'Latency spike p99 620ms', statusText: 'Resolved', statusColor: 'text-green-400', statusBg: 'bg-green-500/10 border-green-500/20' },
    { time: 'Mar 24 11:22', service: 'CDN', desc: 'Video EU region outage (8 minutes)', statusText: 'Resolved', statusColor: 'text-green-400', statusBg: 'bg-green-500/10 border-green-500/20' },
  ];

  return (
    <SuperAdminLayout title="Platform Analytics">
      <div className="space-y-6">

        {/* Header Description */}
        <div className="-mt-2 mb-4">
          <p className="text-slate-600 text-sm">Real-time infrastructure health, API performance and service status.</p>
        </div>

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi, idx) => (
            <div key={idx} className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden group hover:border-slate-300 transition-colors">
              <div className={`absolute -right-4 -top-4 w-20 h-20 ${kpi.bgGlow} blur-2xl rounded-full opacity-50 group-hover:opacity-70 transition-opacity`}></div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{kpi.title}</p>
              <div className="flex items-end gap-3">
                <p className="text-3xl font-bold text-slate-900">{kpi.value}</p>
              </div>
              <p className={`text-xs mt-2 font-medium ${kpi.statusColor}`}>{kpi.trend}</p>
            </div>
          ))}
        </div>

        {/* Main Dashboard Layout (2 Columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Service Status */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
              <div className="px-5 py-4 border-b border-slate-200 bg-white shadow-sm/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Service Status</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300">Live</span>
              </div>
              <div className="flex-1 p-5 space-y-4">
                {serviceStatuses.map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-slate-300 mb-3 last:mb-0 transition-colors">
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center">
                        <div className={`w-2 h-2 rounded-full ${service.dotColor} ${service.statusText === 'Operational' ? '' : 'animate-pulse'}`}></div>
                      </div>
                      <div className="flex flex-col mb-1 text-left items-start">
                        <p className="font-semibold text-slate-900 text-sm whitespace-nowrap">{service.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{service.desc}</p>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ml-4 ${service.statusColor} ${service.statusBg}`}>
                      {service.statusText}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Recent Incidents */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl flex flex-col h-full overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-white shadow-sm/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Recent Incidents</h3>
                <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View incident history →</button>
              </div>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                      <th className="p-4 font-semibold">Time</th>
                      <th className="p-4 font-semibold">Service</th>
                      <th className="p-4 font-semibold">Description</th>
                      <th className="p-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-slate-700">
                    {recentIncidents.map((inc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 text-slate-600 text-xs whitespace-nowrap">{inc.time}</td>
                        <td className="p-4 font-medium text-slate-900">{inc.service}</td>
                        <td className="p-4 text-slate-700">{inc.desc}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-[10px] font-bold rounded-full border ${inc.statusColor} ${inc.statusBg}`}>
                            {inc.statusText}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </SuperAdminLayout>
  );
}
