require('dotenv').config();
const { sequelize } = require('../src/config/database');
const { BoardReport, BoardMetric, BoardRisk, BoardRecommendation, Tenant } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

async function seedBoardReport() {
    try {
        console.log('Connecting to database...');
        await sequelize.authenticate();
        
        // Sync models
        await sequelize.sync();
        console.log('Board models synchronized.');

        const tenantId = 'acme_corp';
        const [tenant] = await Tenant.findOrCreate({
            where: { tenant_id: tenantId },
            defaults: {
                tenant_id: tenantId,
                organization_name: 'Acme Corp',
                status: 'active'
            }
        });

        // Clear existing mock data for idempotency
        await BoardReport.destroy({ where: { tenant_id: tenantId } });

        console.log('Inserting historical metrics (Q3 2025, Q4 2025, Q1 2026)...');
        
        // Create the latest report object to anchor the metrics
        const report = await BoardReport.create({
            tenant_id: tenantId,
            quarter: 'Q1 2026',
            executive_summary: 'Cyber risk remains driven by human behavior. 14% of employees engaged with phishing simulations, and 23 submitted credentials. Training completion increased to 68%. However, DORA compliance remains critically low at 51%, posing regulatory risk.',
        });

        const reportId = report.id;

        // Metrics as per user prompt
        const metricsData = [
            { metric_name: 'Training Completion',   q3: '45%', q4: '55%', q1: '68%', target: '90%' },
            { metric_name: 'Phishing Click Rate',   q3: '22%', q4: '18%', q1: '14%', target: '5%' },
            { metric_name: 'Credential Submissions',q3: '50',  q4: '35',  q1: '23',  target: '0' },
            { metric_name: 'ISO 27001',             q3: '65%', q4: '70%', q1: '74%', target: '100%' },
            { metric_name: 'DORA',                  q3: '40%', q4: '45%', q1: '51%', target: '100%' },
            { metric_name: 'PCI-DSS',               q3: '85%', q4: '88%', q1: '92%', target: '100%' },
            { metric_name: 'Cyber Essentials',      q3: '90%', q4: '95%', q1: '98%', target: '100%' },
        ];

        for (const m of metricsData) {
            // we will store them as individual rows per quarter or just denormalize? 
            // The prompt says output table has columns: Metric | Q3 | Q4 | Q1 | Target
            // The model is: metric_name, value, target, quarter.
            // I'll create 3 records per metric for simplicity.
            
            await BoardMetric.bulkCreate([
                { report_id: reportId, tenant_id: tenantId, metric_name: m.metric_name, value: m.q3, target: m.target, quarter: 'Q3 2025' },
                { report_id: reportId, tenant_id: tenantId, metric_name: m.metric_name, value: m.q4, target: m.target, quarter: 'Q4 2025' },
                { report_id: reportId, tenant_id: tenantId, metric_name: m.metric_name, value: m.q1, target: m.target, quarter: 'Q1 2026' }
            ]);
        }

        console.log('Inserting risks...');
        await BoardRisk.bulkCreate([
            { report_id: reportId, tenant_id: tenantId, type: 'Critical', description: 'DORA Compliance Gap', severity: 'Critical' },
            { report_id: reportId, tenant_id: tenantId, type: 'Warning', description: 'Finance Department Risk', severity: 'Warning' },
            { report_id: reportId, tenant_id: tenantId, type: 'Positive Trend', description: 'Positive Improvement Trend', severity: 'Positive' },
        ]);

        console.log('Inserting recommendations...');
        await BoardRecommendation.bulkCreate([
            { report_id: reportId, tenant_id: tenantId, action: 'Deploy mandatory DORA training', owner: 'Compliance Team', timeline: 'Q2 2026' },
            { report_id: reportId, tenant_id: tenantId, action: 'Increase phishing simulations', owner: 'SecOps Team', timeline: 'Immediate' },
            { report_id: reportId, tenant_id: tenantId, action: 'HR escalation for high-risk users', owner: 'HR Dept', timeline: 'Q2 2026' },
            { report_id: reportId, tenant_id: tenantId, action: 'Schedule board briefing', owner: 'CISO / Board', timeline: 'May 2026' },
        ]);

        console.log('✅ Board Report successfully seeded!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
}

seedBoardReport();
