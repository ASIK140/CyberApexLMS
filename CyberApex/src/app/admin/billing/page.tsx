'use client';
import React, { useState, useEffect } from 'react';
import SuperAdminLayout from '@/components/layout/SuperAdminLayout';

export default function BillingRevenuePage() {
    const [billingStats, setBillingStats] = useState<any>(null);
    const [tenants, setTenants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [planFilter, setPlanFilter] = useState('All');
    const [sortBy, setSortBy] = useState<'revenue' | 'renewal' | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const fetchData = async () => {
        setLoading(true);
        try {
            const { apiFetch } = await import('@/utils/api');
            const [statsRes, revenueRes] = await Promise.all([
                apiFetch('/admin/billing'),
                apiFetch('/admin/billing/revenue')
            ]);
            const statsJson = await statsRes.json();
            const revenueJson = await revenueRes.json();

            if (statsJson.success && revenueJson.success) {
                setBillingStats(revenueJson.data);
                setTenants(statsJson.data);
            } else {
                setError('Failed to fetch billing data');
            }
        } catch (err) {
            setError('Network error connecting to API');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return (
        <SuperAdminLayout title="Billing & Revenue">
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span className="ml-3 text-slate-600">Loading financial data...</span>
            </div>
        </SuperAdminLayout>
    );

    if (error) return (
        <SuperAdminLayout title="Billing & Revenue">
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
                <p className="font-bold">Error</p>
                <p className="text-sm">{error}</p>
                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Retry</button>
            </div>
        </SuperAdminLayout>
    );

    // Dummy Billing Data
    // Filter Logic
    const filteredTenants = (tenants || []).filter(t => {
        const matchesSearch = (t.tenant_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPlan = planFilter === 'All' || t.plan_type === planFilter;
        return matchesSearch && matchesPlan;
    }).sort((a, b) => {
        if (sortBy === 'revenue') return (b.monthly_revenue || 0) - (a.monthly_revenue || 0);
        if (sortBy === 'renewal') {
            return new Date(a.renewal_date).getTime() - new Date(b.renewal_date).getTime();
        }
        return 0;
    });

    const statusBadge = (s: string) => ({
        'Paid': 'text-green-400 bg-green-400/10 border-green-500/20',
        'Overdue': 'text-red-400 bg-red-400/10 border-red-500/20',
        'Due Soon': 'text-orange-400 bg-orange-400/10 border-orange-500/20',
    }[s] || 'text-slate-600 bg-slate-100');

    const planBadge = (p: string) => ({
        'Enterprise': 'text-purple-400 border-purple-500/30',
        'Pro': 'text-blue-400 border-blue-500/30',
        'Starter': 'text-slate-700 border-neutral-600',
    }[p] || 'text-slate-600 border-slate-300');

    // UI Hooks for backend actions
    const generateInvoice = (id: string) => console.log('generate_invoice', id);
    const sendPaymentReminder = (id: string) => console.log('send_reminder', id);
    const markInvoicePaid = (id: string) => console.log('mark_paid', id);

    return (
        <SuperAdminLayout title="Billing & Revenue">
            <div className="flex flex-col gap-6">

                {/* Subtitle / Header Section */}
                <div>
                    <p className="text-slate-600 text-sm">Platform revenue analytics and tenant billing management.</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: MRR */}
                    <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">MRR (Monthly Recurring Revenue)</h3>
                        <p className="text-3xl font-bold text-slate-900 mb-2">${(billingStats?.mrr || 0).toLocaleString()}</p>
                        <p className="text-xs font-medium text-green-400">↑ 9.1% MoM</p>
                    </div>

                    {/* Card 2: ARR */}
                    <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">ARR (Annual Recurring Revenue)</h3>
                        <p className="text-3xl font-bold text-slate-900 mb-2">${(billingStats?.arr || 0).toLocaleString()}</p>
                        <p className="text-xs font-medium text-blue-400">↑ $42k YoY</p>
                    </div>

                    {/* Card 3: Renewals Due */}
                    <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">Renewals Due (Next 30 Days)</h3>
                        <p className="text-3xl font-bold text-slate-900 mb-2">{billingStats?.renewals_30d || 0}</p>
                        <p className="text-xs font-medium text-orange-400">Active tracking</p>
                    </div>

                    {/* Card 4: Average Seat Cost */}
                    <div className="bg-white shadow-sm border border-slate-200 rounded-xl p-5 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
                        <h3 className="text-sm font-semibold text-slate-600 mb-2">Average Seat Cost</h3>
                        <p className="text-3xl font-bold text-slate-900 mb-2">${(billingStats?.avg_seat_cost || 0).toFixed(2)}</p>
                        <p className="text-xs font-medium text-slate-500">Per user / month</p>
                    </div>
                </div>

                {/* Tenant Billing Controls */}
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center mt-2">
                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search tenants..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2.5 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-neutral-600 transition-colors"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            value={planFilter}
                            onChange={(e) => {
                                setPlanFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2.5 bg-white shadow-sm border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-neutral-600 cursor-pointer appearance-none outline-none"
                        >
                            <option value="All">All Plans</option>
                            <option value="Enterprise">Enterprise</option>
                            <option value="Pro">Pro</option>
                            <option value="Starter">Starter</option>
                        </select>

                        {/* Sort Dropdown */}
                        <div className="flex bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => {
                                    setSortBy(sortBy === 'revenue' ? null : 'revenue');
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2.5 text-sm transition-colors border-r border-slate-200 ${sortBy === 'revenue' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-100'}`}
                            >
                                Revenue
                            </button>
                            <button
                                onClick={() => {
                                    setSortBy(sortBy === 'renewal' ? null : 'renewal');
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2.5 text-sm transition-colors ${sortBy === 'renewal' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-100'}`}
                            >
                                Renewal Date
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tenant Billing Data Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50/50 border-b border-slate-200">
                                <tr className="text-slate-600 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">Tenant Name</th>
                                    <th className="px-6 py-4 font-semibold">Subscription Plan</th>
                                    <th className="px-6 py-4 font-semibold">MRR</th>
                                    <th className="px-6 py-4 font-semibold">Seats</th>
                                    <th className="px-6 py-4 font-semibold">Renewal Date</th>
                                    <th className="px-6 py-4 font-semibold">Payment Status</th>
                                    <th className="px-6 py-4 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-800">
                                {(() => {
                                    const totalPages = Math.ceil(filteredTenants.length / ITEMS_PER_PAGE);
                                    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
                                    const paginatedTenants = filteredTenants.slice(startIdx, startIdx + ITEMS_PER_PAGE);

                                    return (
                                        <>
                                            {paginatedTenants.map((t: any) => (
                                                <tr key={t.subscription_id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-900">{t.tenant_name}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border bg-slate-50 ${planBadge(t.plan_type)}`}>
                                                            {t.plan_type}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-semibold text-slate-900">${(t.monthly_revenue || 0).toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-slate-700">{t.seat_count}</td>
                                                    <td className="px-6 py-4 text-slate-700">{t.renewal_date}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${statusBadge(t.status === 'active' ? 'Paid' : t.status === 'suspended' ? 'Overdue' : 'Due Soon')}`}>
                                                            {t.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {t.status === 'Paid' && (
                                                            <button onClick={() => generateInvoice(t.id)} className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors">
                                                                Invoice
                                                            </button>
                                                        )}
                                                        {t.status === 'Due Soon' && (
                                                            <button onClick={() => sendPaymentReminder(t.id)} className="px-4 py-1.5 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 rounded-lg transition-colors">
                                                                Remind
                                                            </button>
                                                        )}
                                                        {t.status === 'Overdue' && (
                                                            <button onClick={() => sendPaymentReminder(t.id)} className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-[0_0_10px_rgba(220,38,38,0.3)]">
                                                                Chase
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredTenants.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                                        No tenants found matching your filters.
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })()}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-white shadow-sm/50">
                        <span>
                            Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredTenants.length)} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredTenants.length)} of {filteredTenants.length} tenants
                        </span>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1.5 rounded bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors ${currentPage === 1 ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                Prev
                            </button>
                            {Array.from({ length: Math.ceil(filteredTenants.length / ITEMS_PER_PAGE) }).map((_, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`px-3 py-1.5 rounded font-medium transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:text-white'}`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                            <button 
                                onClick={() => setCurrentPage(Math.min(Math.ceil(filteredTenants.length / ITEMS_PER_PAGE), currentPage + 1))}
                                disabled={currentPage >= Math.ceil(filteredTenants.length / ITEMS_PER_PAGE)}
                                className={`px-3 py-1.5 rounded bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors ${currentPage >= Math.ceil(filteredTenants.length / ITEMS_PER_PAGE) ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </SuperAdminLayout>
    );
}
