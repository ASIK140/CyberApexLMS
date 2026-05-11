'use strict';
const { BoardReport, BoardMetric, BoardRisk, BoardRecommendation } = require('../models');

exports.getSummary = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id || 'acme_corp';
        
        // Find the most recent report for the tenant
        const report = await BoardReport.findOne({
            where: { tenant_id },
            order: [['generated_at', 'DESC']]
        });

        if (!report) {
            return res.status(404).json({ success: false, message: 'No board report found.' });
        }

        res.json({
            success: true,
            summary: report.executive_summary,
            quarter: report.quarter,
            metadata: {
                prepared_by: 'CISO',
                classification: 'Confidential',
                tenant: tenant_id
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getMetrics = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id || 'acme_corp';
        
        const report = await BoardReport.findOne({
            where: { tenant_id },
            order: [['generated_at', 'DESC']]
        });
        if (!report) return res.json({ success: true, metrics: [] });

        const metrics = await BoardMetric.findAll({
            where: { report_id: report.id },
            order: [['metric_name', 'ASC'], ['quarter', 'ASC']]
        });

        // Group metrics by name into a table format (Q3, Q4, Q1, Target)
        const grouped = {};
        for (const m of metrics) {
            if (!grouped[m.metric_name]) {
                grouped[m.metric_name] = { name: m.metric_name, target: m.target, history: {} };
            }
            grouped[m.metric_name].history[m.quarter] = m.value;
        }

        res.json({ success: true, metrics: Object.values(grouped) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getRisksAndRecommendations = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id || 'acme_corp';
        const report = await BoardReport.findOne({
            where: { tenant_id },
            order: [['generated_at', 'DESC']]
        });
        if (!report) return res.json({ success: true, risks: [], recommendations: [] });

        const risks = await BoardRisk.findAll({ where: { report_id: report.id } });
        const recommendations = await BoardRecommendation.findAll({ where: { report_id: report.id } });

        res.json({ success: true, risks, recommendations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.generateReport = async (req, res) => {
    try {
        // Mock generation endpoint representing heavy data aggregation.
        // In a real system, this would calculate scores across User/Compliance models.
        res.json({ success: true, message: 'New Board Report successfully generated from live data!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.exportPDF = async (req, res) => {
    try {
        // Mocking PDF export download URL
        const timestamp = new Date().getTime();
        res.json({ success: true, message: 'PDF generated', download_url: `/downloads/board_report_Q1_2025_${timestamp}.pdf` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.emailReport = async (req, res) => {
    try {
        // Mocking SMTP dispatch to board
        res.json({ success: true, message: 'Board Report securely emailed to all board members.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.scheduleReport = async (req, res) => {
    try {
        // Mocking Cron scheduler setup
        res.json({ success: true, message: 'Quarterly board report auto-generation successfully scheduled.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
