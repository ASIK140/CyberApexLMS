'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

export default function GlobalRiskOverviewPage() {
  const [riskData, setRiskData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);

  const fetchRisk = async () => {
    setLoading(true);
    try {
        const { apiFetch } = await import('@/utils/api');
        const res = await apiFetch('/admin/dashboard');
        const json = await res.json();
        if (json.success) {
            setRiskData(json.data.risk);
        } else {
            setError('Failed to fetch risk metrics');
        }
    } catch (err) {
        setError('Network error connecting to API');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisk();
  }, []);

  const handleNotifyAll = async () => {
    if (notifying) return;
    setNotifying(true);
    try {
        const { apiFetch } = await import('@/utils/api');
        const notifications = highestRiskTenants.map(t => ({
            type: 'escalation',
            title: `High Risk Alert: ${t.name}`,
            message: `Tenant ${t.name} has been identified as high-risk (${t.riskLevel}). Immediate action recommended.`,
            severity: t.riskLevel.toLowerCase() === 'critical' ? 'critical' : 'high',
            tenant_id: t.name.toLowerCase().replace(/\s+/g, '_') // Mocking tenant ID
        }));

        const res = await apiFetch('/admin/notifications/bulk', {
            method: 'POST',
            body: JSON.stringify({ notifications })
        });
        const json = await res.json();
        if (json.success) {
            setNotifySuccess(true);
            setTimeout(() => setNotifySuccess(false), 3000);
        }
    } catch (err) {
        console.error('Failed to send bulk notifications:', err);
    } finally {
        setNotifying(false);
    }
  };

  const kpiData = [
    { title: 'Global Risk Score', value: riskData ? `${riskData.global_human_risk_score}/100` : '--', trend: 'Average', statusColor: 'text-yellow-400', bgGlow: 'bg-yellow-500/10' },
    { title: 'Tenants at High Risk', value: riskData ? riskData.critical_risk_tenants.toString() : '0', trend: 'Needs immediate action', statusColor: 'text-red-400', bgGlow: 'bg-red-500/10' },
    { title: 'Avg Phishing Failure', value: '14.2%', trend: '+1.5% from last month', statusColor: 'text-orange-400', bgGlow: 'bg-orange-500/10' },
    { title: 'Critical Anomalies', value: riskData ? riskData.critical_risk_tenants.toString() : '0', trend: 'Detected last 24h', statusColor: 'text-red-400', bgGlow: 'bg-red-500/10' },
  ];

  const highestRiskTenants = [
    { name: 'Acme Corp', industry: 'Finance', score: 'D', riskLevel: 'Critical', color: 'bg-red-500', trend: 'Declining' },
    { name: 'Globex Inc', industry: 'Healthcare', score: 'C-', riskLevel: 'High', color: 'bg-orange-500', trend: 'Stable' },
    { name: 'Initech', industry: 'Technology', score: 'C', riskLevel: 'High', color: 'bg-orange-500', trend: 'Improving' },
    { name: 'Massive Dynamic', industry: 'Defense', score: 'C+', riskLevel: 'Elevated', color: 'bg-yellow-500', trend: 'Declining' },
  ];

  const vulnerabilityCategories = [
    { name: 'Unpatched Software', count: 432, percentage: 45, color: 'bg-purple-500' },
    { name: 'Weak Passwords', count: 215, percentage: 22, color: 'bg-blue-500' },
    { name: 'Misconfigurations', count: 180, percentage: 19, color: 'bg-orange-500' },
    { name: 'Stale Accounts', count: 134, percentage: 14, color: 'bg-neutral-500' },
  ];

  const latestAlerts = [
    { severity: 'CRITICAL', title: 'Ransomware indicator detected in Acme Corp network', time: '10 min ago', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    { severity: 'HIGH', title: 'Abnormal login volume from unrecognized IPs across 3 tenants', time: '1 hour ago', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
    { severity: 'MEDIUM', title: 'Drop in training completion rates (Globex Inc)', time: '4 hours ago', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    { severity: 'INFO', title: 'Weekly vulnerability scan completed successfully', time: '5 hours ago', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  ];

  return (
    <SuperAdminLayout title="Global Risk Overview">
      <div className="space-y-6">

        {/* Header Description */}
        <div className="-mt-2 mb-4">
          <p className="text-slate-600 text-sm">Aggregate risk scores, vulnerability distributions, and critical alerts across all platform tenants.</p>
        </div>

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi, idx) => (
            <div key={idx} className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden group hover:border-slate-300 transition-colors cursor-default">
              <div className={`absolute -right-4 -top-4 w-24 h-24 ${kpi.bgGlow} blur-3xl rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{kpi.title}</p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-bold text-slate-900">{kpi.value}</p>
              </div>
              <p className={`text-xs mt-2 font-medium ${kpi.statusColor}`}>{kpi.trend}</p>
            </div>
          ))}
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left Column: Top Risk Tenants & Vulnerability Categories */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* Top Risk Tenants Table */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden shadow-lg">
              <div className="px-5 py-4 border-b border-slate-200 bg-white shadow-sm/50 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">Tenants Requiring Attention</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Highest organizational risk scores across the platform.</p>
                </div>
                <button 
                  onClick={handleNotifyAll}
                  disabled={notifying}
                  className={`text-xs font-medium transition-all border px-3 py-1.5 rounded-lg flex items-center gap-2 ${
                    notifySuccess 
                      ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                      : 'bg-red-500/10 border-red-500/20 text-red-400 hover:text-red-300'
                  }`}
                >
                  {notifying ? (
                    <>
                      <div className="w-3 h-3 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                      Notifying...
                    </>
                  ) : notifySuccess ? (
                    <>
                      <span>✓</span> Sent
                    </>
                  ) : (
                    'Notify All'
                  )}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider">
                      <th className="p-4 font-semibold">Tenant Name</th>
                      <th className="p-4 font-semibold">Industry</th>
                      <th className="p-4 font-semibold">Risk Score</th>
                      <th className="p-4 font-semibold">Risk Level</th>
                      <th className="p-4 font-semibold text-right">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800 text-slate-700">
                    {highestRiskTenants.map((tenant, idx) => (
                      <tr key={idx} className="hover:bg-slate-100/40 transition-colors">
                        <td className="p-4 font-bold text-slate-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-xs border border-slate-300">
                            {tenant.name.substring(0, 2).toUpperCase()}
                          </div>
                          {tenant.name}
                        </td>
                        <td className="p-4 text-slate-600 text-xs">{tenant.industry}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${tenant.score.startsWith('D') ? 'text-red-400' : 'text-orange-400'}`}>{tenant.score}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${tenant.color}`}></div>
                            <span className="text-xs">{tenant.riskLevel}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right text-xs text-slate-600">
                          {tenant.trend}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vulnerability Distribution */}
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden shadow-lg p-5">
              <h3 className="font-bold text-slate-900 mb-1">Global Vulnerability Distribution</h3>
              <p className="text-xs text-slate-500 mb-6">Aggregate breakdown of identified risks from connected integrations.</p>

              <div className="space-y-5">
                {vulnerabilityCategories.map((cat, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-1.5">
                      <span className="text-sm font-medium text-slate-700">{cat.name} <span className="text-slate-500 text-xs ml-1">({cat.count} instances)</span></span>
                      <span className="text-xs font-bold text-slate-900">{cat.percentage}%</span>
                    </div>
                    <div className="w-full bg-slate-50 rounded-full h-2.5 border border-slate-200 overflow-hidden">
                      <div className={`h-2.5 rounded-full ${cat.color} relative overflow-hidden`} style={{ width: `${cat.percentage}%` }}>
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', transform: 'skewX(-20deg)' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Active Threats / Alerts */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full shadow-lg">
              <div className="px-5 py-4 border-b border-slate-200 bg-white shadow-sm/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Active Threat Intel
                </h3>
              </div>
              <div className="flex-1 p-5 space-y-4">
                {latestAlerts.map((alert, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border ${alert.bg} flex flex-col gap-2 relative overflow-hidden group`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-sm bg-slate-50/50 ${alert.color}`}>{alert.severity}</span>
                      <span className="text-[10px] text-slate-600">{alert.time}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 leading-snug">{alert.title}</p>
                    {alert.severity === 'CRITICAL' && (
                      <div className="mt-2 text-xs">
                        <button className="text-red-400 hover:text-red-300 font-medium underline underline-offset-2">Investigate immediately</button>
                      </div>
                    )}
                  </div>
                ))}

                <Link href="/admin/global-risk/audit" className="block w-full mt-4">
                  <button className="w-full py-3 rounded-lg border border-slate-300 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-sm font-medium text-slate-700 transition-colors">
                    View Complete Audit Log
                  </button>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </SuperAdminLayout>
  );
}
