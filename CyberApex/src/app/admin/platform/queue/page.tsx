'use client';
import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const statusBadge = (s: string) => ({
  Completed: 'text-green-400 bg-green-400/10 border-green-500/20',
  Running: 'text-blue-400 bg-blue-400/10 border-blue-500/20',
  Queued: 'text-slate-600 bg-slate-100 border-slate-300',
  Failed: 'text-red-400 bg-red-400/10 border-red-500/20',
  Delivered: 'text-green-400 bg-green-400/10 border-green-500/20',
  Sending: 'text-blue-400 bg-blue-400/10 border-blue-500/20',
  Bounced: 'text-red-400 bg-red-400/10 border-red-500/20',
  Cancelled: 'text-orange-400 bg-orange-400/10 border-orange-500/20',
}[s] || 'text-slate-600 bg-slate-100 border-slate-300');

const priorityBadge = (p: string) => ({
  Critical: 'text-red-400 bg-red-400/10 border-red-500/20',
  High: 'text-orange-400 bg-orange-400/10 border-orange-500/20',
  Normal: 'text-blue-400 bg-blue-400/10 border-blue-500/20',
  Low: 'text-slate-600 bg-slate-100 border-slate-300',
}[p] || 'text-slate-600 bg-slate-100 border-slate-300');

