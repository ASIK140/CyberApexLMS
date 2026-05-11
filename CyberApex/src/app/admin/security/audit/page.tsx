'use client';
import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const auditLogs = [
  { id: 'AL-9241', actor: 'sarah.m@globalfinance.com', role: 'Tenant Admin', action: 'Update SSO Configuration', resource: 'SAML_IdP_Config', status: 'Success', tenant: 'Global Finance Ltd.', ip: '192.168.1.104', timestamp: '2025-03-07 14:55:02' },
  { id: 'AL-9240', actor: 'system_service', role: 'System', action: 'Automated Backup Snapshot', resource: 'tenant-005.uk.db', status: 'Success', tenant: 'SecureBank PLC', ip: '10.0.0.8', timestamp: '2025-03-07 14:50:00' },
  { id: 'AL-9239', actor: 'j.doe@technova.io', role: 'Manager', action: 'Exported User Report', resource: 'Report_CSV_Export', status: 'Success', tenant: 'TechNova Inc.', ip: '203.0.113.41', timestamp: '2025-03-07 14:48:12' },
  { id: 'AL-9238', actor: 'admin@cyberapex.io', role: 'Super Admin', action: 'Generated API Key', resource: 'API_Key_Prod', status: 'Success', tenant: 'System', ip: '198.51.100.12', timestamp: '2025-03-07 14:30:45' },
  { id: 'AL-9237', actor: 'unknown', role: 'None', action: 'Failed Login Attempt (Brute Force)', resource: 'Auth_Endpoint', status: 'Denied', tenant: 'Acme Corporation', ip: '45.14.22.9', timestamp: '2025-03-07 14:25:01' },
  { id: 'AL-9236', actor: 'unknown', role: 'None', action: 'Failed Login Attempt (Brute Force)', resource: 'Auth_Endpoint', status: 'Denied', tenant: 'Acme Corporation', ip: '45.14.22.9', timestamp: '2025-03-07 14:24:58' },
  { id: 'AL-9235', actor: 'p.sharma@medicare.com', role: 'Tenant Admin', action: 'Deleted User Batch', resource: 'Users_Group_B', status: 'Success', tenant: 'MediCare Group', ip: '192.168.10.45', timestamp: '2025-03-07 14:10:22' },
  { id: 'AL-9234', actor: 'secops@securebank.com', role: 'CISO', action: 'Changed Risk Threshold Settings', resource: 'Platform_Settings', status: 'Success', tenant: 'SecureBank PLC', ip: '172.16.8.21', timestamp: '2025-03-07 13:58:10' },
];

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  const [page, setPage] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
        const { apiFetch } = await import('@/utils/api');
        const res = await apiFetch('/admin/audit-log');
        const json = await res.json();
        if (json.success) {
            setAuditLogs(json.data);
        } else {
            setError('Failed to fetch audit logs');
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
      <SuperAdminLayout title="System Audit Logs">
          <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-slate-600">Loading audit trail...</span>
          </div>
      </SuperAdminLayout>
  );

  if (error) return (
      <SuperAdminLayout title="System Audit Logs">
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Retry</button>
          </div>
      </SuperAdminLayout>
  );

  return (
    <SuperAdminLayout title="System Audit Logs">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
          <p className="text-slate-600 text-sm">Immutable system-wide audit trail of all administrative and security-critical actions.</p>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={() => setActiveModal('filters')} className="w-full sm:w-auto px-4 py-2 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-semibold rounded-lg border border-slate-300 transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              Advanced Filters
            </button>
            <button onClick={() => setActiveModal('export')} className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all whitespace-nowrap">
              Export Logs (CSV)
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex justify-between items-center bg-white shadow-sm border-b border-slate-200">
            <div className="relative w-full max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Search by event ID, actor, action or IP..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="px-5 py-3.5 text-left font-semibold">Event ID / Time</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Actor</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Action & Resource</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Tenant Context</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-left font-semibold">IP Address</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
               <tbody className="divide-y divide-neutral-800/50">
                {auditLogs.filter(l => l.actor_email.includes(search) || l.action_type.includes(search) || l.log_id.includes(search)).map(log => (
                  <tr key={log.log_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-mono text-xs text-slate-600">{log.log_id}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{log.timestamp}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className={`text-xs font-semibold ${log.actor_role === null ? 'text-slate-500' : 'text-slate-900'}`}>{log.actor_email}</p>
                      <p className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300 text-slate-600 inline-block mt-1">{log.actor_role || 'No Role'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-900 text-xs font-medium">{log.action_type.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{log.target_resource}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-medium text-slate-700">{log.tenant_id || 'System'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${log.result === 'success' ? 'text-green-400 border-green-500/30 bg-green-400/10' : 'text-red-400 border-red-500/30 bg-red-400/10'}`}>
                        {log.result.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-mono text-blue-400/80 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded">{log.ip_address}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => { setSelectedLog(log); setActiveModal('payload'); }} className="px-3 py-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-300 transition-colors">
                        Payload
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 bg-white shadow-sm/50">
            <span>Showing 8 of 8,492 events today</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} className={`px-3 py-1.5 rounded ${page === 1 ? 'bg-slate-100 text-slate-600 opacity-50 cursor-not-allowed' : 'bg-slate-100 hover:bg-slate-100 text-slate-900'}`}>Prev</button>
              <button className="px-3 py-1.5 rounded bg-blue-600/20 text-blue-400 font-medium">{page}</button>
              <button onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-100 text-slate-900 transition-colors">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">
                {activeModal === 'filters' ? 'Advanced Audit Filters' :
                  activeModal === 'export' ? 'Export Audit Logs' : 'Event Payload Data'}
              </h3>
              <button onClick={() => { setActiveModal(null); setSelectedLog(null); }} className="text-slate-500 hover:text-slate-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              {activeModal === 'filters' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Date Range</label>
                      <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none">
                        <option>Last 24 Hours</option>
                        <option>Last 7 Days</option>
                        <option>Last 30 Days</option>
                        <option>Custom Range...</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Tenant</label>
                      <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none">
                        <option>All Tenants</option>
                        <option>Global Finance Ltd.</option>
                        <option>Acme Corporation</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Actor Role</label>
                      <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none">
                        <option>All Roles</option>
                        <option>Super Admin</option>
                        <option>Tenant Admin</option>
                        <option>System Service</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Status</label>
                      <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none">
                        <option>All</option>
                        <option>Success</option>
                        <option>Denied</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              {activeModal === 'export' && (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-slate-900 font-medium">Generating CSV Export...</p>
                  <p className="text-sm text-slate-600 mt-2">Compiling 8,492 log entries. Your download will start shortly.</p>
                </div>
              )}
              {activeModal === 'payload' && selectedLog && (
                <div className="space-y-4">
                  <div className="flex gap-2 mb-2 items-center">
                    <span className={`w-2 h-2 rounded-full ${selectedLog.status === 'Success' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-sm text-slate-900 font-semibold">{selectedLog.action}</span>
                  </div>
                   <div className="bg-[#0d0d0d] border border-slate-200 rounded-xl p-4 overflow-x-auto">
                    <pre className="text-[11px] text-green-400 font-mono leading-relaxed">
                      {JSON.stringify(selectedLog, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              {activeModal === 'export' ? (
                <button onClick={() => setActiveModal(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors border border-transparent">Cancel Export</button>
              ) : (
                <>
                  <button onClick={() => setActiveModal(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors border border-transparent">Cancel</button>
                  <button onClick={() => setActiveModal(null)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors border border-blue-500">
                    {activeModal === 'filters' ? 'Apply Filters' : 'Close Details'}
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
