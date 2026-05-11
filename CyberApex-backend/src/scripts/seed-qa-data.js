'use strict';
require('dotenv').config();
const { connectDB } = require('../config/database');
const models = require('../models');
const { User, Tenant, Course, IndustryPack, PhishingCampaign, AuditLog, EmailLog, Notification, Escalation } = models;

async function seedQA() {
    console.log('🚀 Starting Precision QA Data Seeding...');

    try {
        // 1. Initialize and Sync Database
        const sequelize = await connectDB();
        console.log('🧨 Initializing clean database state...');
        await sequelize.sync({ force: true }); 
        console.log('✅ Database schema synchronized.');

        // 2. Tenants (Exactly 12)
        const industries = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Logistics', 'Education', 'Energy', 'CyberSecurity'];
        const tenantNames = [
            'Acme Corp', 'TechStart', 'HealthCo', 'RetailMax', 'Global Finance', 
            'EduSoft', 'BioTech', 'GreenEnergy', 'AlphaSys', 'OmniRetail', 
            'SkyLogistics', 'PrimeHealth'
        ];

        const tenants = [];
        for (const name of tenantNames) {
            const t = await Tenant.create({
                tenant_id: name.toLowerCase().replace(/\s+/g, '_'),
                organization_name: name,
                industry: industries[Math.floor(Math.random() * industries.length)],
                admin_email: `admin@${name.toLowerCase().replace(/\s+/g, '')}.com`,
                plan_type: ['Starter', 'Professional', 'Enterprise'][Math.floor(Math.random() * 3)],
                user_limit: 100,
                subscription_status: 'active',
                status: 'active',
                seat_count: Math.floor(Math.random() * 40) + 10,
                monthly_revenue: Math.floor(Math.random() * 5000)
            });
            tenants.push(t);
        }
        console.log(`✅ Seeded ${tenants.length} Tenants.`);

        // 3. Users (Exactly 340)
        let userCount = 0;
        const totalTargetUsers = 340;
        const usersPerTenant = Math.floor(totalTargetUsers / tenants.length);
        const remainder = totalTargetUsers % tenants.length;

        for (let tIdx = 0; tIdx < tenants.length; tIdx++) {
            const countForThisTenant = usersPerTenant + (tIdx < remainder ? 1 : 0);
            for (let i = 0; i < countForThisTenant; i++) {
                await User.create({
                    name: `User ${userCount}`,
                    email: `user${userCount}@${tenants[tIdx].tenant_id}.com`,
                    password: 'password123',
                    role: 'employee',
                    tenant_id: tenants[tIdx].tenant_id,
                    status: 'active'
                });
                userCount++;
            }
        }
        console.log(`✅ Seeded ${userCount} Users.`);

        // 4. Legacy Roles Deprecated: NGO Admin, Manager, Content Creator removed
        console.log(`ℹ️  Legacy role seeding skipped (NGO Admin, Manager, Content Creator deprecated).`);

        // 5. Courses (Exactly 47)
        const courseCategories = ['Phishing', 'Compliance', 'GDPR', 'SOC2', 'ISO 27001', 'Cloud Security'];
        for (let i = 1; i <= 47; i++) {
            await Course.create({
                title: `Course ${i}: Deep Dive into ${courseCategories[i % courseCategories.length]}`,
                description: `Comprehensive training for ${courseCategories[i % courseCategories.length]}.`,
                category: courseCategories[i % courseCategories.length],
                framework_tags: [courseCategories[i % courseCategories.length]],
                status: 'published',
                created_by: 'Super Admin'
            });
        }
        console.log(`✅ Seeded 47 Courses.`);

        // 6. Industry Packs (Exactly 5)
        const packs = ['Financial Defense', 'HealthCare Guard', 'Retail Safe', 'Tech Hardening', 'Logistics Shield'];
        for (const packName of packs) {
            await IndustryPack.create({
                pack_name: packName,
                industry: industries[Math.floor(Math.random() * industries.length)],
                description: `Standard pack for ${packName} compliance.`,
                status: 'active'
            });
        }
        console.log(`✅ Seeded 5 Industry Packs.`);

        // 7. Phishing Campaigns (Exactly 8)
        for (let i = 1; i <= 8; i++) {
            await PhishingCampaign.create({
                tenant_id: tenants[i % tenants.length].tenant_id,
                name: `Campaign ${i}: Executive Phishing`,
                template_type: 'Urgent Password Reset',
                status: 'running',
                emails_sent: 100,
                emails_clicked: 5
            });
        }
        console.log(`✅ Seeded 8 Phishing Campaigns.`);

        // 8. Escalations (Exactly 5 aligned with project themes)
        const escalationData = [
            { tenant_id: 'global_finance', severity: 'critical', issue_type: 'API Failure', description: 'Critical API authentication failure causing employee lockout' },
            { tenant_id: 'techstart', severity: 'high', issue_type: 'Phishing Mislabel', description: 'Bulk phishing campaign mislabeled as production send' },
            { tenant_id: 'acme_corp', severity: 'high', issue_type: 'SSO Break', description: 'SSO integration broken after tenant reconfiguration' },
            { tenant_id: 'primehealth', severity: 'medium', issue_type: 'Compliance Export', description: 'Compliance report generation fails for Q4 export' },
            { tenant_id: 'skylogistics', severity: 'medium', issue_type: 'Deliverability', description: 'Email deliverability dropped below 90% threshold' },
        ];

        for (const data of escalationData) {
            await Escalation.create({
                ...data,
                status: 'open'
            });
        }
        console.log(`✅ Seeded ${escalationData.length} Escalations.`);

        // 9. Platform Health Data (Initial Audit/Email logs)
        await EmailLog.create({ tenant_id: 'acme_corp', recipient: 'test@acme.com', subject: 'Security Alert', status: 'delivered', type: 'alert' });
        await AuditLog.create({ action_type: 'QA_SYSTEM_SEED_COMPLETED', actor_role: 'super_admin', result: 'success' });

        console.log('\n✨ Seeding Complete. Exact counts for QA:');
        console.log('   - Tenants: 12');
        console.log('   - Users: 340');
        console.log('   - Legacy Roles (NGO Admin, Manager, Content Creator): 0 (Deprecated)');
        console.log('   - Courses: 47');
        console.log('   - Packs: 5');
        console.log('   - Campaigns: 8');
        console.log('   - Escalations: 5');

    } catch (err) {
        console.error('❌ Seeding Failed:', err);
    } finally {
        process.exit(0);
    }
}

seedQA();
