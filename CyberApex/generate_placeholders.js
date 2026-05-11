const fs = require('fs');
const path = require('path');

const pages = [
    { path: 'analytics', title: 'Platform Analytics', desc: 'Comprehensive platform-wide metrics and usage analytics.' },
    { path: 'global-risk', title: 'Global Risk Overview', desc: 'Aggregate risk scores and vulnerabilities across all tenants.' },
    { path: 'tenants/health', title: 'Tenant Health', desc: 'Monitoring the health status and engagement levels of all tenants.' },
    { path: 'tenants/billing', title: 'Tenant Billing', desc: 'Subscription management, invoicing, and revenue tracking.' },
    { path: 'tenants/activity', title: 'Tenant Activity', desc: 'Real-time activity logs and usage metrics for tenants.' },
    { path: 'platform/health', title: 'Platform Health', desc: 'System status, uptime, and infrastructure health monitoring.' },
    { path: 'platform/queue', title: 'Queue Monitoring', desc: 'Background job processing and email queue status.' },
    { path: 'platform/storage', title: 'Storage Monitoring', desc: 'Database and asset storage capacity and usage.' },
    { path: 'security', title: 'Security Center', desc: 'Global security settings and incident management.' },
    { path: 'security/sso', title: 'SSO Providers', desc: 'SAML and OAuth integration settings for global access.' },
    { path: 'security/audit', title: 'Audit Logs', desc: 'Comprehensive platform-wide audit trail and compliance logs.' },
    { path: 'settings/email', title: 'Email Deliverability', desc: 'SMTP settings, domain verification, and email health.' },
    { path: 'settings/notifications', title: 'Notification Templates', desc: 'Manage system-wide email and push notification templates.' },
    { path: 'settings/automation', title: 'Automation Rules', desc: 'Configure global workflows and automated triggers.' },
];

const basePath = path.join(process.cwd(), 'src/app/admin');

pages.forEach(p => {
    const dir = path.join(basePath, p.path);
    fs.mkdirSync(dir, { recursive: true });

    const content = `'use client';
import React from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

export default function PlaceholderPage() {
  return (
    <SuperAdminLayout title="${p.title}">
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20 text-center bg-neutral-900 border border-neutral-800 rounded-2xl mt-4">
        <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-6 border border-neutral-700 shadow-xl">
          <span className="text-3xl">🚧</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Module Under Construction</h2>
        <p className="text-neutral-400 max-w-md mx-auto leading-relaxed mb-8">
          The <span className="text-white font-medium">${p.title}</span> module is currently in active beta. 
          It will allow you to: ${p.desc}
        </p>
        <div className="px-5 py-2.5 bg-red-900/10 border border-red-900/40 rounded-lg inline-flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <p className="text-sm text-red-400 font-medium tracking-wide uppercase">Coming Soon in v2.2</p>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
`;

    fs.writeFileSync(path.join(dir, 'page.tsx'), content);
});

console.log('Successfully generated 14 placeholder module pages.');
