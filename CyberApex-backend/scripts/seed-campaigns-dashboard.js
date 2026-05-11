require('dotenv').config();
const { sequelize } = require('../src/config/database');
const { PhishingCampaign, CampaignTarget, PhishingEvent, User, Tenant } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

async function seedCampaignsDashboard() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        await sequelize.sync();
        
        const tenantId = 'acme_corp';

        console.log('Clearing old mock phishing data for Acme Corp...');
        await PhishingCampaign.destroy({ where: { tenant_id: tenantId } });

        console.log('Creating specific Dashboard Campaigns...');
        
        // 1. All Staff Baseline
        // 340 sent, 14% click (48), 6.8% cred (23), 9% report (31)
        await PhishingCampaign.create({
            tenant_id: tenantId,
            name: 'All Staff Baseline',
            type: 'Email',
            template_id: 'password_reset_001',
            status: 'Complete',
            emails_sent: 340,
            emails_clicked: 48, // 14%
            credentials_submitted: 23, // 6.8%
            reported_count: 31, // 9%
            audience: 'All Staff',
            started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        });

        // 2. Finance BEC Attack
        // 62 sent, 22% click (14), 12% cred (7), 5% report (3)
        await PhishingCampaign.create({
            tenant_id: tenantId,
            name: 'Finance BEC Attack',
            type: 'Email',
            template_id: 'invoice_fraud',
            status: 'Complete',
            emails_sent: 62,
            emails_clicked: 14,
            credentials_submitted: 7,
            reported_count: 3,
            audience: 'Finance Dept',
            started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        });

        // 3. Exec Spear Phishing
        // 12 sent, 8% click (1), 0% cred (0), 42% report (5)
        await PhishingCampaign.create({
            tenant_id: tenantId,
            name: 'Exec Spear Phishing',
            type: 'Email',
            template_id: 'ceo_fraud',
            status: 'Complete',
            emails_sent: 12,
            emails_clicked: 1,
            credentials_submitted: 0,
            reported_count: 5,
            audience: 'Executives',
            started_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
        });

        // 4. Q2 Phishing Wave
        // 125 sent, Running
        await PhishingCampaign.create({
            tenant_id: tenantId,
            name: 'Q2 Phishing Wave',
            type: 'Email',
            template_id: 'qr_scam',
            status: 'Running',
            emails_sent: 125,
            emails_clicked: 0,
            credentials_submitted: 0,
            reported_count: 0,
            audience: 'Sales + HR',
            started_at: new Date()
        });

        // 5. GDPR Awareness Test
        // Scheduled
        await PhishingCampaign.create({
            tenant_id: tenantId,
            name: 'GDPR Awareness Test',
            type: 'Email',
            template_id: 'password_reset',
            status: 'Scheduled',
            emails_sent: 0,
            emails_clicked: 0,
            credentials_submitted: 0,
            reported_count: 0,
            audience: 'All Staff',
            scheduled_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });

        console.log(`✅ Phishing Dashboard campaigns correctly injected!`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedCampaignsDashboard();
