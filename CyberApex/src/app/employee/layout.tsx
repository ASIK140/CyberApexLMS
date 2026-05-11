'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import RoleLayout, { NavSection } from '@/components/layout/RoleLayout';

const I = ({ d }: { d: string }) => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
    </svg>
);

const navSections: NavSection[] = [
    {
        title: 'MY LEARNING', items: [
            { label: 'My Dashboard', href: '/employee', icon: <I d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /> },
            { label: 'My Courses', href: '/employee/courses', icon: <I d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /> },
            { label: 'Take Exam', href: '/employee/exams', icon: <I d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> },
        ]
    },
    {
        title: 'ACHIEVEMENTS', items: [
            { label: 'My Certificates', href: '/employee/achievements/certificates', icon: <I d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /> },
            { label: 'Badges & XP', href: '/employee/achievements/badges', icon: <I d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /> },
            { label: 'Leaderboard', href: '/employee/achievements/leaderboard', icon: <I d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
        ]
    },
    {
        title: 'SUPPORT', items: [
            { label: 'Phishing Debrief', href: '/employee/support/phishing-debrief', icon: <I d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> },
        ]
    },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    let title = "My Dashboard";
    let subtitle = "Employee";

    if (pathname.includes('/employee/courses')) {
        title = "My Courses";
        if (pathname.includes('/quiz')) title = "Chapter Quiz";
        else if (pathname.match(/\/employee\/courses\/[A-Za-z0-9-]+$/)) title = "Course Player";
    } else if (pathname.includes('/employee/achievements/certificates')) {
        title = "My Certificates";
    } else if (pathname.includes('/employee/achievements/badges')) {
        title = "Badges & XP";
    } else if (pathname.includes('/employee/achievements/leaderboard')) {
        title = "Leaderboard";
    } else if (pathname.includes('/employee/exams')) {
        title = "Take Exam";
    } else if (pathname.includes('/employee/support/phishing-debrief')) {
        title = "Phishing Simulation Debrief";
    }

    return (
        <RoleLayout
            title={title}
            subtitle={subtitle}
            accentColor="cyan"
            avatarText="AT"
            avatarGradient="bg-gradient-to-tr from-cyan-500 to-blue-400"
            userName="Alice Thompson"
            userEmail="alice.t@tenant.com"
            navSections={navSections}
            statusLabel="Security Status"
            statusValue="Low Risk"
            statusDot="bg-green-400"
            currentRole="employee"
        >
            {children}
        </RoleLayout>
    );
}
