'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

// ─── DATA ──────────────────────────────────────────────────────────────
const kpiRow1 = [
    { label: 'Active Tenants', value: '142', change: '+4', changeDir: 'up', icon: '🏢', color: 'bg-sky-50 border-sky-100 shadow-sm' },
    { label: 'Total Employees', value: '89,412', change: '+2.1k', changeDir: 'up', icon: '👥', color: 'bg-indigo-50 border-indigo-100 shadow-sm' },
    { label: 'Monthly Revenue', value: '$284,500', change: '+12%', changeDir: 'up', icon: '💰', color: 'bg-emerald-50 border-emerald-100 shadow-sm' },
];

const kpiRow2 = [
    { label: 'Platform Uptime', value: '99.98%', change: '30d avg', changeDir: 'neutral', icon: '⚡', color: 'bg-cyan-50 border-cyan-100 shadow-sm' },
    { label: 'Courses Published', value: '1,284', change: '+38', changeDir: 'up', icon: '📚', color: 'bg-indigo-50 border-indigo-100 shadow-sm' },
    { label: 'Email Health', value: '97.3%', change: 'Delivery rate', changeDir: 'neutral', icon: '✉️', color: 'bg-teal-50 border-teal-100 shadow-sm' },
    { label: 'Studio Courses', value: '1,284', change: '+38 this month', changeDir: 'up', icon: '📚', color: 'bg-orange-50 border-orange-100 shadow-sm' },
];

const tenants = [
    { name: 'Acme Corporation', plan: 'Enterprise', seats: '450/500', health: 94, risk: 'Low', status: 'Active', lastActivity: '2m ago' },
    { name: 'TechNova Inc.', plan: 'Business', seats: '280/300', health: 78, risk: 'Medium', status: 'Active', lastActivity: '18m ago' },
    { name: 'Global Finance Ltd.', plan: 'Enterprise', seats: '1100/1200', health: 62, risk: 'High', status: 'Flagged', lastActivity: '2h ago' },
    { name: 'Retail Brands Co.', plan: 'Starter', seats: '45/50', health: 88, risk: 'Low', status: 'Active', lastActivity: '35m ago' },
    { name: 'MediCare Group', plan: 'Business', seats: '190/250', health: 55, risk: 'High', status: 'Trial', lastActivity: '4h ago' },
    { name: 'EduTech Systems', plan: 'Starter', seats: '28/50', health: 91, risk: 'Low', status: 'Active', lastActivity: '6h ago' },
    { name: 'SecureBank PLC', plan: 'Enterprise', seats: '820/1000', health: 72, risk: 'Medium', status: 'Active', lastActivity: '1d ago' },
];

const securityMetrics = [
    { label: 'Global Human Risk Score', value: '62/100', sub: 'Across all tenants', color: 'text-amber-500', bg: 'bg-white border-slate-200 shadow-sm' },
    { label: 'Failed Login Attempts', value: '4,821', sub: 'Last 24 hours', color: 'text-red-500', bg: 'bg-white border-slate-200 shadow-sm' },
    { label: 'Security Alerts', value: '14', sub: '3 critical, 11 high', color: 'text-orange-500', bg: 'bg-white border-slate-200 shadow-sm' },
    { label: 'Avg Phishing Click Rate', value: '18.4%', sub: 'Platform average', color: 'text-purple-500', bg: 'bg-white border-slate-200 shadow-sm' },
];

const infraCards = [
    { label: 'API Usage', value: '68%', used: '1.36M / 2M req/day', bar: 68, color: 'bg-blue-500', warn: false },
    { label: 'Storage Usage', value: '54%', used: '2.7 TB / 5 TB', bar: 54, color: 'bg-purple-500', warn: false },
    { label: 'Email Queue', value: '1,240 queued', used: '~4 min delivery lag', bar: 24, color: 'bg-teal-500', warn: false },
    { label: 'AI Engine Status', value: 'Operational', used: 'Latency: 220ms avg', bar: 100, color: 'bg-green-500', warn: false },
];

