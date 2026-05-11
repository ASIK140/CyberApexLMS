const { sequelize } = require('../src/config/database');
const { User, Tenant, Framework, Control, Evidence, ComplianceScore, TrainingRecord, Course } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

async function seedCompliance() {
    try {
        await sequelize.authenticate();
        console.log('Syncing database to create new tables...');
        await sequelize.sync(); // Create tables if they don't exist
        
        let tenant = await Tenant.findOne();
        if (!tenant) {
            tenant = await Tenant.create({
                tenant_id: 'tenant_' + uuidv4().slice(0, 8),
                organization_name: 'Acme Corp',
                admin_email: 'ciso@acmecorp.com',
                plan_type: 'Enterprise',
            });
            console.log('Created mock tenant:', tenant.organization_name);
        }
        const tenantId = tenant.tenant_id;

        console.log(`Seeding compliance data for tenant: ${tenantId}`);

        // Clear old compliance data
        await ComplianceScore.destroy({ where: { tenant_id: tenantId } });
        await Framework.destroy({ where: { tenant_id: tenantId } });
        // Cascades should handle controls and evidence if setup correctly, but let's assume they don't to be safe:
        // Actually since we just destroyed frameworks, the models might leave orphaned controls, but that's fine for seeding.

        const frameworksData = [
            { name: 'ISO 27001', desc: 'Information Security Management System' },
            { name: 'DORA', desc: 'Digital Operational Resilience Act' },
            { name: 'PCI-DSS', desc: 'Payment Card Industry Data Security Standard' },
            { name: 'NIS2', desc: 'Network and Information Security Directive' },
            { name: 'SOC2', desc: 'Service Organization Control 2' },
            { name: 'GDPR', desc: 'General Data Protection Regulation' },
            { name: 'Cyber Essentials', desc: 'UK Government-backed, industry-supported scheme' }
        ];

        let users = await User.findAll({ where: { tenant_id: tenantId }, limit: 10 });
        if (users.length === 0) {
            // Create some mock users
            for (let i = 0; i < 5; i++) {
                const u = await User.create({
                    name: `Employee ${i}`,
                    email: `emp${i}@acmecorp.com`,
                    password: 'password123',
                    tenant_id: tenantId,
                    role: 'employee'
                });
                users.push(u);
            }
        }

        for (const fwData of frameworksData) {
            const fw = await Framework.create({
                tenant_id: tenantId,
                name: fwData.name,
                description: fwData.desc
            });
            
            let completedControls = 0;
            const numControls = 5 + Math.floor(Math.random() * 5); // 5 to 9 controls per framework
            
            for (let i = 0; i < numControls; i++) {
                const control = await Control.create({
                    framework_id: fw.id,
                    name: `${fwData.name} Control ${i+1}`,
                    requirement: `Ensure system complies with ${fwData.name} specific requirement ${i+1}`
                });
                
                // Random compliance generator
                const hasEvidence = Math.random() > 0.3; // 70% have some evidence
                let status = 'In Progress';
                let completion_percentage = 0;
                
                if (hasEvidence) {
                    const isComplete = Math.random() > 0.4;
                    if (isComplete) {
                        status = 'Complete';
                        completion_percentage = 100;
                        completedControls++;
                    } else {
                        status = 'Partial';
                        completion_percentage = Math.floor(Math.random() * 50) + 10;
                    }
                } else if (Math.random() > 0.8) {
                    status = 'At Risk';
                }

                // Specifically make DORA have a lower score to trigger the alert banner in testing
                if (fwData.name === 'DORA' && Math.random() > 0.2) {
                    status = 'In Progress';
                    completion_percentage = 0;
                    if(completedControls > 0) completedControls--; 
                }

                const randomUser = users[Math.floor(Math.random() * users.length)];
                
                await Evidence.create({
                    control_id: control.id,
                    user_id: randomUser.id,
                    status,
                    completion_percentage,
                });
            }
            
            let score = Math.round((completedControls / numControls) * 100);
            
            // Force DORA under 60 for the specific DORA alert logic
            if (fwData.name === 'DORA') {
                score = Math.min(score, 51);
            }

            let overallStatus = 'Urgent';
            if (score >= 80) overallStatus = 'Good';
            else if (score >= 60) overallStatus = 'On Track';
            else if (score >= 40) overallStatus = 'Review';
            
            await ComplianceScore.create({
                tenant_id: tenantId,
                framework_id: fw.id,
                score,
                status: overallStatus
            });
        }
        
        console.log('✅ Compliance data seeded successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding data:', err);
        process.exit(1);
    }
}

seedCompliance();
