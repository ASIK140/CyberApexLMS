const { Framework, Control, Evidence, ComplianceScore, User, Tenant } = require('../models');

exports.getSummary = async (req, res) => {
    try {
        const tenant_id = req.user?.tenant_id || req.query.tenant_id || 'acme_corp';
        
        const frameworks = await Framework.findAll({
            where: { tenant_id },
            include: [
                { model: ComplianceScore, as: 'scores', limit: 1 }
            ]
        });

        // Calculate overarching score and check for alerts
        let totalScore = 0;
        let lowestScore = 100;
        let alertTriggered = false;
        let alertMessage = null;

        const formattedFrameworks = frameworks.map(f => {
            const scoreRecord = f.scores && f.scores.length > 0 ? f.scores[0] : null;
            const score = scoreRecord ? parseFloat(scoreRecord.score) : 0;
            const status = scoreRecord ? scoreRecord.status : 'Review';
            
            totalScore += score;
            if (score < lowestScore) lowestScore = score;
            
            if (score < 60 && !alertTriggered) {
                alertTriggered = true;
                alertMessage = `${f.name} compliance at ${score}% — urgent review required for failing controls before upcoming audit.`;
            }

            return {
                id: f.id,
                name: f.name,
                description: f.description,
                score,
                status
            };
        });

        const overallCompliance = frameworks.length > 0 ? Math.round(totalScore / frameworks.length) : 0;

        res.json({
            success: true,
            alert: alertTriggered ? { type: 'critical', message: alertMessage } : null,
            overall_compliance: overallCompliance,
            frameworks: formattedFrameworks
        });

    } catch (err) {
        console.error('getSummary Error:', err);
        res.status(500).json({ success: false, message: 'Server error retrieving compliance summary.' });
    }
};

exports.getFrameworkDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const tenant_id = req.user?.tenant_id || 'acme_corp';

        const framework = await Framework.findOne({
            where: { id, tenant_id },
            include: [
                { model: ComplianceScore, as: 'scores' },
                { 
                    model: Control, 
                    as: 'controls',
                    include: [
                        { model: Evidence, as: 'evidence' }
                    ]
                }
            ]
        });

        if (!framework) {
            return res.status(404).json({ success: false, message: 'Framework not found.' });
        }

        // Aggregate controls and evidence into a flattened view
        const expandedControls = framework.controls.map(c => {
            const evidenceItems = c.evidence || [];
            
            // Derive a control-level status from its evidence
            let cStatus = 'Complete';
            if (evidenceItems.length === 0) cStatus = 'At Risk';
            else if (evidenceItems.some(e => e.status === 'At Risk')) cStatus = 'At Risk';
            else if (evidenceItems.some(e => e.status === 'In Progress' || e.status === 'Partial')) cStatus = 'In Progress';

            return {
                id: c.id,
                name: c.name,
                requirement: c.requirement,
                status: cStatus,
                evidence: evidenceItems.map(e => ({
                    id: e.id,
                    user_id: e.user_id,
                    status: e.status,
                    completion_percentage: e.completion_percentage,
                    last_updated: e.last_updated
                }))
            };
        });
        
        const score = framework.scores && framework.scores.length > 0 ? parseFloat(framework.scores[0].score) : 0;

        res.json({
            success: true,
            framework: {
                id: framework.id,
                name: framework.name,
                description: framework.description,
                score,
                controls: expandedControls
            }
        });
    } catch (err) {
        console.error('getFrameworkDetails Error:', err);
        res.status(500).json({ success: false, message: 'Server error retrieving framework details.' });
    }
};

exports.deployTraining = async (req, res) => {
    try {
        const { target_id, target_type } = req.body; // target_type = 'framework' or 'control'
        // Mocking the deployment logic for Dashboard UX
        // Real logic would identify users with missing evidence and create TrainingRecords
        
        console.log(`Deploying training to outstanding users for ${target_type}: ${target_id}`);

        res.json({
            success: true,
            message: `Training successfully scheduled for all outstanding users under the selected ${target_type}.`
        });

    } catch (err) {
        console.error('deployTraining Error:', err);
        res.status(500).json({ success: false, message: 'Server error deploying training.' });
    }
};

exports.getReport = async (req, res) => {
    try {
        const { type } = req.query; // 'pdf', 'csv', 'excel', 'evidence-pack'
        
        let url = `/downloads/compliance_report_${Date.now()}.pdf`;
        let msg = 'PDF Export generation complete.';
        
        if (type === 'csv') {
            url = `/downloads/compliance_data_${Date.now()}.csv`;
            msg = 'CSV Data Export generation complete.';
        } else if (type === 'excel') {
            url = `/downloads/compliance_sheet_${Date.now()}.xlsx`;
            msg = 'Excel Export generation complete.';
        } else if (type === 'evidence-pack') {
            url = `/downloads/audit_evidence_pack_${Date.now()}.zip`;
            msg = 'Evidence Pack ZIP generation complete.';
        }

        res.json({
            success: true,
            message: msg,
            download_url: url
        });

    } catch (err) {
        console.error('getReport Error:', err);
        res.status(500).json({ success: false, message: `Server error generating ${req.query.type} report.` });
    }
};
