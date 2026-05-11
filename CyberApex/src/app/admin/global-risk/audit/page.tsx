'use client';
import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

export default function ThreatAuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
        const { apiFetch } = await import('@/utils/api');
        const res = await apiFetch('/admin/audit-log');
        const json = await res.json();
        if (json.success) {
            // Filter logs to show only threat/risk related ones
            const threatActions = ['THREAT_DETECTED', 'ANOMALY_DETECTED', 'RISK_SCORE_CHANGE', 'VULNERABILITY_SCAN_COMPLETE', 'AUTH_FAILED'];
            const filtered = json.data.filter((l: any) => threatActions.includes(l.action_type));
            setAuditLogs(filtered);
        } else {
            setError('Failed to fetch threat logs');
        }
    } catch (err) {
        setError('Network error connecting to API');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) return (
      <SuperAdminLayout title="Threat Intelligence Audit Trail">
          <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              <span className="ml-3 text-slate-600">Loading security logs...</span>
          </div>
      </SuperAdminLayout>
  );

  return (
    <SuperAdminLayout title="Threat Intelligence Audit Trail">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
          <p className="text-slate-600 text-sm">Detailed historical record of all detected threats, anomalies, and risk-related events.</p>
          <div className="flex gap-2 w-full sm:w-auto">
            <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all whitespace-nowrap">
              Export Security Report
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex justify-between items-center bg-white shadow-sm border-b border-slate-200">
            <div className="relative w-full max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Search by threat type or tenant..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="px-5 py-3.5 text-left font-semibold">Event ID / Time</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Security Engine</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Incident Type</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Target / Resource</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Tenant</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Impact</th>
                </tr>
              </thead>
               <tbody className="divide-y divide-neutral-800/50">
                {auditLogs.filter(l => l.actor_email.includes(search) || l.action_type.includes(search) || l.target_resource.includes(search)).map(log => (
                  <tr key={log.log_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs text-slate-600">{log.log_id}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{new Date(log.timestamp).toLocaleString()}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-semibold text-slate-900">{log.actor_email.split('@')[0]}</p>
                      <p className="text-[10px] text-slate-500 mt-1">{log.ip_address}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-sm border ${
                        log.action_type === 'THREAT_DETECTED' ? 'text-red-400 border-red-500/30 bg-red-400/10' :
                        log.action_type === 'ANOMALY_DETECTED' ? 'text-orange-400 border-orange-500/30 bg-orange-400/10' :
                        'text-blue-400 border-blue-500/30 bg-blue-400/10'
                      }`}>
                        {log.action_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-700">
                      {log.target_resource}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-medium text-slate-600">{log.tenant_id || 'Global'}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-[11px] font-bold ${log.action_type === 'THREAT_DETECTED' ? 'text-red-400' : 'text-slate-600'}`}>
                        {log.action_type === 'THREAT_DETECTED' ? 'High' : 'Medium'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