// Bar chart data for Platform Analytics
const dailyActiveUsers = [45, 62, 78, 55, 90, 84, 72, 95, 88, 76, 60, 82];
const courseCompletions = [20, 35, 28, 45, 52, 38, 42, 60, 55, 48, 30, 50];
const phishingActivity = [12, 25, 18, 30, 22, 40, 15, 35, 28, 45, 20, 38];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const riskBadge = (risk: string) => {
    const map: Record<string, string> = {
        Low: 'text-green-400 bg-green-400/10 border-green-500/20',
        Medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-500/20',
        High: 'text-red-400 bg-red-400/10 border-red-500/20',
    };
    return map[risk] || 'text-slate-600 bg-slate-100 border-slate-300';
};

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        Active: 'text-green-400 bg-green-400/10 border-green-500/20',
        Trial: 'text-blue-400 bg-blue-400/10 border-blue-500/20',
        Flagged: 'text-red-400 bg-red-400/10 border-red-500/20',
        Suspended: 'text-orange-400 bg-orange-400/10 border-orange-500/20',
    };
    return map[status] || 'text-slate-600 bg-slate-100 border-slate-300';
};

// ─── Mock fallback (used when backend API is unreachable / 401) ───────────────
const MOCK_STATS = {
    overview:      { active_tenants: 142, total_users: 89412, courses_published: 1284, active_campaigns: 5 },
    revenue:       { mrr: 284500 },
    system_status: { uptime_pct: 99.98 },
};