export default function QueueMonitoringPage() {
  const [tab, setTab] = useState<'jobs' | 'email'>('jobs');
  const [statusFilter, setStatusFilter] = useState('All');
  const [retryTarget, setRetryTarget] = useState<any | null>(null);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const [jobsList, setJobsList] = useState<any[]>([]);
  const [emailsList, setEmailsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { apiFetch } = await import('@/utils/api');
      const [jobsRes, emailsRes, pauseRes] = await Promise.all([
        apiFetch('/admin/queue-monitoring/jobs'),
        apiFetch('/admin/queue-monitoring/emails'),
        apiFetch('/admin/queue-monitoring/pause-status')
      ]);
      const jobsJson = await jobsRes.json();
      const emailsJson = await emailsRes.json();
      const pauseJson = await pauseRes.json();

      if (jobsJson.success) setJobsList(jobsJson.data);
      if (emailsJson.success) setEmailsList(emailsJson.data);
      if (pauseJson.success) setIsQueuePaused(pauseJson.paused);
    } catch (err) {
      console.error('Failed to fetch queue data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRemove = async (id: string) => {
    try {
      const { apiFetch } = await import('@/utils/api');
      const res = await apiFetch(`/admin/queue-monitoring/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setJobsList(prev => prev.filter(j => j.id !== id));
      }
    } catch (err) {
      console.error('Failed to remove job:', err);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const { apiFetch } = await import('@/utils/api');
      const res = await apiFetch(`/admin/queue-monitoring/jobs/${id}/cancel`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setJobsList(prev => prev.map(j => j.id === id ? json.data : j));
      }
    } catch (err) {
      console.error('Failed to cancel job:', err);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      const { apiFetch } = await import('@/utils/api');
      const res = await apiFetch(`/admin/queue-monitoring/jobs/${id}/retry`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setJobsList(prev => prev.map(j => j.id === id ? json.data : j));
        setRetryTarget(null);
      }
    } catch (err) {
      console.error('Failed to retry job:', err);
    }
  };

  const handleRetryAll = async () => {
    try {
      const { apiFetch } = await import('@/utils/api');
      const res = await apiFetch('/admin/queue-monitoring/jobs/retry-all', { method: 'POST' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to retry all jobs:', err);
    }
  };

  const handleCancelEmail = async (id: string) => {
    try {
      const { apiFetch } = await import('@/utils/api');
      const res = await apiFetch(`/admin/queue-monitoring/emails/${id}/cancel`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setEmailsList(prev => prev.map(e => e.id === id ? json.data : e));
      }
    } catch (err) {
      console.error('Failed to cancel email:', err);
    }
  };

  const handleResendEmail = async (id: string) => {
    try {
      const { apiFetch } = await import('@/utils/api');
      const res = await apiFetch(`/admin/queue-monitoring/emails/${id}/resend`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setEmailsList(prev => prev.map(e => e.id === id ? json.data : e));
      }
    } catch (err) {
      console.error('Failed to resend email:', err);
    }
  };

  const handleTogglePause = async () => {
    const newState = !isQueuePaused;
    try {
      const { apiFetch } = await import('@/utils/api');
      const res = await apiFetch('/admin/queue-monitoring/pause-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: newState })
      });
      const json = await res.json();
      if (json.success) {
        setIsQueuePaused(json.paused);
      }
    } catch (err) {
      console.error('Failed to toggle queue pause:', err);
    }
  };

  const filteredJobs = jobsList.filter(j =>
    statusFilter === 'All' || j.status === statusFilter
  );

  const runningCount = jobsList.filter(j => j.status === 'Running').length;
  const queuedCount = jobsList.filter(j => j.status === 'Queued').length;
  const failedCount = jobsList.filter(j => j.status === 'Failed').length;
  const completedCount = jobsList.filter(j => j.status === 'Completed').length;

  return (
    <SuperAdminLayout title="Queue Monitoring">
      <div className="flex flex-col gap-6">

        <p className="text-slate-600 text-sm -mt-2">Background job processing, email queue status, and worker health.</p>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                <p className="text-xs text-slate-500 mb-1">Running</p>
                <p className="text-3xl font-bold text-blue-400">{runningCount}</p>
                <p className="text-xs text-slate-500 mt-1">jobs in progress</p>
              </div>
              <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-neutral-500"></div>
                <p className="text-xs text-slate-500 mb-1">Queued</p>
                <p className="text-3xl font-bold text-slate-700">{queuedCount}</p>
                <p className="text-xs text-slate-500 mt-1">awaiting workers</p>
              </div>
              <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                <p className="text-xs text-slate-500 mb-1">Failed</p>
                <p className="text-3xl font-bold text-red-400">{failedCount}</p>
                <p className="text-xs text-slate-500 mt-1">require attention</p>
              </div>
              <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                <p className="text-xs text-slate-500 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-400">{completedCount}</p>
                <p className="text-xs text-slate-500 mt-1">today</p>
              </div>
            </div>

            {/* Controls Header */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              {/* Tabs */}
              <div className="flex gap-1 bg-white shadow-sm border border-slate-200 rounded-xl p-1">
                <button onClick={() => setTab('jobs')} className={`px-5 py-2 text-xs font-semibold rounded-lg transition-colors ${tab === 'jobs' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                  Job Queue
                </button>
                <button onClick={() => setTab('email')} className={`px-5 py-2 text-xs font-semibold rounded-lg transition-colors ${tab === 'email' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
                  Email Queue
                </button>
              </div>

              {/* Queue Controls */}
              <div className="flex gap-2">
                <button
                  onClick={handleTogglePause}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${isQueuePaused
                    ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20'
                    : 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20'
                    }`}
                >
                  {isQueuePaused ? 'Resume Queue' : 'Pause Queue'}
                </button>
                <button
                  onClick={handleRetryAll}
                  className="px-4 py-2 text-xs font-semibold bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg border border-red-500/20 transition-colors"
                >
                  Retry All Failed
                </button>
              </div>
            </div>

            {/* Queue Status Banner */}
            {isQueuePaused && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-5 py-3 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                <p className="text-sm text-orange-300 font-medium">Queue is currently <span className="font-bold">PAUSED</span>. No new jobs will be processed until resumed.</p>
              </div>
            )}

            {/* Job Queue Tab */}
            {tab === 'jobs' && (
              <>
                {/* Filter */}
                <div className="flex gap-2 flex-wrap">
                  {['All', 'Running', 'Queued', 'Failed', 'Completed'].map(f => (
                    <button key={f} onClick={() => setStatusFilter(f)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${statusFilter === f
                        ? f === 'Failed' ? 'bg-red-500/20 text-red-400 border-red-500/40'
                          : f === 'Running' ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                            : f === 'Completed' ? 'bg-green-500/20 text-green-400 border-green-500/40'
                              : 'bg-slate-100 text-slate-900 border-slate-300'
                        : 'bg-white shadow-sm text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50 border border-slate-100'
                        }`}
                    >{f}</button>
                  ))}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm whitespace-nowrap">
                      <thead className="bg-slate-50/50 border-b border-slate-200">
                        <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                          <th className="px-5 py-3.5 text-left font-semibold">Job ID</th>
                          <th className="px-5 py-3.5 text-left font-semibold">Type</th>
                          <th className="px-5 py-3.5 text-left font-semibold">Tenant</th>
                          <th className="px-5 py-3.5 text-left font-semibold">Priority</th>
                          <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                          <th className="px-5 py-3.5 text-left font-semibold">Duration</th>
                          <th className="px-5 py-3.5 text-left font-semibold">Retries</th>
                          <th className="px-5 py-3.5 text-left font-semibold">Added</th>
                          <th className="px-5 py-3.5 text-right font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/50">
                        {filteredJobs.map(job => (
                          <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{job.id}</td>
                            <td className="px-5 py-3.5 text-slate-900 text-xs font-medium">{job.type}</td>
                            <td className="px-5 py-3.5 text-slate-700 text-xs">{job.tenant}</td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${priorityBadge(job.priority)}`}>{job.priority}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                {job.status === 'Running' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse inline-block"></span>}
                                <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${statusBadge(job.status)}`}>{job.status}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-slate-600 text-xs font-mono">{job.duration}</td>
                            <td className="px-5 py-3.5">
                              <span className={`text-xs font-semibold ${job.retries > 0 ? 'text-orange-400' : 'text-slate-500'}`}>{job.retries}</span>
                            </td>
                            <td className="px-5 py-3.5 text-slate-500 text-xs">{job.added}</td>
                            <td className="px-5 py-3.5 text-right">
                              {job.status === 'Failed' && (
                                <button onClick={() => setRetryTarget(job)} className="px-3 py-1.5 text-[11px] font-bold bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg border border-red-500/20 transition-colors">
                                  Retry
                                </button>
                              )}
                              {job.status === 'Running' && (
                                <button onClick={() => handleCancel(job.id)} className="px-3 py-1.5 text-[11px] font-semibold bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 rounded-lg border border-orange-500/20 transition-colors">
                                  Cancel
                                </button>
                              )}
                              {(job.status === 'Queued') && (
                                <button onClick={() => handleRemove(job.id)} className="px-3 py-1.5 text-[11px] font-semibold bg-slate-100 hover:bg-slate-100 text-slate-600 rounded-lg border border-slate-300 transition-colors">
                                  Remove
                                </button>
                              )}
                              {job.status === 'Completed' && (
                                <span className="text-xs text-neutral-600">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 py-3 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 bg-white shadow-sm/50">
                    <span>Showing {filteredJobs.length} of {jobsList.length} jobs</span>
                    <span className={`flex items-center gap-2 font-medium ${isQueuePaused ? 'text-orange-400' : 'text-green-400'}`}>
                      <span className={`w-2 h-2 rounded-full ${isQueuePaused ? 'bg-orange-400' : 'bg-green-400 animate-pulse'}`}></span>
                      {isQueuePaused ? 'Queue Paused' : 'Queue Active — 2 Workers'}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Email Queue Tab */}
            {tab === 'email' && (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">Email Delivery Queue</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Outbound email status including notifications, certificates and reminders</p>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>Delivered: {emailsList.filter(e => e.status === 'Delivered').length}</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"></span>Bounced: {emailsList.filter(e => e.status === 'Bounced').length}</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neutral-500 inline-block"></span>Queued: {emailsList.filter(e => e.status === 'Queued').length}</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/50 border-b border-slate-200">
                      <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                        <th className="px-5 py-3.5 text-left font-semibold">Email ID</th>
                        <th className="px-5 py-3.5 text-left font-semibold">Recipient</th>
                        <th className="px-5 py-3.5 text-left font-semibold">Subject</th>
                        <th className="px-5 py-3.5 text-left font-semibold">Tenant</th>
                        <th className="px-5 py-3.5 text-left font-semibold">Status</th>
                        <th className="px-5 py-3.5 text-left font-semibold">Sent At</th>
                        <th className="px-5 py-3.5 text-left font-semibold">Opens</th>
                        <th className="px-5 py-3.5 text-right font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50">
                      {emailsList.map(email => (
                        <tr key={email.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-xs text-slate-600">{email.id}</td>
                          <td className="px-5 py-3.5 text-slate-700 text-xs">{email.recipient}</td>
                          <td className="px-5 py-3.5 text-slate-900 text-xs font-medium max-w-xs truncate">{email.subject}</td>
                          <td className="px-5 py-3.5 text-slate-600 text-xs">{email.tenant}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              {email.status === 'Sending' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>}
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${statusBadge(email.status)}`}>{email.status}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 text-xs">{email.sentAt}</td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-semibold ${email.opens > 0 ? 'text-green-400' : 'text-neutral-600'}`}>{email.opens}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {(email.status === 'Bounced' || email.status === 'Cancelled') && (
                              <button onClick={() => handleResendEmail(email.id)} className="px-3 py-1.5 text-[11px] font-bold bg-slate-100 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition-colors">
                                {email.status === 'Bounced' ? 'Resend' : 'Re-queue'}
                              </button>
                            )}
                            {email.status === 'Queued' && (
                              <button onClick={() => handleCancelEmail(email.id)} className="px-3 py-1.5 text-[11px] font-semibold bg-orange-600/10 hover:bg-orange-600/20 text-orange-400 rounded-lg border border-orange-500/20 transition-colors">
                                Cancel
                              </button>
                            )}
                            {(email.status === 'Delivered' || email.status === 'Sending') && (
                              <span className="text-xs text-neutral-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Retry Confirmation Modal ── */}
      {retryTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Retry Failed Job</h3>
              <button onClick={() => setRetryTarget(null)} className="text-slate-500 hover:text-slate-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-xs"><span className="text-slate-500">Job ID</span><span className="text-slate-900 font-mono">{retryTarget.id}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Type</span><span className="text-slate-900">{retryTarget.type}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Tenant</span><span className="text-slate-900">{retryTarget.tenant}</span></div>
                <div className="flex justify-between text-xs"><span className="text-slate-500">Previous Retries</span><span className="text-orange-400 font-bold">{retryTarget.retries}</span></div>
              </div>
              <p className="text-xs text-slate-600">This job will be re-added to the queue with the same parameters. If it continues to fail, consider inspecting the worker logs.</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setRetryTarget(null)} className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">Cancel</button>
              <button onClick={() => handleRetry(retryTarget.id)} className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-lg transition-colors shadow-[0_0_12px_rgba(220,38,38,0.3)]">
                Confirm Retry
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
