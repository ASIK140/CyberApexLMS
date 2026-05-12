'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

function doLogout(router: ReturnType<typeof useRouter>) {
    sessionStorage.removeItem('accessToken');
    document.cookie = 'loggedIn=; Max-Age=0; path=/;';
    document.cookie = 'role=; Max-Age=0; path=/;';
    router.push('/login');
}


type NavItem = {
    label: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
};

type NavSection = {
    title: string;
    items: NavItem[];
};

const Ic = ({ d, d2 }: { d: string; d2?: string }) => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
        {d2 && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d2} />}
    </svg>
);

const navSections: NavSection[] = [
    {
        title: 'OVERVIEW',
        items: [
            { label: 'Dashboard', href: '/admin', icon: <Ic d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
            { label: 'Tenants', href: '/admin/tenants', icon: <Ic d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />, badge: '12' },
            { label: 'Platform Health', href: '/admin/platform/health', icon: <Ic d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /> },
            { label: 'Students', href: '/admin/students', icon: <Ic d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /> },
        ],
    },
    {
        title: 'CONTENT MANAGEMENT',
        items: [
            { label: 'Content Library', href: '/admin/content-library', icon: <Ic d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
            { label: 'Studio Dashboard', href: '/admin/studio', icon: <Ic d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /> },
        ],
    },

    {
        title: 'PLATFORM',
        items: [
            { label: 'SSO Providers', href: '/admin/sso-providers', icon: <Ic d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /> },
            { label: 'Audit Log', href: '/admin/audit-log', icon: <Ic d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
            { label: 'Admin Accounts', href: '/admin/settings/accounts', icon: <Ic d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /> },
        ],
    },
];

export default function SuperAdminLayout({
    children,
    title = 'Dashboard',
    subtitle,
}: {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
}) {
    const pathname = usePathname();
    const router   = useRouter();
    const [notifOpen, setNotifOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [stats, setStats] = useState<any>(null);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const { apiFetch } = await import('@/utils/api');
                const res = await apiFetch('/admin/dashboard');
                const json = await res.json();
                if (json.success) setStats(json.data);
            } catch (err) {
                console.error('Failed to fetch layout stats', err);
            }
        };
        fetchStats();
    }, []);

    const handleDownload = (type: string) => {
        const fmt = type.toLowerCase() === 'excel' ? 'excel' : type.toLowerCase();
        let endpoint = '';
        
        if (pathname.includes('/audit-log')) {
            endpoint = `/admin/audit-log/export?format=${fmt}`;
        } else if (pathname.includes('/tenants')) {
            endpoint = `/admin/tenants/export?format=${fmt}`;
        } else if (pathname.includes('/industry-packs')) {
            endpoint = `/admin/industry-packs/export?format=${fmt}`;
        } else if (pathname.includes('/ciso/board-report')) {
            endpoint = `/ciso/board-report/export?format=${fmt}`;
        } else if (pathname.includes('/ciso/compliance')) {
            endpoint = `/ciso/compliance/export?format=${fmt}`;
        } else if (pathname.includes('/ciso')) {
            endpoint = `/ciso/export?format=${fmt}`;
        } else {
            // Default fallback to audit log
            endpoint = `/admin/audit-log/export?format=${fmt}`; 
        }

        console.log('[DEBUG] Export initiated:', { pathname, endpoint, fmt });

        const baseUrl = '/api';
        const sep = endpoint.includes('?') ? '&' : '?';
        // Use the stored token for demo authentication (valid 365d from 2026-05-02)
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6ImFkbWluQGN5YmVyYXBleC5pbyIsInJvbGUiOiJzdXBlcl9hZG1pbiIsInRlbmFudF9pZCI6bnVsbCwibmFtZSI6IlN1cGVyIEFkbWluIiwiaWF0IjoxNzc3NzI1ODMxLCJleHAiOjE4MDkyNjE4MzF9.lR308YOJLH-xyLuvcvCIIwJ_82nOCASmwQuxzkpmW8U';
        const downloadUrl = `${baseUrl}${endpoint}${sep}token=${token}`;
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        // We can't strictly set the filename here for cross-origin, 
        // but the Content-Disposition header from the server will handle it.
        link.click();
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden">

            {/* ——— TOP NAVIGATION BAR ——— */}
            <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 bg-white border-b border-slate-200 z-50">
                {/* Left: Logo + collapse button */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="text-slate-600 hover:text-slate-900 transition-colors p-1.5 rounded-md hover:bg-slate-100"
                        title="Toggle sidebar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <Link href="/admin">
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 cursor-pointer">
                            CyberApex
                        </span>
                    </Link>
                </div>


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
                                    <span className="text-xs text-red-400 font-medium">3 unread</span>
                                </div>
                                <div className="divide-y divide-neutral-800">
                                    {[
                                        { dot: 'bg-red-500', title: 'Critical Escalation: Tenant "Acme Corp"', time: '2m ago', color: 'text-red-400' },
                                        { dot: 'bg-yellow-500', title: 'API rate limit exceeded on /auth endpoint', time: '15m ago', color: 'text-yellow-400' },
                                        { dot: 'bg-green-500', title: 'Tenant "TechStart" — SSO configured successfully', time: '1h ago', color: 'text-green-400' },
                                    ].map(n => (
                                        <div key={n.title} className="px-4 py-3 hover:bg-slate-100 cursor-pointer transition-colors">
                                            <div className="flex gap-3 items-start">
                                                <span className={`w-2 h-2 rounded-full ${n.dot} mt-1 flex-shrink-0`}></span>
                                                <div>
                                                    <p className={`text-xs font-medium ${n.color}`}>{n.title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{n.time}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="px-4 py-2 border-t border-slate-200">
                                    <Link href="/admin/notifications">
                                        <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View all notifications</button>
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Settings */}
                    <Link href="/admin/settings">
                        <button className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </Link>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-red-500 to-orange-400 flex items-center justify-center text-xs font-bold">SA</div>
                            <span className="text-sm font-medium text-slate-900 hidden sm:block">Super Admin</span>
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {userMenuOpen && (
                            <div className="absolute right-0 top-10 w-48 bg-white shadow-sm border border-slate-300 rounded-xl shadow-2xl z-50 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-200">
                                    <p className="text-sm font-medium text-slate-900">Super Admin</p>
                                    <p className="text-xs text-slate-600">admin@cyberapex.io</p>
                                </div>
                                <div className="py-1">
                                    <Link href="/admin/settings/accounts">
                                        <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                                            Profile
                                        </button>
                                    </Link>
                                    <Link href="/admin/settings">
                                        <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                                            Settings
                                        </button>
                                    </Link>
                                    <Link href="/admin/security/api-keys">
                                        <button className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                                            API Access
                                        </button>
                                    </Link>
                                </div>
                                <div className="border-t border-slate-200 py-1">
                                    <button
                                        onClick={() => doLogout(router)}
                                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-100 transition-colors"
                                    >
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* â”€â”€ BODY: Sidebar + Main â”€â”€ */}
            <div className="flex flex-1 overflow-hidden">

                {/* â”€â”€ SIDEBAR â”€â”€ */}
                <aside
                    className={`${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-56'} flex-shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 overflow-y-auto`}
                >
                    <nav className="flex-1 py-3 px-2.5 space-y-0.5">
                        {navSections.map(section => (
                            <div key={section.title} className="mb-3">
                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest px-3 pt-3 pb-1.5">
                                    {section.title}
                                </p>
                                {section.items.map(item => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link key={item.href} href={item.href}>
                                            <div
                                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 group ${isActive
                                                    ? 'bg-red-500/10 text-red-300 border border-red-500/20'
                                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white shadow-sm border border-transparent'
                                                    }`}
                                            >
                                                <span className="text-sm">{item.icon}</span>
                                                <span className="text-xs font-medium">{item.label}</span>
                                                {(item.badge) || (item.label === 'Tenants' && stats?.overview?.total_tenants > 0) ? (
                                                    <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-100 text-slate-700 group-hover:bg-slate-100 transition-colors'}`}>
                                                        {item.label === 'Tenants' ? (stats?.overview?.total_tenants || item.badge) : 
                                                         item.badge}
                                                    </span>
                                                ) : isActive && (
                                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}
                    </nav>

                     {/* Sidebar Footer */}
                    <div className="p-3 border-t border-slate-200 flex-shrink-0 mb-8">
                        <div className={`rounded-xl p-3 border transition-all duration-300 ${
                            stats?.system_status?.status === 'operational' 
                                ? 'bg-green-500/5 border-green-500/10' 
                                : 'bg-red-500/5 border-red-500/10'
                        }`}>
                            <div className="flex items-center justify-between mb-1.5">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${
                                    stats?.system_status?.status === 'operational' ? 'text-green-500' : 'text-red-500'
                                }`}>System Status</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                    stats?.system_status?.status === 'operational' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                                }`}></span>
                                <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wide">
                                    {stats?.system_status?.status === 'operational' ? 'All systems operational' : 'Platform Issues Detected'}
                                </span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* â”€â”€ MAIN CONTENT â”€â”€ */}
                <main className="flex-1 overflow-y-auto bg-slate-50">
                    {/* Page Header */}
                    <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
                            <p className="text-xs text-slate-500">{subtitle || 'Super Admin · CyberApex Platform v2.1'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleDownload('PDF')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                PDF
                            </button>
                            <button onClick={() => handleDownload('CSV')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                CSV
                            </button>
                            <button onClick={() => handleDownload('Excel')} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Excel
                            </button>
                            <button onClick={() => window.location.reload()} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-[0_0_12px_rgba(220,38,38,0.3)] ml-2">
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
}
