'use strict';
const { PhishingCampaign, CampaignTarget, PhishingEvent, User } = require('../models');
const { Op } = require('sequelize');

exports.listCampaigns = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id || 'acme_corp';
        const campaigns = await PhishingCampaign.findAll({
            where: { tenant_id },
            order: [['created_at', 'DESC']]
        });

        // Compute KPIs
        let totalSent = 0, totalClicked = 0, totalCreds = 0, totalReported = 0;
        campaigns.forEach(c => {
            totalSent += (c.emails_sent || 0);
            totalClicked += (c.emails_clicked || 0);
            totalCreds += (c.credentials_submitted || 0);
            totalReported += (c.reported_count || 0);
        });

        const kpis = {
            totalCampaigns: campaigns.length,
            clickRate: totalSent ? Math.round((totalClicked / totalSent) * 100) + '%' : '0%',
            credRate: totalSent ? Math.round((totalCreds / totalSent) * 100) + '%' : '0%',
            reportRate: totalSent ? Math.round((totalReported / totalSent) * 100) + '%' : '0%'
        };

        res.json({ success: true, kpis, data: campaigns });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createCampaign = async (req, res) => {
    try {
        const tenant_id = req.user.tenant_id || 'acme_corp';
        const { name, type, template_id, audience, schedule } = req.body;

        const campaign = await PhishingCampaign.create({
            tenant_id,
            name,
            type: type || 'Email',
            template_id,
            status: schedule === 'immediate' ? 'Running' : 'Scheduled',
            scheduled_at: schedule === 'immediate' ? new Date() : new Date(schedule)
        });

        let targetWhere = { tenant_id, status: 'active' };
        if (audience !== 'all' && audience !== 'All staff') {
            targetWhere.department = audience; 
        }

        const users = await User.findAll({ where: targetWhere, attributes: ['user_id'] });
        const targets = users.map(u => ({ campaign_id: campaign.campaign_id, user_id: u.user_id }));
        
        await CampaignTarget.bulkCreate(targets);

        res.status(201).json({ success: true, message: 'Campaign created successfully.', data: campaign });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.sendCampaign = async (req, res) => {
    try {
        // Mocks the orchestration of actually dispatching emails.
        const campaign = await PhishingCampaign.findByPk(req.body.campaign_id);
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

        await campaign.update({ status: 'Running', started_at: new Date() });
        res.json({ success: true, message: 'Campaign launch sequence initiated.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getCampaignResults = async (req, res) => {
    try {
        const campaign = await PhishingCampaign.findByPk(req.params.id);
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
        res.json({ success: true, data: campaign });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getFunnel = async (req, res) => {
    try {
        const campaign_id = req.params.id;
        
        // Count distinct users per event stage
        const eventCounts = await PhishingEvent.findAll({
            where: { campaign_id },
            attributes: ['event_type', [PhishingEvent.sequelize.fn('COUNT', PhishingEvent.sequelize.col('id')), 'count']],
            group: ['event_type']
        });

        const countsMap = { sent: 0, delivered: 0, opened: 0, clicked: 0, submitted: 0, reported: 0 };
        eventCounts.forEach(e => {
            countsMap[e.dataValues.event_type] = parseInt(e.dataValues.count, 10);
        });

        const funnel = [
            { stage: 'Sent', count: countsMap.sent },
            { stage: 'Delivered', count: countsMap.delivered },
            { stage: 'Opened', count: countsMap.opened },
            { stage: 'Clicked', count: countsMap.clicked },
            { stage: 'Credentials Submitted', count: countsMap.submitted },
            { stage: 'Reported', count: countsMap.reported }
        ];

        res.json({ success: true, funnel });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getDepartmentAnalytics = async (req, res) => {
    try {
        const campaign_id = req.params.id;
        
        // Join PhishingEvent with User to group by Department
        const events = await PhishingEvent.findAll({
            where: { campaign_id },
            include: [{ model: User, as: 'user', attributes: ['department'] }] // User model needs association? 
        });

        // Let's do it manually if User association on PhishingEvent is tricky to setup inline.
        // Let's fetch campaign users first
        const targets = await CampaignTarget.findAll({ where: { campaign_id }, raw: true });
        const userIds = targets.map(t => t.user_id);
        
        if (!userIds.length) return res.json({ success: true, departments: [] });

        const users = await User.findAll({ where: { user_id: { [Op.in]: userIds } }, raw: true });
        const userDeptMap = {};
        users.forEach(u => userDeptMap[u.user_id] = u.department || 'Unknown');

        const allEvents = await PhishingEvent.findAll({ where: { campaign_id }, raw: true });

        const deptMap = {};
        allEvents.forEach(e => {
            const dept = userDeptMap[e.user_id] || 'Unknown';
            if (!deptMap[dept]) deptMap[dept] = { sent: 0, clicked: 0, creds: 0 };
            if (e.event_type === 'sent') deptMap[dept].sent++;
            if (e.event_type === 'clicked') deptMap[dept].clicked++;
            if (e.event_type === 'submitted') deptMap[dept].creds++;
        });

        const departments = Object.keys(deptMap).map(d => {
            const m = deptMap[d];
            const clickRatio = m.sent ? m.clicked / m.sent : 0;
            const credRatio = m.sent ? m.creds / m.sent : 0;
            
            let riskLevel = 'Low Risk';
            if (credRatio > 0.05) riskLevel = 'Critical Risk';
            else if (clickRatio > 0.15) riskLevel = 'High Risk';

            return {
                name: d,
                sent: m.sent,
                clicked: m.clicked,
                clickRate: m.sent ? Math.round(clickRatio * 100) + '%' : '0%',
                credRate: m.sent ? Math.round(credRatio * 100) + '%' : '0%',
                riskLevel
            };
        });

        res.json({ success: true, departments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.exportCsv = async (req, res) => {
    try {
        const campaign = await PhishingCampaign.findByPk(req.params.id);
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

        const header = "Department,Sent,Clicked,Creds Submitted\n";
        const content = `All Staff,${campaign.emails_sent},${campaign.emails_clicked},${campaign.credentials_submitted}\n`;
        
        res.header('Content-Type', 'text/csv');
        res.attachment(`Campaign_${campaign.campaign_id}_Export.csv`);
        res.send(header + content);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.exportPdf = async (req, res) => {
    try {
        // Mock PDF Generation
        const campaign = await PhishingCampaign.findByPk(req.params.id);
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
        
        res.header('Content-Type', 'application/pdf');
        res.attachment(`Campaign_${campaign.campaign_id}_Report.pdf`);
        res.send(`%PDF-1.4 Mock PDF Content for ${campaign.name}`);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.simulateEvent = async (req, res) => {
    try {
        const { campaign_id, user_id, event_type } = req.body;
        
        // 1. Log the event
        await PhishingEvent.create({ campaign_id, user_id, event_type });

        // 2. Automation Logic triggers
        if (event_type === 'clicked') {
            // "If user clicked: -> assign training"
            console.log(`[AUTOMATION] User ${user_id} clicked phishing link. Auto-assigning Phishing Remediation Training...`);
        }
        
        if (event_type === 'submitted') {
            // "If user submitted credentials: -> mark as high risk -> notify manager"
            await User.update({ status: 'High Risk' }, { where: { user_id } });
            console.log(`[AUTOMATION] User ${user_id} submitted credentials. Marked as HIGH RISK. Notifying manager...`);
        }

        res.json({ success: true, message: `Event '${event_type}' logged and automated rules evaluated.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
