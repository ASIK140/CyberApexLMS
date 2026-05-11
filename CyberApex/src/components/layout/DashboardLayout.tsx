'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const roles = [
    { label: 'Super Admin', href: '/admin', color: 'text-red-400' },
    { label: 'CISO', href: '/ciso', color: 'text-blue-400' },
    { label: 'Tenant Admin', href: '/tenant-admin', color: 'text-purple-400' },
    { label: 'Employee', href: '/employee', color: 'text-cyan-400' },
];

const navSections = [
    {
        title: 'OVERVIEW',
        items: [
            { label: 'Dashboard', href: '/ciso', icon: '▪' },
            { label: 'Platform Analytics', href: '/ciso/analytics', icon: '▪' },
            { label: 'Global Risk Overview', href: '/ciso/global-risk', icon: '▪' },
        ],
    },
    {
        title: 'TRAINING & LMS',
        items: [
            { label: 'Training (LMS)', href: '/ciso/training', icon: '▪' },
            { label: 'Course Assignments', href: '/ciso/training/assignments', icon: '▪' },
            { label: 'Certifications', href: '/ciso/training/certs', icon: '▪' },
        ],
    },
    {
        title: 'THREAT SIMULATION',
        items: [
            { label: 'Phishing Engine', href: '/ciso/phishing', icon: '▪' },
            { label: 'Campaign Reports', href: '/ciso/phishing/reports', icon: '▪' },
            { label: 'Attack Templates', href: '/ciso/phishing/templates', icon: '▪' },
        ],
    },
    {
        title: 'RISK & COMPLIANCE',
        items: [
            { label: 'Compliance & Risk', href: '/ciso/compliance', icon: '▪' },
            { label: 'Audit Logs', href: '/ciso/compliance/audit', icon: '▪' },
            { label: 'Frameworks', href: '/ciso/compliance/frameworks', icon: '▪' },
        ],
    },
    {
        title: 'REPORTING',
        items: [
            { label: 'Human Risk Score', href: '/ciso/reports/risk', icon: '▪' },
            { label: 'Executive Reports', href: '/ciso/reports/executive', icon: '▪' },
            { label: 'Department Reports', href: '/ciso/reports/dept', icon: '▪' },
        ],
    },
];

const headerLabel: Record<string, string> = {
    '/ciso': 'Risk & Compliance Overview',
    '/ciso/training': 'Training & LMS',
    '/ciso/phishing': 'Phishing Engine',
    '/ciso/compliance': 'Compliance & Risk',
};

const DashboardLayout = ({
    children,
    role = 'CISO',
    currentPath,
}: {
    children: React.ReactNode;
    role?: string;
    currentPath?: string;
}) => {
    const pathname = usePathname();
    const activePath = currentPath || pathname;
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const title = headerLabel[activePath] || 'CISO Dashboard';

    return (
        <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden">

            {/* ── TOP NAVIGATION BAR ── */}
            <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 bg-white border-b border-slate-200 z-50">
                {/* Left: Logo + collapse */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="text-slate-600 hover:text-slate-900 transition-colors p-1.5 rounded-md hover:bg-slate-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <Link href="/ciso">
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 cursor-pointer">
                            CyberApex
                        </span>
                    </Link>
                </div>

                {/* Center: Role Tabs */}
                <nav className="hidden lg:flex items-center gap-1 bg-white shadow-sm border border-slate-200 rounded-lg p-1">
                    {roles.map(r => {
                        const isActive = activePath?.startsWith(r.href === '/ciso' ? '/ciso' : r.href) && r.href !== '/admin' || activePath === r.href;
                        return (
                            <Link key={r.href} href={r.href}>
                                <span className={`px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer transition-all duration-200 whitespace-nowrap ${isActive ? `bg-slate-100 ${r.color} shadow` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-100'
                                    }`}>
                                    {r.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-black"></span>
                        </button>
                        {notifOpen && (
                            <div className="absolute right-0 top-10 w-80 bg-white shadow-sm border border-slate-300 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                                    <p className="font-semibold text-sm text-slate-900">Notifications</p>
                                    <span className="text-xs text-blue-400 font-medium">2 unread</span>
                                </div>
                                <div className="divide-y divide-neutral-800">
                                    {[
                                        { icon: '🚨', title: 'Sales dept phishing click rate hit 38%', time: '5m ago', color: 'text-red-400' },
                                        { icon: '✅', title: 'Q1 Compliance report generated', time: '1h ago', color: 'text-green-400' },
                                        { icon: '📋', title: 'ISO 27001 audit due in 14 days', time: '3h ago', color: 'text-yellow-400' },
                                    ].map(n => (
                                        <div key={n.title} className="px-4 py-3 hover:bg-slate-100 cursor-pointer transition-colors">
                                            <div className="flex gap-3">
                                                <span className="text-lg">{n.icon}</span>
                                                <div>
                                                    <p className={`text-xs font-medium ${n.color}`}>{n.title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{n.time}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Settings */}
                    <button className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-blue-500 to-teal-400 flex items-center justify-center text-xs font-bold">CS</div>
                            <span className="text-sm font-medium text-slate-900 hidden sm:block">CISO User</span>
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {userMenuOpen && (
                            <div className="absolute right-0 top-10 w-48 bg-white shadow-sm border border-slate-300 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-200">
                                    <p className="text-sm font-medium text-slate-900">CISO User</p>
                                    <p className="text-xs text-slate-600">ciso@company.com</p>
                                </div>
                                <div className="py-1">
                                    {['Profile', 'Settings', 'Reports'].map(item => (
                                        <button key={item} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors">{item}</button>
                                    ))}
                                </div>
                                <div className="border-t border-slate-200 py-1">
                                    <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-100 transition-colors">Log Out</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* ── BODY ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── SIDEBAR ── */}
                <aside className={`${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-56'} flex-shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 overflow-y-auto`}>
                    <nav className="flex-1 py-3 px-2.5 space-y-0.5">
                        {navSections.map(section => (
                            <div key={section.title} className="mb-3">
                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest px-3 pt-3 pb-1.5">
                                    {section.title}
                                </p>
                                {section.items.map(item => {
                                    const isActive = activePath === item.href;
                                    return (
                                        <Link key={item.href} href={item.href}>
                                            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 ${isActive
                                                    ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white shadow-sm border border-transparent'
                                                }`}>
                                                <span className="text-sm">{item.icon}</span>
                                                <span className="text-xs font-medium">{item.label}</span>
                                                {isActive && <span className="ml-auto w-1 h-1 rounded-full bg-blue-400"></span>}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-3 border-t border-slate-200 flex-shrink-0">
                        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/20 border border-blue-800/30 rounded-lg p-3">
                            <p className="text-xs font-bold text-blue-400">Risk Status</p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                <span className="text-xs text-slate-600">Human Risk: 65/100</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ── MAIN CONTENT ── */}
                <main className="flex-1 overflow-y-auto bg-slate-50">
                    {/* Page Sub-header */}
                    <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
                            <p className="text-xs text-slate-500">CISO · CyberApex Security Platform</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export
                            </button>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-[0_0_12px_rgba(37,99,235,0.3)]">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </button>
                        </div>
                    </div>

                    {/* Page Content */}
                    <div className="p-6 space-y-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
