'use client';
import React from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

export default function GlobalSettingsPage() {
    return (
        <SuperAdminLayout title="System Settings">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Global Platform Settings</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage platform-wide configurations, security policies, and administrative preferences.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { title: 'Email Deliverability', icon: '✉️', desc: 'Configure SMTP, DKIM, and SPF protocols for platform emails.' },
                        { title: 'Notification Templates', icon: '🔔', desc: 'Customize email and push notification templates sent to users.' },
                        { title: 'Automation Rules', icon: '⚙️', desc: 'Manage global automation workflows and triggers.' },
                        { title: 'Admin Accounts', icon: '👤', desc: 'Manage Super Admin and global platform access.' },
                        { title: 'Security Policies', icon: '🛡️', desc: 'Configure global password requirements, MFA, and SSO settings.' },
                        { title: 'Billing & Subscriptions', icon: '💳', desc: 'Manage platform revenue, Stripe integration, and plans.' },
                    ].map(setting => (
                        <div key={setting.title} className="p-5 rounded-xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{setting.icon}</span>
                                <h3 className="font-semibold text-slate-900 group-hover:text-red-400 transition-colors">{setting.title}</h3>
                            </div>
                            <p className="text-xs text-slate-500">{setting.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </SuperAdminLayout>
    );
}
