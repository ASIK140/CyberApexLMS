'use client';
import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';
import { apiFetch } from '@/utils/api';


const statusBadge = (s: string) => ({
  Healthy: 'text-green-400 bg-green-400/10 border-green-500/20',
  Warning: 'text-orange-400 bg-orange-400/10 border-orange-500/20',
  Critical: 'text-red-400 bg-red-400/10 border-red-500/20',
}[s] || 'text-slate-600 bg-slate-100 border-slate-300');

const planBadge = (p: string) => ({
  Enterprise: 'text-purple-400 border-purple-500/30',
  Pro: 'text-blue-400 border-blue-500/30',
  Starter: 'text-slate-600 border-neutral-600',
}[p] || 'text-slate-600 border-slate-300');

const usagePct = (used: number, quota: number) => Math.min(Math.round((used / quota) * 100), 100);
const storageBarColor = (pct: number) => pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-orange-500' : 'bg-blue-500';

export default function StorageMonitoringPage() {
  const [statusFilter, setStatusFilter] = useState('All');
  const [detailTenant, setDetailTenant] = useState<any | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<any | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [tenantList, setTenantList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expansionAmount, setExpansionAmount] = useState('+25 GB (£15/mo)');
  const [expansionNotes, setExpansionNotes] = useState('');
  const [isExpanding, setIsExpanding] = useState(false);
  const [expansionSuccess, setExpansionSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/storage');
      const json = await res.json();
      if (json.success) {
        setTenantList(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch storage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExpandStorage = async () => {
    if (!purgeTarget || isExpanding) return;
    setIsExpanding(true);
    setExpansionSuccess(null);
    try {
      const res = await apiFetch('/admin/storage/expand', {
        method: 'POST',
        body: JSON.stringify({
          id: purgeTarget.id,
          amount: expansionAmount,
          notes: expansionNotes
        })
      });
      const json = await res.json();
      if (json.success) {
        setTenantList(prev => prev.map(t => t.id === purgeTarget.id ? json.data : t));
        setExpansionSuccess(json.message);
        setExpansionNotes('');
        
        // Auto-close after a delay to show success
        setTimeout(() => {
          setPurgeTarget(null);
          setDetailTenant(null);
          setExpansionSuccess(null);
          setIsExpanding(false);
        }, 1500);
      } else {
        alert(json.message || 'Expansion failed');
        setIsExpanding(false);
      }
    } catch (err) {
      console.error('Failed to expand storage:', err);
      alert('Failed to apply expansion.');
      setIsExpanding(false);
    }
  };

  const filtered = tenantList.filter(t =>
    statusFilter === 'All' || t.status === statusFilter
  );

  const totalUsed = tenantList.reduce((a, t) => a + t.totalUsed, 0);
  const totalQuota = tenantList.reduce((a, t) => a + t.totalQuota, 0);
  const platformPct = usagePct(totalUsed, totalQuota);

  return (
    <SuperAdminLayout title="Storage Monitoring">
      <div className="flex flex-col gap-6">

        <p className="text-slate-600 text-sm -mt-2">
          Per-tenant isolated storage allocation, database usage, and data residency compliance.
          Each tenant&apos;s data is stored in a <span className="text-blue-400 font-medium">dedicated isolated zone</span>, ensuring full data separation.
        </p>

        {/* Platform-Wide KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden col-span-2 md:col-span-1">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
            <p className="text-xs text-slate-500 mb-1">Total Platform Storage</p>
            <p className="text-3xl font-bold text-slate-900">{totalUsed.toFixed(1)}<span className="text-base font-normal text-slate-500"> GB</span></p>
            <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
              <div className={`h-1.5 rounded-full ${storageBarColor(platformPct)}`} style={{ width: `${platformPct}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-1">{platformPct}% of {totalQuota} GB provisioned</p>
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
            <p className="text-xs text-slate-500 mb-1">Healthy Tenants</p>
            <p className="text-3xl font-bold text-green-400">{tenantList.filter(t => t.status === 'Healthy').length}</p>
            <p className="text-xs text-slate-500 mt-1">within quota</p>
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
            <p className="text-xs text-slate-500 mb-1">Warning</p>
            <p className="text-3xl font-bold text-orange-400">{tenantList.filter(t => t.status === 'Warning').length}</p>
            <p className="text-xs text-slate-500 mt-1">70–89% usage</p>
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            <p className="text-xs text-slate-500 mb-1">Critical</p>
            <p className="text-3xl font-bold text-red-400">{tenantList.filter(t => t.status === 'Critical').length}</p>
            <p className="text-xs text-slate-500 mt-1">90%+ usage</p>
          </div>
        </div>

        {/* Data Isolation Info Banner */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl px-5 py-4 flex items-start gap-4">
          <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-300">Tenant Data Isolation Architecture</p>
            <p className="text-xs text-slate-600 mt-0.5">Each tenant is provisioned a <span className="text-slate-900 font-medium">dedicated storage zone</span> with its own database schema, file store bucket, backup volume, and log partition. No cross-tenant data access is possible at the storage layer. All data is encrypted at rest using <span className="text-slate-900 font-medium">AES-256</span> and in transit using <span className="text-slate-900 font-medium">TLS 1.3</span>.</p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex gap-2 flex-wrap">
          {['All', 'Healthy', 'Warning', 'Critical'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${statusFilter === f
                ? f === 'Critical' ? 'bg-red-500/20 text-red-400 border-red-500/40'
                  : f === 'Warning' ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                    : f === 'Healthy' ? 'bg-green-500/20 text-green-400 border-green-500/40'
                      : 'bg-slate-100 text-slate-900 border-slate-300'
                : 'bg-white shadow-sm text-slate-500 border-slate-200 hover:text-slate-700'
                }`}
            >{f}</button>
          ))}
        </div>

        {/* Per-Tenant Storage Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Tenant Isolated Storage Zones</h3>
              <p className="text-xs text-slate-500 mt-0.5">Each row represents a fully isolated tenant storage environment</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="px-5 py-3.5 text-left font-semibold">Tenant</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Plan</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Isolation Zone</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Total Usage</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Storage Breakdown</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Last Backup</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Residency</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {filtered.map(t => {
                  const pct = usagePct(t.totalUsed, t.totalQuota);
                  const isExpanded = expandedRow === t.id;
                  return (
                    <React.Fragment key={t.id}>
                      <tr className="hover:bg-slate-100/20 transition-colors cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : t.id)}>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{t.id} · {t.region}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 text-[10px] font-semibold rounded-full border bg-slate-50 ${planBadge(t.plan)}`}>{t.plan}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[10px] font-mono text-blue-400/80 bg-blue-500/5 border border-blue-500/10 px-2 py-1 rounded">{t.isolationZone}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-slate-900 text-sm font-bold">{t.totalUsed} <span className="text-slate-500 font-normal text-xs">/ {t.totalQuota} GB</span></p>
                            <div className="mt-1.5 w-28 bg-slate-100 rounded-full h-2">
                              <div className={`h-2 rounded-full ${storageBarColor(pct)}`} style={{ width: `${pct}%` }}></div>
                            </div>
                            <p className={`text-[10px] mt-0.5 font-semibold ${pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-orange-400' : 'text-slate-500'}`}>{pct}% used</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-3 items-center">
                            {[
                              { label: 'DB', used: t.database.used, quota: t.database.quota, color: 'bg-purple-500' },
                              { label: 'Files', used: t.fileStore.used, quota: t.fileStore.quota, color: 'bg-blue-500' },
                              { label: 'Backup', used: t.backups.used, quota: t.backups.quota, color: 'bg-green-500' },
                              { label: 'Logs', used: t.logs.used, quota: t.logs.quota, color: 'bg-yellow-500' },
                            ].map(seg => {
                              const p = usagePct(seg.used, seg.quota);
                              return (
                                <div key={seg.label} className="flex flex-col items-center gap-0.5">
                                  <div className="w-8 bg-slate-100 rounded-full h-1.5">
                                    <div className={`h-1.5 rounded-full ${seg.color}`} style={{ width: `${p}%` }}></div>
                                  </div>
                                  <span className="text-[9px] text-slate-500">{seg.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600">{t.lastBackup}</td>
                        <td className="px-5 py-4">
                          <span className="text-[10px] text-green-400 font-medium bg-green-400/5 border border-green-500/10 px-2 py-1 rounded">{t.dataResidency}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${statusBadge(t.status)}`}>{t.status}</span>
                        </td>
                        <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-1.5 justify-end">
                            <button onClick={() => setDetailTenant(t)} className="px-3 py-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-100 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-300 transition-colors">
                              Details
                            </button>
                            {t.status === 'Critical' && (
                              <button onClick={() => setPurgeTarget(t)} className="px-3 py-1.5 text-[11px] font-bold bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg border border-red-500/20 transition-colors">
                                Expand
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded Breakdown Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="px-5 pb-4 bg-slate-50/50">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3">
                              {[
                                { label: 'Database', used: t.database.used, quota: t.database.quota, color: 'bg-purple-500', textColor: 'text-purple-400', desc: 'User data, course records, audit trails' },
                                { label: 'File Store', used: t.fileStore.used, quota: t.fileStore.quota, color: 'bg-blue-500', textColor: 'text-blue-400', desc: 'Course media, certificates, uploads' },
                                { label: 'Backups', used: t.backups.used, quota: t.backups.quota, color: 'bg-green-500', textColor: 'text-green-400', desc: 'Automated daily backup snapshots' },
                                { label: 'Log Storage', used: t.logs.used, quota: t.logs.quota, color: 'bg-yellow-500', textColor: 'text-yellow-400', desc: 'Audit logs, event streams' },
                              ].map(seg => {
                                const p = usagePct(seg.used, seg.quota);
                                return (
                                  <div key={seg.label} className="bg-white shadow-sm border border-slate-200 rounded-lg p-4">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className={`text-xs font-semibold ${seg.textColor}`}>{seg.label}</span>
                                      <span className="text-xs text-slate-600 font-mono">{seg.used} / {seg.quota} GB</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
                                      <div className={`h-2 rounded-full ${seg.color}`} style={{ width: `${p}%` }}></div>
                                    </div>
                                    <p className="text-[10px] text-neutral-600">{seg.desc}</p>
                                    <p className={`text-xs font-bold mt-1 ${p >= 90 ? 'text-red-400' : p >= 70 ? 'text-orange-400' : 'text-slate-600'}`}>{p}% used</p>
                                  </div>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 bg-white shadow-sm/50">
            <span>Showing {filtered.length} of {tenantList.length} tenant zones</span>
            <span className="text-slate-500">Click any row to expand storage breakdown</span>
          </div>
        </div>
      </div>

      {/* ── Tenant Detail Modal ── */}
      {detailTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{detailTenant.name} — Storage Details</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{detailTenant.isolationZone}</p>
              </div>
              <button onClick={() => setDetailTenant(null)} className="text-slate-500 hover:text-slate-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Used', value: `${detailTenant.totalUsed} GB / ${detailTenant.totalQuota} GB`, color: 'text-slate-900' },
                  { label: 'Storage Status', value: detailTenant.status, color: detailTenant.status === 'Healthy' ? 'text-green-400' : detailTenant.status === 'Critical' ? 'text-red-400' : 'text-orange-400' },
                  { label: 'Encryption', value: detailTenant.encryptionStatus, color: 'text-blue-400' },
                  { label: 'Data Residency', value: detailTenant.dataResidency, color: 'text-green-400' },
                  { label: 'Last Backup', value: detailTenant.lastBackup, color: 'text-slate-700' },
                  { label: 'Region', value: detailTenant.region, color: 'text-slate-700' },
                ].map(row => (
                  <div key={row.label} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <p className="text-[10px] text-slate-500 mb-0.5">{row.label}</p>
                    <p className={`text-sm font-bold ${row.color}`}>{row.value}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Database', used: detailTenant.database.used, quota: detailTenant.database.quota, color: 'bg-purple-500' },
                  { label: 'File Store', used: detailTenant.fileStore.used, quota: detailTenant.fileStore.quota, color: 'bg-blue-500' },
                  { label: 'Backups', used: detailTenant.backups.used, quota: detailTenant.backups.quota, color: 'bg-green-500' },
                  { label: 'Log Storage', used: detailTenant.logs.used, quota: detailTenant.logs.quota, color: 'bg-yellow-500' },
                ].map(seg => {
                  const p = usagePct(seg.used, seg.quota);
                  return (
                    <div key={seg.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600">{seg.label}</span>
                        <span className="text-slate-700 font-medium">{seg.used} / {seg.quota} GB ({p}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${seg.color}`} style={{ width: `${p}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setDetailTenant(null)} className="px-5 py-2.5 text-sm text-slate-700 hover:text-slate-900 transition-colors">Close</button>
              <button onClick={() => setPurgeTarget(detailTenant)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">Expand Storage Quota</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Expand Storage Quota Modal ── */}
      {purgeTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Expand Storage Quota</h3>
              <button onClick={() => setPurgeTarget(null)} className="text-slate-500 hover:text-slate-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-sm text-red-300">
                <span className="font-bold text-slate-900">{purgeTarget.name}</span> is at <span className="font-bold">{usagePct(purgeTarget.totalUsed, purgeTarget.totalQuota)}% capacity</span>. Immediate quota expansion is recommended.
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Additional Storage</label>
                <select 
                  value={expansionAmount}
                  onChange={(e) => setExpansionAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none appearance-none cursor-pointer"
                >
                  <option>+25 GB (£15/mo)</option>
                  <option>+50 GB (£28/mo)</option>
                  <option>+100 GB (£50/mo)</option>
                  <option>+250 GB (£110/mo)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Reason / Notes</label>
                <textarea 
                  rows={2} 
                  value={expansionNotes}
                  onChange={(e) => setExpansionNotes(e.target.value)}
                  disabled={isExpanding}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none resize-none disabled:opacity-50" 
                  placeholder="e.g. Tenant requested upgrade due to data growth..."
                ></textarea>
              </div>
              {expansionSuccess && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-xs text-green-400 animate-in fade-in slide-in-from-top-2 duration-300">
                  {expansionSuccess}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setPurgeTarget(null)} 
                disabled={isExpanding}
                className="px-5 py-2.5 text-sm text-slate-700 hover:text-slate-900 transition-colors disabled:opacity-50"
              >Cancel</button>
              <button 
                onClick={handleExpandStorage} 
                disabled={isExpanding}
                className={`px-5 py-2.5 text-white text-sm font-bold rounded-lg transition-all shadow-[0_0_12px_rgba(37,99,235,0.3)] flex items-center gap-2 ${isExpanding ? 'bg-blue-700 opacity-80' : 'bg-blue-600 hover:bg-blue-500'}`}
              >
                {isExpanding ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-slate-900" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing...
                  </>
                ) : expansionSuccess ? (
                  <>
                    <svg className="h-4 w-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Applied
                  </>
                ) : 'Apply Expansion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
