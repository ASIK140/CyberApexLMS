'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export interface NavSection {
    title: string;
    items: { label: string; href: string; icon: React.ReactNode }[];
}

const I = ({ d }: { d: string }) => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
);

const navSections: NavSection[] = [
    {
        title: 'MY LEARNING', items: [
            { label: 'My Dashboard', href: '/student', icon: <I d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
            { label: 'My Courses', href: '/student/courses', icon: <I d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
            { label: 'Take Exam', href: '/student/exams', icon: <I d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> },
        ]
    },
    {
        title: 'ACHIEVEMENTS', items: [
            { label: 'My Certificates', href: '/student/certificates', icon: <I d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /> },
        ]
    },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [studentName, setStudentName] = useState('Student');
    const [studentEmail, setStudentEmail] = useState('');
    const [avatarText, setAvatarText] = useState('S');

    useEffect(() => {
        import('@/utils/api').then(({ apiClient }) => {
            apiClient.get('/student/me')
                .then(res => {
                    const d = res.data?.data;
                    if (d) {
                        const name = d.name || 'Student';
                        setStudentName(name);
                        setStudentEmail(d.email || '');
                        setAvatarText(name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2));
                    }
                })
                .catch(() => {});
        });
    }, []);

    let title = 'My Dashboard';
    let subtitle = 'Student';
    if (pathname.includes('/student/courses')) { title = 'My Courses'; subtitle = 'Assigned Courses'; }
    else if (pathname.includes('/student/exams')) { title = 'Take Exam'; subtitle = 'Exams & Assessments'; }
    else if (pathname.includes('/student/certificates')) { title = 'My Certificates'; subtitle = 'Earned Certificates'; }

    const accentActiveClass = 'bg-cyan-500/10 text-cyan-600 border border-cyan-500/20';
    const accentDot = 'bg-cyan-400';

    const handleLogout = async () => {
        // Clear Zustand auth state
        const { useAuthStore } = await import('@/stores/auth.store');
        useAuthStore.getState().logout();
        // Clear persisted tokens and cookies
        sessionStorage.removeItem('refreshToken');
        document.cookie = 'loggedIn=; Max-Age=0; path=/;';
        document.cookie = 'role=; Max-Age=0; path=/;';
        router.push('/login');
    };

    return (
        <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden">
            {/* TOP NAV */}
            <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 bg-white border-b border-slate-200 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="text-slate-600 hover:text-slate-900 transition-colors p-1.5 rounded-md hover:bg-slate-100">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <Link href="/student">
                        <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 cursor-pointer">CyberApex</span>
                    </Link>
                </div>

                {/* Student badge — no role switcher tabs */}
                <div className="hidden lg:flex items-center">
                    <span className="px-3 py-1.5 rounded-md text-xs font-semibold bg-cyan-50 text-cyan-600 border border-cyan-200">
                        🎓 Student Portal
                    </span>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </button>
                        {notifOpen && (
                            <div className="absolute right-0 top-10 w-72 bg-white shadow-xl border border-slate-200 rounded-xl z-50">
                                <div className="px-4 py-3 border-b border-slate-200">
                                    <p className="font-semibold text-sm text-slate-900">Notifications</p>
                                </div>
                                <div className="px-4 py-3 text-sm text-slate-500 text-center">No new notifications</div>
                            </div>
                        )}
                    </div>
                    <div className="relative">
                        <button onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-400 flex items-center justify-center text-xs font-bold text-white">{avatarText}</div>
                            <span className="text-sm font-medium text-slate-900 hidden sm:block">{studentName}</span>
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        {userMenuOpen && (
                            <div className="absolute right-0 top-10 w-48 bg-white shadow-xl border border-slate-200 rounded-xl z-50">
                                <div className="px-4 py-3 border-b border-slate-200">
                                    <p className="text-sm font-semibold text-slate-900">{studentName}</p>
                                    <p className="text-xs text-slate-500 truncate">{studentEmail}</p>
                                </div>
                                <div className="border-t border-slate-200 py-1">
                                    <button onClick={handleLogout}
                                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-slate-50 transition-colors">
                                        Log Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* BODY */}
            <div className="flex flex-1 overflow-hidden">
                {/* SIDEBAR */}
                <aside className={`${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-56'} flex-shrink-0 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 overflow-y-auto`}>
                    <nav className="flex-1 py-3 px-2.5">
                        {navSections.map(section => (
                            <div key={section.title} className="mb-3">
                                <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest px-3 pt-3 pb-1.5">{section.title}</p>
                                {section.items.map(item => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link key={item.href} href={item.href}>
                                            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-150 ${isActive ? accentActiveClass : 'text-slate-500 hover:text-slate-800 hover:bg-white shadow-sm border border-transparent'}`}>
                                                <span className="text-sm">{item.icon}</span>
                                                <span className="text-xs font-medium">{item.label}</span>
                                                {isActive && <span className={`ml-auto w-1 h-1 rounded-full ${accentDot}`}></span>}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}
                    </nav>
                    <div className="p-3 border-t border-slate-200 flex-shrink-0">
                        <div className="border border-cyan-100 rounded-lg p-3 bg-cyan-50">
                            <p className="text-xs font-bold text-cyan-700">Learning Status</p>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                <span className="text-xs text-cyan-600">Active Learner</span>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MAIN */}
                <main className="flex-1 overflow-y-auto bg-slate-50">
                    <div className="sticky top-0 z-30 bg-slate-50/90 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-bold text-slate-900">{title}</h2>
                            <p className="text-xs text-slate-500">{subtitle}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </button>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">{children}</div>
                </main>
            </div>
        </div>
    );
}
