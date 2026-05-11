
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Escalation, Notification } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function checkData() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');
        
        const allEsc = await Escalation.findAll();
        console.log(`Total Escalations: ${allEsc.length}`);
        allEsc.forEach(e => {
            console.log(`- ID: ${e.escalation_id}, Severity: ${e.severity}, Status: ${e.status}`);
        });
        
        const allNotif = await Notification.findAll();
        console.log(`Total Notifications: ${allNotif.length}`);
        allNotif.forEach(n => {
            console.log(`- ID: ${n.notification_id}, Severity: ${n.severity}, Read: ${n.read}`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await sequelize.close();
    }
}

checkData();