// ─── COMPONENT ────────────────────────────────────────────────────────
export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [tenantsList, setTenantsList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tenantSearch, setTenantSearch] = useState('');
    const [selectedChart, setSelectedChart] = useState<'dau' | 'completions' | 'phishing'>('dau');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [editModalTenant, setEditModalTenant] = useState<any | null>(null);
    const [suspendModalTenant, setSuspendModalTenant] = useState<any | null>(null);

    // ── Student state ──────────────────────────────────────────────────────────
    const [studentsList, setStudentsList] = useState<any[]>([]);
    const [showAddStudent, setShowAddStudent] = useState(false);
    const [studentForm, setStudentForm] = useState({ name: '', email: '', phone: '', login_id: '', password: '', course_id: '', course_title: '' });
    const [studentFormError, setStudentFormError] = useState<string | null>(null);
    const [studentFormLoading, setStudentFormLoading] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');

    const fetchTenants = async () => {
        try {
            const { apiClient } = await import('@/utils/api');
            const res = await apiClient.get('/v1/tenants');
            if (res.data) {
                const mapped = res.data.data.map((t: any) => ({
                    id: t.id,
                    name: t.name,
                    contact: t.createdBy, // placeholder
                    plan: t.subscriptionPlan,
                    seats: `N/A / ${t.maxUsers === -1 ? 'Unlimited' : t.maxUsers}`,
                    health: 85, 
                    risk: 'Low', 
                    status: t.status.charAt(0).toUpperCase() + t.status.slice(1),
                    lastActivity: 'Recent'
                }));
                setTenantsList(mapped);
            }
        } catch (err) {
            console.error('Failed to fetch tenants', err);
        }
    };

    const fetchStudents = async () => {
        try {
            const { apiClient } = await import('@/utils/api');
            // Assuming global student list is available or using legacy
            const res = await apiClient.get('/admin/students');
            if (res.data?.success) setStudentsList(res.data.data);
        } catch (err) {
            console.error('Failed to fetch students', err);
        }
    };

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const { apiClient } = await import('@/utils/api');
                const res = await apiClient.get('/admin/dashboard');
                if (res.data?.success) {
                    setStats(res.data.data);
                    await fetchTenants();
                    await fetchStudents();
                } else {
                    setStats(MOCK_STATS);
                    await fetchTenants();
                }
            } catch (err: any) {
                console.error('Failed to fetch dashboard', err);
                setError(err.message || 'Failed to connect to the platform API.');
                setStats(MOCK_STATS);
                await fetchTenants();
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return (
        <SuperAdminLayout title="Super Admin Dashboard">
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                <span className="ml-3 text-slate-600">Loading platform metrics...</span>
            </div>
        </SuperAdminLayout>
    );

    if (error && !stats) return (
        <SuperAdminLayout title="Super Admin Dashboard">
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-medium">
                    ⚠️ {error}
                </div>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg transition-colors">
                    Retry Connection
                </button>
            </div>
        </SuperAdminLayout>
    );

    const kpiRow1Fetched = [
        { label: 'Active Tenants', value: stats.overview.active_tenants, change: '+4', changeDir: 'up', icon: '🏢', color: 'bg-sky-50 border-sky-100 shadow-sm' },
        { label: 'Total Employees', value: stats.overview.total_users.toLocaleString(), change: '+2.1k', changeDir: 'up', icon: '👥', color: 'bg-indigo-50 border-indigo-100 shadow-sm' },
        { label: 'Monthly Revenue', value: `$${stats.revenue.mrr.toLocaleString()}`, change: '+12%', changeDir: 'up', icon: '💰', color: 'bg-emerald-50 border-emerald-100 shadow-sm' },
    ];

    const kpiRow2Fetched = [
        { label: 'Platform Uptime', value: `${stats.system_status.uptime_pct}%`, change: '30d avg', changeDir: 'neutral', icon: '⚡', color: 'bg-cyan-50 border-cyan-100 shadow-sm' },
        { label: 'Courses Published', value: stats.overview.courses_published.toLocaleString(), change: '+38', changeDir: 'up', icon: '📚', color: 'bg-indigo-50 border-indigo-100 shadow-sm' },
        { label: 'Email Health', value: '97.3%', change: 'Delivery rate', changeDir: 'neutral', icon: '✉️', color: 'bg-teal-50 border-teal-100 shadow-sm' },
        { label: 'Studio Courses', value: stats.overview.active_campaigns > 0 ? stats.overview.courses_published : 47, change: '+38 this month', changeDir: 'up', icon: '🎬', color: 'bg-orange-50 border-orange-100 shadow-sm' },
    ];

    const chartData = selectedChart === 'dau' ? dailyActiveUsers : selectedChart === 'completions' ? courseCompletions : phishingActivity;
    const chartColor = selectedChart === 'dau' ? 'from-blue-600 to-cyan-400' : selectedChart === 'completions' ? 'from-green-600 to-teal-400' : 'from-red-600 to-orange-400';
    const chartLabel = selectedChart === 'dau' ? 'Daily Active Users (K)' : selectedChart === 'completions' ? 'Course Completions (K)' : 'Phishing Campaigns Active';

    const filteredTenants = tenantsList.filter(t => t.name.toLowerCase().includes(tenantSearch.toLowerCase()));

    return (
        <SuperAdminLayout title="Super Admin Dashboard">

            {/* ══ ROW 1: KPI CARDS ══ */}
            <section>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Platform KPIs</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiRow1Fetched.map(kpi => (
                        <div key={kpi.label} className={`p-4 rounded-2xl border ${kpi.color} relative overflow-hidden transition-all hover:scale-[1.02]`}>
                            <div className="flex items-start justify-between">
                                <span className="text-2xl">{kpi.icon}</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${kpi.changeDir === 'up' ? 'text-green-400 bg-green-400/10' : kpi.changeDir === 'down' ? 'text-red-400 bg-red-400/10' : 'text-slate-600 bg-slate-100'}`}>
                                    {kpi.changeDir === 'up' ? '↑' : kpi.changeDir === 'down' ? '↓' : ''} {kpi.change}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 mt-3">{kpi.value}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{kpi.label}</p>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                    {kpiRow2Fetched.map(kpi => (
                        <div key={kpi.label} className={`p-4 rounded-2xl border ${kpi.color} relative overflow-hidden transition-all hover:scale-[1.02]`}>
                            <div className="flex items-start justify-between">
                                <span className="text-2xl">{kpi.icon}</span>
                                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{kpi.change}</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-900 mt-3">{kpi.value}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{kpi.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══ ROW 2: Security Overview + Infrastructure ══ */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* SECURITY OVERVIEW */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Security Overview</h3>
                        <button className="text-xs text-red-400 hover:text-red-300 transition-colors">View Security Center →</button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {securityMetrics.map(m => (
                            <div key={m.label} className={`p-4 rounded-xl border ${m.bg}`}>
                                <p className="text-xs text-slate-600">{m.label}</p>
                                <p className={`text-2xl font-bold mt-2 ${m.color}`}>{m.value}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{m.sub}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* INFRASTRUCTURE STATUS */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Platform Infrastructure</h3>
                        <Link href="/admin/platform/health">
                            <button className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Platform Health →</button>
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {infraCards.map(card => (
                            <div key={card.label} className="p-4 rounded-xl bg-white shadow-sm border border-slate-200 hover:border-slate-300 transition-colors">
                                <p className="text-xs text-slate-600">{card.label}</p>
                                <p className="text-lg font-bold text-slate-900 mt-2">{card.value}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{card.used}</p>
                                {card.label !== 'AI Engine Status' && (
                                    <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${card.bar > 80 ? 'bg-red-500' : card.bar > 60 ? 'bg-yellow-500' : card.color} rounded-full transition-all`}
                                            style={{ width: `${card.bar}%` }}
                                        />
                                    </div>
                                )}
                                {card.label === 'AI Engine Status' && (
                                    <div className="flex items-center gap-1.5 mt-3">
                                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                        <span className="text-xs text-green-400">Online</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* ══ ROW 3: Platform Analytics Chart ══ */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Platform Analytics</h3>
                    <div className="flex items-center gap-2">
                        {[
                            { key: 'dau', label: 'Daily Active Users' },
                            { key: 'completions', label: 'Course Completions' },
                            { key: 'phishing', label: 'Phishing Activity' },
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setSelectedChart(tab.key as 'dau' | 'completions' | 'phishing')}
                                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${selectedChart === tab.key
                                        ? 'bg-neutral-700 text-slate-900 border border-neutral-600'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-5 rounded-2xl bg-white shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-semibold text-slate-900">{chartLabel}</p>
                            <p className="text-xs text-slate-500">Last 12 months — all tenants</p>
                        </div>
                        <div className="flex gap-1.5">
                            {['1W', '1M', '3M', '1Y'].map(r => (
                                <button key={r} className={`text-xs px-2.5 py-1 rounded-md ${r === '1Y' ? 'bg-neutral-700 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}>{r}</button>
                            ))}
                        </div>
                    </div>
                    <div className="h-48 flex items-end gap-1.5 px-2">
                        {chartData.map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative h-full">
                                <div className="w-full flex-1 flex items-end">
                                    <div
                                        className={`w-full bg-gradient-to-t ${chartColor} rounded-t-sm transition-all duration-500 hover:opacity-80 cursor-pointer`}
                                        style={{ height: `${(h / Math.max(...chartData)) * 100}%` }}
                                        title={`${months[i]}: ${h}k`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 px-2">
                        {months.map(m => (
                            <span key={m} className="text-[10px] text-neutral-600 flex-1 text-center">{m}</span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ══ ROW 4: Tenant Health Table ══ */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tenant Health</h3>
                    <div className="flex items-center gap-2">
                        <input
                            value={tenantSearch}
                            onChange={e => setTenantSearch(e.target.value)}
                            placeholder="Search tenants..."
                            className="px-3 py-1.5 bg-white shadow-sm border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-neutral-500 focus:outline-none focus:border-red-500 w-48 transition-colors"
                        />
                        <button onClick={() => setTenantSearch(tenantSearch)} className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 transition-colors">
                            Filter
                        </button>
                        <button onClick={() => setIsAddModalOpen(true)} className="text-xs px-3 py-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 rounded-lg border border-red-500/20 transition-colors">
                            + New Tenant
                        </button>
                    </div>
                </div>
                <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                                <th className="text-left px-5 py-3">Tenant Name</th>
                                <th className="text-left px-5 py-3">Plan</th>
                                <th className="text-left px-5 py-3">Seat Usage</th>
                                <th className="text-left px-5 py-3">Health</th>
                                <th className="text-left px-5 py-3">Risk</th>
                                <th className="text-left px-5 py-3">Status</th>
                                <th className="text-left px-5 py-3">Last Activity</th>
                                <th className="text-left px-5 py-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/50">
                            {filteredTenants.map((t, idx) => (
                                <tr key={`tenant-${t.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-3.5 font-semibold text-slate-900">{t.name}</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${t.plan === 'Enterprise' ? 'text-purple-400 bg-purple-400/10 border border-purple-500/20' :
                                                t.plan === 'Business' ? 'text-blue-400 bg-blue-400/10 border border-blue-500/20' :
                                                    'text-slate-600 bg-slate-100 border border-slate-300'
                                            }`}>{t.plan}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${parseInt(t.seats) / parseInt(t.seats.split('/')[1]) > 0.9 ? 'bg-red-500' : 'bg-blue-500'}`}
                                                    style={{ width: `${(parseInt(t.seats) / parseInt(t.seats.split('/')[1])) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-slate-600">{t.seats}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold ${t.health >= 85 ? 'text-green-400' : t.health >= 65 ? 'text-yellow-400' : 'text-red-400'}`}>{t.health}</span>
                                            <div className="w-12 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${t.health >= 85 ? 'bg-green-500' : t.health >= 65 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${t.health}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${riskBadge(t.risk)}`}>{t.risk}</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusBadge(t.status)}`}>{t.status}</span>
                                    </td>
                                    <td className="px-5 py-3.5 text-slate-500">{t.lastActivity}</td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex gap-1.5 relative">
                                            <Link href="/admin/tenants/details">
                                                <button className="px-2.5 py-1 bg-slate-100 hover:bg-slate-100 text-slate-700 rounded-md border border-slate-300 transition-colors text-[10px]">View</button>
                                            </Link>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveDropdown(activeDropdown === t.id ? null : t.id);
                                                }}
                                                className="px-2.5 py-1 bg-slate-100 hover:bg-red-900/40 text-slate-600 hover:text-red-400 rounded-md border border-slate-300 hover:border-red-500/30 transition-colors text-[10px]"
                                            >
                                                •••
                                            </button>

                                            {/* Action Dropdown */}
                                            {activeDropdown === t.id && (
                                                <div className="absolute right-0 top-full mt-1 w-36 bg-white shadow-sm border border-slate-300 rounded-lg shadow-xl z-10 overflow-hidden text-left">
                                                    <button onClick={() => { setEditModalTenant(t); setActiveDropdown(null); }} className="w-full text-left px-4 py-2.5 text-[10px] text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors">Edit Tenant</button>
                                                    <div className="border-t border-slate-200"></div>
                                                    <button onClick={() => { setSuspendModalTenant(t); setActiveDropdown(null); }} className="w-full text-left px-4 py-2.5 text-[10px] text-orange-400 hover:bg-slate-100 transition-colors">Suspend Tenant</button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Add Tenant Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4 text-left">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm/50">
                            <h3 className="font-bold text-lg text-slate-900">Add New Tenant</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-900 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Organization Name *</label>
                                <input id="db-new-org-name" type="text" placeholder="e.g. Acme Corporation" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Primary Contact Name *</label>
                                    <input id="db-new-contact-name" type="text" placeholder="John Doe" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Contact Email *</label>
                                    <input id="db-new-contact-email" type="email" placeholder="admin@org.com" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Subscription Plan</label>
                                    <select id="db-new-plan" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors cursor-pointer appearance-none">
                                        <option>Enterprise</option>
                                        <option>Business</option>
                                        <option>Starter</option>
                                        <option>Trial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Seat Allocation</label>
                                    <input id="db-new-seats" type="number" defaultValue={100} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 bg-white shadow-sm/50 flex justify-end gap-3">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const name = (document.getElementById('db-new-org-name') as HTMLInputElement).value;
                                    const email = (document.getElementById('db-new-contact-email') as HTMLInputElement).value;
                                    const plan = (document.getElementById('db-new-plan') as HTMLSelectElement).value;
                                    const seats = (document.getElementById('db-new-seats') as HTMLInputElement).value;

                                    try {
                                        const { apiFetch } = await import('@/utils/api');
                                        const res = await apiFetch('/admin/tenants', {
                                            method: 'POST',
                                            body: JSON.stringify({ organization_name: name, admin_email: email, plan_type: plan, user_limit: parseInt(seats) })
                                        });
                                        if (res.ok) {
                                            setIsAddModalOpen(false);
                                            await fetchTenants();
                                            // Refresh stats too
                                            const statsRes = await apiFetch('/admin/dashboard');
                                            const statsJson = await statsRes.json();
                                            if (statsJson.success) setStats(statsJson.data);
                                        }
                                    } catch (err) {
                                        console.error('Failed to create tenant', err);
                                    }
                                }}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_12px_rgba(220,38,38,0.3)]"
                            >
                                Create Tenant
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Tenant Modal */}
            {editModalTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4 text-left">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm/50">
                            <h3 className="font-bold text-lg text-slate-900">Edit {editModalTenant.name}</h3>
                            <button onClick={() => setEditModalTenant(null)} className="text-slate-500 hover:text-slate-900 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Organization Name *</label>
                                <input type="text" defaultValue={editModalTenant.name} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Primary Contact Name *</label>
                                    <input type="text" defaultValue={editModalTenant.contact.split('@')[0]} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Contact Email *</label>
                                    <input type="email" defaultValue={editModalTenant.contact} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Subscription Plan</label>
                                    <select defaultValue={editModalTenant.plan} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors cursor-pointer appearance-none">
                                        <option>Enterprise</option>
                                        <option>Business</option>
                                        <option>Starter</option>
                                        <option>Trial</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5 uppercase tracking-wider">Seat Allocation</label>
                                    <input type="number" defaultValue={parseInt(editModalTenant.seats.split('/')[1])} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-red-500 transition-colors" />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 bg-white shadow-sm/50 flex justify-end gap-3">
                            <button onClick={() => setEditModalTenant(null)} className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => setEditModalTenant(null)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_12px_rgba(37,99,235,0.3)]">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspend Tenant Modal */}
            {suspendModalTenant && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm p-4 text-left">
                    <div className="bg-white shadow-sm border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 text-center space-y-4">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-red-500/20">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            </div>
                            <h3 className="font-bold text-xl text-slate-900">Suspend {suspendModalTenant.name}?</h3>
                            <p className="text-sm text-slate-600">
                                This will immediately revoke access for all <strong className="text-slate-800">{suspendModalTenant.seats.split('/')[0]} users</strong> within this tenant.
                            </p>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 bg-white shadow-sm/50 flex justify-end gap-3">
                            <button onClick={() => setSuspendModalTenant(null)} className="px-5 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    try {
                                        const { apiFetch } = await import('@/utils/api');
                                        const res = await apiFetch(`/admin/tenants/${suspendModalTenant.id}/status`, {
                                            method: 'PATCH',
                                            body: JSON.stringify({ status: 'suspended' })
                                        });
                                        if (res.ok) {
                                            setSuspendModalTenant(null);
                                            await fetchTenants();
                                            // Refresh stats
                                            const statsRes = await apiFetch('/admin/dashboard');
                                            const statsJson = await statsRes.json();
                                            if (statsJson.success) setStats(statsJson.data);
                                        }
                                    } catch (err) {
                                        console.error('Failed to suspend tenant', err);
                                    }
                                }}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors shadow-[0_0_12px_rgba(220,38,38,0.3)]"
                            >
                                Confirm Suspension
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ SECTION: ADD STUDENT ══ */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Individual Student Enrollment</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Add a standalone student and assign courses directly.</p>
                    </div>
                    <button
                        onClick={() => { setShowAddStudent(!showAddStudent); setStudentFormError(null); }}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white text-xs font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(220,38,38,0.3)]"
                    >
                        <span>{showAddStudent ? '✕ Cancel' : '+ Add Student'}</span>
                    </button>
                </div>

                {showAddStudent && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700 flex items-center gap-3">
                            <span className="text-2xl">🎓</span>
                            <div>
                                <h4 className="font-bold text-white text-sm">New Individual Student</h4>
                                <p className="text-xs text-slate-300">All fields marked * are required</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            {studentFormError && (
                                <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg font-medium">⚠️ {studentFormError}</div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {[
                                    { label: 'Student Name *', key: 'name', type: 'text', placeholder: 'e.g. Rahul Sharma' },
                                    { label: 'Email ID *', key: 'email', type: 'email', placeholder: 'rahul@example.com' },
                                    { label: 'Phone / Contact *', key: 'phone', type: 'tel', placeholder: '+91 98765 43210' },
                                    { label: 'Login ID *', key: 'login_id', type: 'text', placeholder: 'e.g. rahul.sharma' },
                                    { label: 'Password *', key: 'password', type: 'password', placeholder: 'Min 6 characters' },
                                    { label: 'Assign Course ID', key: 'course_id', type: 'text', placeholder: 'Course UUID or leave blank' },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">{f.label}</label>
                                        <input
                                            type={f.type}
                                            value={(studentForm as any)[f.key]}
                                            onChange={e => setStudentForm({ ...studentForm, [f.key]: e.target.value })}
                                            placeholder={f.placeholder}
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:bg-white transition-all"
                                        />
                                    </div>
                                ))}
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">Course Title (display name)</label>
                                    <input
                                        type="text"
                                        value={studentForm.course_title}
                                        onChange={e => setStudentForm({ ...studentForm, course_title: e.target.value })}
                                        placeholder="e.g. Cybersecurity Fundamentals (optional)"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setShowAddStudent(false)} className="px-5 py-2.5 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors">Cancel</button>
                            <button
                                disabled={studentFormLoading}
                                onClick={async () => {
                                    setStudentFormError(null);
                                    const { name, email, phone, login_id, password, course_id } = studentForm;
                                    if (!name || !email || !login_id || !password) {
                                        setStudentFormError('Please fill in Student Name, Email, Login ID and Password.');
                                        return;
                                    }
                                    setStudentFormLoading(true);
                                    try {
                                        const { apiFetch } = await import('@/utils/api');
                                        const body: any = { name, email, phone, login_id, password };
                                        if (course_id.trim()) {
                                            body.assigned_courses = [course_id.trim()];
                                        }
                                        const res = await apiFetch('/admin/students', { method: 'POST', body: JSON.stringify(body) });
                                        const json = await res.json();
                                        if (json.success) {
                                            setShowAddStudent(false);
                                            setStudentForm({ name: '', email: '', phone: '', login_id: '', password: '', course_id: '', course_title: '' });
                                            await fetchStudents();
                                        } else {
                                            setStudentFormError(json.message || 'Failed to create student.');
                                        }
                                    } catch {
                                        setStudentFormError('Network error. Please try again.');
                                    } finally {
                                        setStudentFormLoading(false);
                                    }
                                }}
                                className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white text-sm font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(220,38,38,0.25)] disabled:opacity-50"
                            >
                                {studentFormLoading ? 'Enrolling...' : '🎓 Enroll Student'}
                            </button>
                        </div>
                    </div>
                )}
            </section>

            {/* ══ SECTION: STUDENT MANAGEMENT ══ */}
            <section>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Student Management</h3>
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">{studentsList.length} students</span>
                    </div>
                    <input
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        placeholder="Search students..."
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-400 w-44 transition-colors"
                    />
                </div>

                {studentsList.length === 0 ? (
                    <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center text-slate-400">
                        <p className="text-4xl mb-3">🎓</p>
                        <p className="text-sm font-medium text-slate-600">No individual students enrolled yet.</p>
                        <p className="text-xs mt-1">Click "Add Student" above to enroll your first student.</p>
                    </div>
                ) : (
                    <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                                    <th className="text-left px-5 py-3">Student Name</th>
                                    <th className="text-left px-5 py-3">Login ID</th>
                                    <th className="text-left px-5 py-3">Email</th>
                                    <th className="text-left px-5 py-3">Phone</th>
                                    <th className="text-left px-5 py-3">Courses</th>
                                    <th className="text-left px-5 py-3">Status</th>
                                    <th className="text-left px-5 py-3">Enrolled</th>
                                    <th className="text-left px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {studentsList
                                    .filter(s => !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.email?.toLowerCase().includes(studentSearch.toLowerCase()) || s.login_id?.toLowerCase().includes(studentSearch.toLowerCase()))
                                    .map((s: any) => {
                                        const courses = Array.isArray(s.assigned_courses) ? s.assigned_courses : [];
                                        const isStopped = s.service_status === 'stopped';
                                        return (
                                            <tr key={s.student_id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isStopped ? 'bg-red-100 text-red-500' : 'bg-gradient-to-br from-red-500 to-orange-400 text-white'}`}>
                                                            {s.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <span className="font-semibold text-slate-900">{s.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 font-mono text-slate-600">{s.login_id}</td>
                                                <td className="px-5 py-3.5 text-slate-600">{s.email}</td>
                                                <td className="px-5 py-3.5 text-slate-500">{s.phone || '—'}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-full text-[10px] font-bold">{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isStopped ? 'text-red-500 bg-red-50 border-red-200' : 'text-green-500 bg-green-50 border-green-200'}`}>
                                                        {isStopped ? '⛔ Stopped' : '🟢 Active'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-slate-400 text-[11px]">{new Date(s.created_at).toLocaleDateString()}</td>
                                                <td className="px-5 py-3.5">
                                                    <Link href={`/admin/students/${s.student_id}`}>
                                                        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold rounded-lg transition-colors shadow-sm">
                                                            👁 View
                                                        </button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </SuperAdminLayout>
    );
}
