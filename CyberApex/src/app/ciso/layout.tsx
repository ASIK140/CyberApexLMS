'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import RoleLayout, { NavSection } from '@/components/layout/RoleLayout';

// SVG icon helpers
const I = ({ d }: { d: string }) => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
);

const navSections: NavSection[] = [
    {
        title: 'RISK & COMPLIANCE',
        items: [
            { label: 'Risk Dashboard', href: '/ciso', icon: <I d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
            { label: 'Compliance Posture', href: '/ciso/compliance', icon: <I d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /> },
            { label: 'Risk Users', href: '/ciso/risk-users', icon: <I d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
            { label: 'Dept Heatmap', href: '/ciso/dept-heatmap', icon: <I d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /> },
            { label: 'Board Report', href: '/ciso/board-report', icon: <I d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
        ],
    },
    {
        title: 'PHISHING',
        items: [
            { label: 'Campaigns', href: '/ciso/campaigns', icon: <I d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
            { label: 'Results & Funnels', href: '/ciso/campaigns/results', icon: <I d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /> },
        ],
    },
    {
        title: 'TRAINING',
        items: [
            { label: 'Training Status', href: '/ciso/training', icon: <I d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
            { label: 'Remedial Tracking', href: '/ciso/training/remedial', icon: <I d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /> },
            { label: 'Certificates', href: '/ciso/training/certificates', icon: <I d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /> },
        ],
    },
    {
        title: 'PEOPLE',
        items: [
            { label: 'All Users', href: '/ciso/users', icon: <I d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
        ],
    },
    {
        title: 'REPORTS',
        items: [
            { label: 'Gap Analysis', href: '/ciso/reports/gap-analysis', icon: <I d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
            { label: 'Evidence Pack', href: '/ciso/reports/evidence', icon: <I d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /> },
            { label: 'Audit Log', href: '/ciso/reports/audit-log', icon: <I d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
        ],
    },
];

export default function CISOLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const titles: Record<string, { title: string; subtitle: string }> = {
        '/ciso': { title: 'Risk Dashboard', subtitle: 'Acme Corp — Organisation cyber risk posture overview.' },
        '/ciso/compliance': { title: 'Compliance Posture', subtitle: 'Regulatory framework mapping and coverage.' },
        '/ciso/risk-users': { title: 'Risk Users', subtitle: 'Employees with elevated risk score >= 60.' },
        '/ciso/dept-heatmap': { title: 'Department Heatmap', subtitle: 'Risk exposure by department across Acme Corp.' },
        '/ciso/board-report': { title: 'Board Report', subtitle: 'Executive security summary for board presentation.' },
        '/ciso/campaigns': { title: 'Phishing Campaigns', subtitle: 'Manage and monitor all phishing simulations.' },
        '/ciso/campaigns/results': { title: 'Results & Funnels', subtitle: 'Phishing campaign engagement funnel analysis.' },
        '/ciso/training': { title: 'Training Status', subtitle: 'Completion status across all training programmes.' },
        '/ciso/training/remedial': { title: 'Remedial Tracking', subtitle: 'Employees assigned additional remedial training.' },
        '/ciso/training/certificates': { title: 'Certificates', subtitle: 'Track all issued certificates across the organisation.' },
        '/ciso/users': { title: 'All Users', subtitle: 'Full employee roster and security posture.' },
        '/ciso/reports/gap-analysis': { title: 'Gap Analysis', subtitle: 'Training compliance gaps vs framework requirements.' },
        '/ciso/reports/evidence': { title: 'Evidence Pack', subtitle: 'Downloadable audit evidence packages per framework.' },
        '/ciso/reports/audit-log': { title: 'Audit Log', subtitle: 'All CISO-level actions and system events.' },
    };

    const current = titles[pathname] ?? { title: 'CISO Dashboard', subtitle: 'Acme Corp — CyberApex Security Intelligence' };

    return (
        <RoleLayout
            title={current.title}
            subtitle={current.subtitle}
            accentColor="blue"
            avatarText="AC"
            avatarGradient="bg-gradient-to-tr from-blue-600 to-cyan-400"
            userName="CISO — Acme Corp"
            userEmail="ciso@acmecorp.com"
            navSections={navSections}
            statusLabel="Organisation Risk"
            statusValue="58 / 100 — Elevated"
            statusDot="bg-yellow-400"
            currentRole="ciso"
        >
            {children}
        </RoleLayout>
    );
}
