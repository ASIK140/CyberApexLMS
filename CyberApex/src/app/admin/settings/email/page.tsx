'use client';
import React, { useState } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

export default function EmailDeliverabilityPage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [sendingTest, setSendingTest] = useState(false);

  const handleTest = () => {
    setSendingTest(true);
    setTimeout(() => {
      setSendingTest(false);
      setActiveModal(null);
      alert('Test email sent successfully to your admin address.');
    }, 1500);
  };

  return (
    <SuperAdminLayout title="Email Deliverability">
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
          <p className="text-slate-600 text-sm">Monitor global system email deliverability, configure SMTP/API providers, and manage domain reputation.</p>
          <button onClick={() => setActiveModal('test')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all whitespace-nowrap">
            Send Test Email
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
            <p className="text-xs text-slate-500 mb-1">Delivery Rate (30d)</p>
            <p className="text-3xl font-bold text-green-400">99.8%</p>
            <p className="text-xs text-green-500 mt-1">↑ 0.1% vs last month</p>
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
            <p className="text-xs text-slate-500 mb-1">Bounce Rate</p>
            <p className="text-3xl font-bold text-slate-900">0.12%</p>
            <p className="text-xs text-slate-500 mt-1">Well below 2% threshold</p>
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
            <p className="text-xs text-slate-500 mb-1">Spam Reports</p>
            <p className="text-3xl font-bold text-yellow-400">0.01%</p>
            <p className="text-xs text-slate-500 mt-1">14 reports in 30 days</p>
          </div>
          <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
            <p className="text-xs text-slate-500 mb-1">Emails Sent (30d)</p>
            <p className="text-3xl font-bold text-slate-900">1.4M</p>
            <p className="text-xs text-slate-500 mt-1">Across all tenants</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Domain Authentication */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Domain Authentication</h3>
              <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Verify Domains</button>
            </div>
            <div className="p-6 flex-1">
              <p className="text-sm text-slate-600 mb-6">Authentication ensures emails from CyberApex pass spam filters. All system sending domains must have valid records.</p>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 text-lg">â</div>
                    <div>
                      <p className="font-semibold text-slate-900">cyberapex.com</p>
                      <p className="text-xs text-slate-500 mt-0.5">Primary System Domain</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 rounded">SPF</span>
                    <span className="px-2 py-1 text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 rounded">DKIM</span>
                    <span className="px-2 py-1 text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 rounded">DMARC</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 text-lg">â</div>
                    <div>
                      <p className="font-semibold text-slate-900">mail.cyberawareness.io</p>
                      <p className="text-xs text-slate-500 mt-0.5">Phishing Simulator Domain</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 rounded">SPF</span>
                    <span className="px-2 py-1 text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 rounded">DKIM</span>
                    <span className="px-2 py-1 text-[10px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded">DMARC (None)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Provider Configuration */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Provider Configuration</h3>
              <button onClick={() => setActiveModal('config')} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Edit Settings</button>
            </div>
            <div className="p-6 flex-1 space-y-5">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Primary Provider</p>
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">ð§</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">SendGrid API V3</p>
                      <p className="text-xs text-green-400">Connected & Routing</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded border border-slate-300">Dedicated IP: 192.168.1.55</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Fallback Provider (SMTP)</p>
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">ð¡ï¸</span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Amazon SES (eu-west-1)</p>
                      <p className="text-xs text-slate-500">Standby</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-700">Enforce TLS for all outbound mail</span>
                  <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                    <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 border-blue-500 appearance-none cursor-pointer translate-x-5" />
                    <label className="toggle-label block overflow-hidden h-5 rounded-full bg-blue-500 cursor-pointer"></label>
                  </div>
                </label>
                <p className="text-xs text-slate-500 mt-2">Requires opportunistic startTLS for all recipient servers.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'test' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6">
              <h3 className="font-bold text-slate-900 text-lg mb-2">Send Test Email</h3>
              <p className="text-sm text-slate-600 mb-4">A standard template will be sent via SendGrid API to verify connectivity.</p>
              <input type="email" defaultValue="admin@cyberapex.io" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 mb-4 focus:outline-none focus:border-blue-500" />
              <div className="flex gap-3 justify-end">
                <button onClick={() => setActiveModal(null)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
                <button onClick={handleTest} disabled={sendingTest} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors min-w-[100px]">
                  {sendingTest ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'config' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm p-4">
          <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-slate-900">Provider Settings</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-500 hover:text-slate-900 text-xl">Ã</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Active Provider</label>
                <select className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500">
                  <option>SendGrid API</option>
                  <option>Amazon SES</option>
                  <option>Mailgun API</option>
                  <option>Custom SMTP</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">API Key</label>
                <input type="password" value="********************************" readOnly className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500 focus:outline-none" />
                <button className="text-xs text-blue-400 mt-1">Update Key</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">From Name (Default)</label>
                  <input type="text" defaultValue="CyberApex Security" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">From Email (Default)</label>
                  <input type="text" defaultValue="noreply@cyberapex.com" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-blue-500" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setActiveModal(null)} className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 transition-colors">Cancel</button>
              <button onClick={() => setActiveModal(null)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors border border-blue-500">Save Configuration</button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
}
