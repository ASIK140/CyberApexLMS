require('dotenv').config();
const { sequelize } = require('../src/config/database');
const { PhishingCampaign, CampaignTarget, PhishingEvent, User, Tenant } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

async function seedPhishing() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        await PhishingCampaign.sync({ force: true });
        await CampaignTarget.sync({ force: true });
        await PhishingEvent.sync({ force: true });
        await sequelize.sync();
        
        const tenantId = 'acme_corp';
        const [tenant] = await Tenant.findOrCreate({
            where: { tenant_id: tenantId },
            defaults: { tenant_id: tenantId, organization_name: 'Acme Corp', status: 'active' }
        });

        console.log('Clearing old mock phishing data for Acme Corp...');
        await PhishingCampaign.destroy({ where: { tenant_id: tenantId } });

        console.log('Generating dummy users for Acme Corp...');
        const userIds = [];
        const departments = ['Finance', 'Sales', 'Operations', 'Marketing', 'HR', 'Legal', 'IT'];
        
        // Ensure at least 340 users to match the prompt example exactly.
        for (let i = 0; i < 340; i++) {
            const uid = uuidv4();
            userIds.push({
                user_id: uid,
                tenant_id: tenantId,
                first_name: 'Employee',
                last_name: String(i),
                email: `emp${i}@acme.corp`,
                role: 'employee',
                department: departments[i % departments.length],
                department_id: departments[i % departments.length].toLowerCase(),
                status: 'active'
            });
        }
        await User.bulkCreate(userIds, { ignoreDuplicates: true });

        console.log('Creating Q1 All-Staff Baseline Campaign...');
        const campaign = await PhishingCampaign.create({
            tenant_id: tenantId,
            name: 'Q1 All-Staff Baseline',
            type: 'Email',
            template_id: 'password_reset_001',
            status: 'Complete',
            emails_sent: 340,
            emails_clicked: 48,
            credentials_submitted: 23,
            reported_count: 106,
            started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        });

        const cId = campaign.campaign_id;

        console.log('Linking 340 targets...');
        const targets = userIds.map(u => ({ campaign_id: cId, user_id: u.user_id }));
        await CampaignTarget.bulkCreate(targets);

        console.log('Generating granular telemetry events...');
        // To match the prompt: Sent: 340, Clicked: 48, Creds: 23, Reported: 106
        // Everyone gets 'sent' and 'delivered'
        const events = [];
        
        // 1. Sent & Delivered for all 340
        targets.forEach(t => {
            events.push({ campaign_id: cId, user_id: t.user_id, event_type: 'sent', timestamp: new Date(campaign.started_at) });
            events.push({ campaign_id: cId, user_id: t.user_id, event_type: 'delivered', timestamp: new Date(campaign.started_at.getTime() + 5000) });
            events.push({ campaign_id: cId, user_id: t.user_id, event_type: 'opened', timestamp: new Date(campaign.started_at.getTime() + 60000) }); // Assume 100% open for simplicity or 300
        });

        // 2. Clicked: 48 users
        for (let i = 0; i < 48; i++) {
            events.push({ campaign_id: cId, user_id: userIds[i].user_id, event_type: 'clicked', timestamp: new Date(campaign.started_at.getTime() + 120000) });
        }

        // 3. Credentials Submissions: 23 users (must be subset of clicked)
        for (let i = 0; i < 23; i++) {
            events.push({ campaign_id: cId, user_id: userIds[i].user_id, event_type: 'submitted', timestamp: new Date(campaign.started_at.getTime() + 180000) });
        }

        // 4. Reported: 106 users (can be independent, let's use the last 106 users)
        for (let i = 339; i > 233; i--) {
            events.push({ campaign_id: cId, user_id: userIds[i].user_id, event_type: 'reported', timestamp: new Date(campaign.started_at.getTime() + 90000) });
        }

        await PhishingEvent.bulkCreate(events);

        console.log(`✅ Phishing module correctly seeded with ${events.length} telemetry funnels!`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedPhishing();
