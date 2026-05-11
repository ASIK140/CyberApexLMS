'use client';
import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

export default function PlatformHealthPage() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHealth = async () => {
            try {
                const { apiFetch } = await import('@/utils/api');
                const res = await apiFetch('/admin/platform-health');
                const json = await res.json();
                if (json.success) {
                    setHealth(json.data);
                } else {
                    setError('Failed to fetch platform health');
                }
            } catch (err) {
                setError('Network error connecting to API');
            } finally {
                setLoading(false);
            }
        };
        fetchHealth();
    }, []);

    if (loading) return (
        <SuperAdminLayout title="Platform Health">
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span className="ml-3 text-slate-600">Loading infrastructure status...</span>
            </div>
        </SuperAdminLayout>
    );

    if (error) return (
        <SuperAdminLayout title="Platform Health">
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <p className="font-bold">Error</p>
                <p className="text-sm">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Retry</button>
            </div>
        </SuperAdminLayout>
    );

    const kpiData = [
        { title: 'Uptime (Last 30 Days)', value: '99.98%', trend: `Uptime: ${health.server.uptime_days} days`, statusColor: 'text-green-400', bgGlow: 'bg-green-500/10' },
        { title: 'API Latency P95', value: `${health.api.latency_ms} ms`, trend: 'Real-time from server', statusColor: 'text-blue-400', bgGlow: 'bg-blue-500/10' },
        { title: 'Error Rate (Last 24 Hours)', value: `${health.api.error_rate_pct}%`, trend: 'Below threshold', statusColor: 'text-green-400', bgGlow: 'bg-green-500/10' },
        { title: 'Active Sessions', value: health.api.active_sessions.toLocaleString(), trend: 'Right now', statusColor: 'text-blue-400', bgGlow: 'bg-blue-500/10' },
    ];

    const serviceStatuses = health.services.map((s: any) => ({
        name: s.name,
        desc: `Latency: ${s.latency_ms}ms – ${s.status === 'healthy' ? 'Normal' : 'Issues'}`,
        statusText: s.status === 'healthy' ? 'Operational' : 'Degraded',
        statusColor: s.status === 'healthy' ? 'text-green-400' : 'text-orange-400',
        statusBg: s.status === 'healthy' ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20',
        dotColor: s.status === 'healthy' ? 'bg-green-400' : 'bg-orange-400'
    }));

    const recentIncidents = [
        { time: 'Mar 28 09:14', service: 'Email', desc: 'Acme SES degraded', statusText: 'Ongoing', statusColor: 'text-yellow-400', statusBg: 'bg-yellow-500/10 border-yellow-500/20' },
        { time: 'Mar 27 14:30', service: 'SSO', desc: 'HealthCo Okta certificate expired', statusText: 'Investigating', statusColor: 'text-blue-400', statusBg: 'bg-blue-500/10 border-blue-500/20' },
        { time: 'Mar 26 08:00', service: 'API', desc: 'Latency spike p99 620ms', statusText: 'Resolved', statusColor: 'text-green-400', statusBg: 'bg-green-500/10 border-green-500/20' },
        { time: 'Mar 24 11:22', service: 'CDN', desc: 'Video EU region outage (8 minutes)', statusText: 'Resolved', statusColor: 'text-green-400', statusBg: 'bg-green-500/10 border-green-500/20' },
    ];

  return (
    <SuperAdminLayout title="Platform Health">
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
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full">
              <div className="px-5 py-4 border-b border-slate-200 bg-white shadow-sm/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Service Status</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300">Live</span>
              </div>
              <div className="flex-1 p-5 space-y-4">
                {serviceStatuses.map((service: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50 hover:border-slate-300 mb-3 last:mb-0 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center">
                        <div className={`w-2 h-2 rounded-full ${service.dotColor} ${service.statusText === 'Operational' ? '' : 'animate-pulse'}`}></div>
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{service.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{service.desc}</p>
                      </div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border whitespace-nowrap ${service.statusColor} ${service.statusBg}`}>
                      {service.statusText}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Recent Incidents */}
          <div className="lg:col-span-7 flex flex-col gap-4">
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
                    {recentIncidents.map((inc: any, idx: number) => (
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
