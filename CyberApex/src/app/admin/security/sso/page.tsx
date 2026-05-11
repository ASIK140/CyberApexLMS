'use client';
import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

const ssoProviders = [
  { id: 'SSO-01', tenant: 'Global Finance Ltd.', name: 'Azure Active Directory', protocol: 'SAML 2.0', status: 'Active', users: 1402, lastSync: '10 mins ago' },
  { id: 'SSO-02', tenant: 'Acme Corporation', name: 'Okta', protocol: 'SAML 2.0', status: 'Active', users: 890, lastSync: '1 hour ago' },
  { id: 'SSO-03', tenant: 'TechNova Inc.', name: 'Google Workspace', protocol: 'OIDC', status: 'Configuring', users: 0, lastSync: 'Never' },
  { id: 'SSO-04', tenant: 'MediCare Group', name: 'Ping Identity', protocol: 'SAML 2.0', status: 'Active', users: 4500, lastSync: '5 mins ago' },
  { id: 'SSO-05', tenant: 'SecureBank PLC', name: 'Custom ADFS', protocol: 'SAML 2.0', status: 'Error', users: 210, lastSync: '2 days ago' },
];

export default function SSOProvidersPage() {
  const [ssoProviders, setSsoProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<any | null>(null);

  const fetchProviders = async () => {
    setLoading(true);
    try {
        const { apiFetch } = await import('@/utils/api');
        const res = await apiFetch('/admin/sso-providers');
        const json = await res.json();
        if (json.success) {
            setSsoProviders(json.data);
        } else {
            setError('Failed to fetch SSO providers');
        }
    } catch (err) {
        setError('Network error connecting to API');
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  if (loading) return (
      <SuperAdminLayout title="SSO Providers">
          <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-slate-600">Loading configurations...</span>
          </div>
      </SuperAdminLayout>
  );

  if (error) return (
      <SuperAdminLayout title="SSO Providers">
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <p className="font-bold">Error</p>
              <p className="text-sm">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Retry</button>
          </div>
      </SuperAdminLayout>
  );

  return (
    <SuperAdminLayout title="SSO Providers">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
          <p className="text-slate-600 text-sm">Manage tenant Single Sign-On integrations and identity providers.</p>
          <button onClick={() => setActiveModal('new-sso')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all whitespace-nowrap">
            + New SSO Connection
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500 mb-1">Active Connections</p>
            <p className="text-3xl font-bold text-green-400">42</p>
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500 mb-1">Total SSO Users Managed</p>
            <p className="text-3xl font-bold text-slate-900">68.4k</p>
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500 mb-1">Failed Syncs (24h)</p>
            <p className="text-3xl font-bold text-red-400">3</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-200">
            <div className="relative w-full max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Search provider or tenant..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none" />
            </div>
            <select className="w-full sm:w-auto px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none">
              <option>All Statuses</option>
              <option>Active</option>
              <option>Configuring</option>
              <option>Error</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="bg-slate-50/50 border-b border-slate-200">
                <tr className="text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="px-6 py-4 text-left font-semibold">Tenant</th>
                  <th className="px-6 py-4 text-left font-semibold">Provider / Protocol</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-left font-semibold">Provisioned Users</th>
                  <th className="px-6 py-4 text-left font-semibold">Last Sync</th>
                  <th className="px-6 py-4 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {ssoProviders.map(p => (
                  <tr key={p.provider_id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{p.tenant_id || 'Global'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-900 font-medium">{p.provider_name}</p>
                      <p className="text-xs text-slate-500">{p.provider_type}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${p.status === 'active' ? 'text-green-400 bg-green-400/10 border-green-500/20' : p.status === 'inactive' ? 'text-red-400 bg-red-400/10 border-red-500/20' : 'text-blue-400 bg-blue-400/10 border-blue-500/20'}`}>
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">0</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">{p.created_at}</td>
                    <td className="px-6 py-4 text-right flex gap-2 justify-end">
                      <button onClick={() => { setSelectedProvider(p); setActiveModal('sync-sso'); }} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-100 text-slate-700 rounded border border-slate-300 transition-colors">Sync Now</button>
                      <button onClick={() => { setSelectedProvider(p); setActiveModal('manage-sso'); }} className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-100 text-slate-900 rounded border border-slate-300 transition-colors">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── SSO Modals ── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">
                {activeModal === 'new-sso' ? 'Create SSO Connection' :
                  activeModal === 'sync-sso' ? 'Sync Directory' : 'Manage Connection'}
              </h3>
              <button onClick={() => { setActiveModal(null); setSelectedProvider(null); }} className="text-slate-500 hover:text-slate-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              {activeModal === 'new-sso' && (
                <div className="space-y-4">
                  <div className="text-sm text-slate-700">Target Tenant</div>
                  <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none">
                    <option>Select Tenant...</option>
                    <option>Global Finance Ltd.</option>
                    <option>RetailMax</option>
                  </select>
                  <div className="text-sm text-slate-700">Identity Provider</div>
                  <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none">
                    <option>Azure AD (SAML)</option>
                    <option>Okta (SAML)</option>
                    <option>Google Workspace (OIDC)</option>
                    <option>Other / Custom (SAML 2.0)</option>
                  </select>
                </div>
              )}
              {activeModal === 'sync-sso' && selectedProvider && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-slate-900 font-medium">Syncing Directory with {selectedProvider.name}</p>
                  <p className="text-sm text-slate-600 mt-2">Pulling latest user groups and claims for {selectedProvider.tenant}...</p>
                </div>
              )}
              {activeModal === 'manage-sso' && selectedProvider && (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-slate-500">Tenant</span><span className="text-slate-900">{selectedProvider.tenant}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">IdP</span><span className="text-slate-900">{selectedProvider.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Protocol</span><span className="font-mono text-xs">{selectedProvider.protocol}</span></div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <button className="w-full text-left px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 border border-slate-100 text-sm text-slate-900 transition-colors flex justify-between">
                      Edit Certificate & Endpoints <span>→</span>
                    </button>
                    <button className="w-full text-left px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 border border-slate-100 text-sm text-slate-900 transition-colors flex justify-between">
                      Edit Attribute Mapping <span>→</span>
                    </button>
                    <button className="w-full text-left px-4 py-2.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-sm text-red-400 transition-colors flex justify-between">
                      Disable Connection <span>→</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              {activeModal === 'new-sso' ? (
                <>
                  <button onClick={() => setActiveModal(null)} className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                  <button onClick={() => setActiveModal(null)} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors border border-blue-500">Continue</button>
                </>
              ) : activeModal === 'manage-sso' ? (
                <button onClick={() => { setActiveModal(null); setSelectedProvider(null); }} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-medium rounded-lg transition-colors border border-slate-300">Done</button>
              ) : (
                <button onClick={() => { setActiveModal(null); setSelectedProvider(null); }} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-100 text-slate-900 text-sm font-medium rounded-lg transition-colors border border-slate-300">Cancel Sync</button>
              )}
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
