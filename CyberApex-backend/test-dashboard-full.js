
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Tenant, User, Course, PhishingCampaign, Escalation } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function testFull() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');
        
        console.log('1. Total Tenants');
        await Tenant.count();

        console.log('2. Active Tenants');
        await Tenant.count({ where: { status: 'active' } });

        console.log('3. Trial Tenants');
        await Tenant.count({ where: { status: 'trial' } });

        console.log('4. Suspended/Inactive Tenants');
        // This is a potential crash point
        await Tenant.count({ where: { status: ['suspended', 'inactive'] } });

        console.log('5. Total Revenue');
        await Tenant.sum('monthly_revenue');

        console.log('6. Total Users');
        await User.count();

        console.log('7. Published Courses');
        await Course.count({ where: { status: 'published' } });

        console.log('8. Active Campaigns');
        await PhishingCampaign.count({ where: { status: 'running' } });

        console.log('9. Pending Escalations');
        await Escalation.count({ where: { status: 'open' } });

        console.log('10. Critical Escalations');
        await Escalation.count({ where: { status: 'open', severity: 'critical' } });

        console.log('SUCCESS: All methods verified.');
    } catch (err) {
        console.error('CRASH IN METHOD:', err);
    } finally {
        await sequelize.close();
    }
}

testFull();
