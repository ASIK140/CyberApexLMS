
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Tenant, User, Course, PhishingCampaign, Escalation } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function testDashboard() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');
        
        console.log('Counting tenants...');
        const totalTenants = await Tenant.count();
        console.log('Total tenants:', totalTenants);

        console.log('Summing revenue...');
        const totalRevenue = await Tenant.sum('monthly_revenue') || 0;
        console.log('Total revenue:', totalRevenue);

        console.log('Counting escalations...');
        const pendingEscalations = await Escalation.count({ where: { status: 'open' } });
        console.log('Pending escalations:', pendingEscalations);

        console.log('SUCCESS: All queries completed.');
    } catch (err) {
        console.error('CRASH DETECTED:', err);
    } finally {
        await sequelize.close();
    }
}

testDashboard();
