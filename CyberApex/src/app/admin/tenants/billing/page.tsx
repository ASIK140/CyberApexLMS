'use client';
import React from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

export default function PlaceholderPage() {
  return (
    <SuperAdminLayout title="Tenant Billing">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20 text-center bg-white shadow-sm border border-slate-200 rounded-2xl mt-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 border border-slate-300 shadow-xl">
          <span className="text-3xl">🚧</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Module Under Construction</h2>
        <p className="text-slate-600 max-w-md mx-auto leading-relaxed mb-8">
          The <span className="text-slate-900 font-medium">Tenant Billing</span> module is currently in active beta. 
          It will allow you to: Subscription management, invoicing, and revenue tracking.
        </p>
        <div className="px-5 py-2.5 bg-red-900/10 border border-red-900/40 rounded-lg inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <p className="text-sm text-red-400 font-medium tracking-wide uppercase">Coming Soon in v2.2</p>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
