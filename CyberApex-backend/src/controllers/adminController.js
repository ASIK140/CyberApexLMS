'use strict';

const { Tenant, User, Course, PhishingCampaign } = require('../models');

// GET /api/admin/dashboard
exports.getDashboard = async (req, res) => {
    try {
        const totalTenants = await Tenant.count();
        const activeTenants = await Tenant.count({ where: { status: 'active' } });
        const trialTenants = await Tenant.count({ where: { status: 'trial' } });
        const suspendedTenants = await Tenant.count({ where: { subscription_status: 'suspended' } });
        
        const totalRevenue = await Tenant.sum('monthly_revenue') || 0;
        const totalUsers = await User.count();
        const publishedCourses = await Course.count({ where: { status: 'published' } });
        const activeCampaigns = await PhishingCampaign.count({ where: { status: 'Running' } });

        res.json({
            success: true,
            data: {
                overview: {
                    total_tenants: totalTenants,
                    active_tenants: activeTenants,
                    trial_tenants: trialTenants,
                    suspended_tenants: suspendedTenants,
                    total_users: totalUsers,
                    active_users_30d: Math.floor(totalUsers * 0.8),
                    courses_published: publishedCourses,
                    active_campaigns: activeCampaigns,
                },
                revenue: {
                    mrr: totalRevenue,
                    arr: totalRevenue * 12,
                    mrr_growth_pct: 4.2,
                    new_revenue_mtd: totalRevenue * 0.1,
                    churn_revenue_mtd: 0,
                },
                risk: {
                    global_human_risk_score: 62,
                    critical_risk_tenants: suspendedTenants,
                    platforms_with_overdue_training_pct: 24,
                },
                system_status: {
                    status: 'operational',
                    uptime_pct: 99.98,
                    api_latency_ms: 42,
                    db_latency_ms: 8,
                    active_sessions: 3812,
                    queue_backlog: 0,
                }
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/admin/analytics
exports.getAnalytics = (req, res) => {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    res.json({
        success: true,
        data: {
            tenant_growth: months.map((m, i) => ({ month: m, tenants: 110 + i * 6 })),
            revenue_trend: months.map((m, i) => ({ month: m, mrr: 145000 + i * 8500 })),
            user_activity: months.map((m, i) => ({ month: m, active: 10000 + i * 900 })),
            top_tenants_by_revenue: [
                { name: 'Acme Corp', mrr: 4250, plan: 'Enterprise' },
                { name: 'MedGroup Ltd', mrr: 2340, plan: 'Professional' },
                { name: 'GlobalBank', mrr: 5100, plan: 'Enterprise' },
            ],
            top_industries: [
                { industry: 'Finance', tenants: 34, revenue: 62000 },
                { industry: 'Healthcare', tenants: 27, revenue: 49000 },
                { industry: 'Technology', tenants: 22, revenue: 38000 },
            ],
        },
    });
};
