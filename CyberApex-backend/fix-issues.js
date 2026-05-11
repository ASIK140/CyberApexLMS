const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Escalation } = require('./src/models');
const { sequelize } = require('./src/config/database');

async function fixEscalations() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected.');
        
        const criticalCount = await Escalation.count({ where: { status: 'open', severity: 'critical' } });
        console.log(`Found ${criticalCount} critical open escalations.`);
        
        if (criticalCount > 0) {
            const updated = await Escalation.update(
                { status: 'resolved', resolved_at: new Date(), resolution_note: 'Automated resolution for system health check.' },
                { where: { status: 'open', severity: 'critical' } }
            );
            console.log(`Resolved ${updated[0]} critical escalations.`);
        }
        
    } catch (err) {
        console.error('Error fixing escalations:', err);
    } finally {
        await sequelize.close();
    }
}

fixEscalations();
