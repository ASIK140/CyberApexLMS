const { PhishingCampaign, PhishingTemplate, PhishingLandingPage, CampaignTarget, PhishingEvent, User } = require('../models');
const { v4: uuidv4 } = require('uuid');

exports.getCampaigns = async (req, res, next) => {
    try {
        const tenant_id = req.user?.tenant_id || 'tenant_acme';
        const campaigns = await PhishingCampaign.findAll({ where: { tenant_id }, order: [['createdAt', 'DESC']] });
        res.json({ success: true, count: campaigns.length, data: campaigns });
    } catch (error) { next(error); }
};

exports.getCampaign = async (req, res, next) => {
    try {
        const campaign = await PhishingCampaign.findByPk(req.params.id, {
            include: ['phishing_template', 'landing_page', 'targets']
        });
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
        res.json({ success: true, data: campaign });
    } catch (error) { next(error); }
};

exports.createDraft = async (req, res, next) => {
    try {
        const tenant_id = req.user?.tenant_id || 'tenant_acme';
        // Step 1 initialize
        const campaign = await PhishingCampaign.create({
            tenant_id,
            name: req.body.name || `Campaign Setup - ${new Date().toISOString().split('T')[0]}`,
            status: 'Draft',
            type: req.body.attack_type || 'Email Phishing'
        });
        res.json({ success: true, message: 'Draft initialized', data: campaign });
    } catch (error) { next(error); }
};

exports.saveDraft = async (req, res, next) => {
    try {
        const { campaign_id, attack_type, template, landing_page, targets, name } = req.body;
        
        let campaign = await PhishingCampaign.findByPk(campaign_id);
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

        await campaign.update({ 
            type: attack_type || campaign.type,
            name: name || campaign.name
        });

        if (template) {
            let pTemplate = await PhishingTemplate.findOne({ where: { campaign_id } });
            if (pTemplate) {
                await pTemplate.update({ subject: template.subject, body: template.body, red_flags: template.red_flags || [] });
            } else {
                await PhishingTemplate.create({ campaign_id, subject: template.subject, body: template.body, red_flags: template.red_flags || [] });
            }
        }

        if (landing_page) {
            let pLanding = await PhishingLandingPage.findOne({ where: { campaign_id } });
            if (pLanding) {
                await pLanding.update({ type: landing_page.type, template_name: landing_page.template_name, redirect_url: landing_page.redirect_url });
            } else {
                await PhishingLandingPage.create({ campaign_id, type: landing_page.type, template_name: landing_page.template_name, redirect_url: landing_page.redirect_url });
            }
        }
        
        if (targets && Array.isArray(targets)) {
             await CampaignTarget.destroy({ where: { campaign_id } });
             for (let u_id of targets) {
                 await CampaignTarget.create({ campaign_id, user_id: u_id });
             }
        }

        res.json({ success: true, message: 'Draft saved successfully' });
    } catch (error) { next(error); }
};

exports.launchCampaign = async (req, res, next) => {
    try {
        const { campaign_id, launch_date } = req.body;
        let campaign = await PhishingCampaign.findByPk(campaign_id);
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });
        
        // If launch date is in the future, set Scheduled, else Running
        const now = new Date();
        const launch = launch_date ? new Date(launch_date) : now;
        const status = launch > now ? 'Scheduled' : 'Running';

        await campaign.update({
            status,
            scheduled_at: launch,
            started_at: launch <= now ? launch : null,
        });

        // Mock Event creation if launching immediately
        if (status === 'Running') {
             const targs = await CampaignTarget.findAll({ where: { campaign_id } });
             for (const t of targs) {
                 await PhishingEvent.create({ campaign_id, user_id: t.user_id, event_type: 'sent', timestamp: now });
             }
             await campaign.update({ emails_sent: targs.length });
        }

        res.json({ success: true, message: `Campaign launched with status: ${status}`, status });
    } catch (error) { next(error); }
};

exports.getTemplates = async (req, res, next) => {
    try {
        const mockTemplates = [
            { id: 1, name: 'Password Reset', category: 'IT Support', subject: 'MANDATORY: Reset Your Password', red_flags: ['Urgency', 'Lookalike domain', 'Suspicious link'] },
            { id: 2, name: 'CEO Fraud / Gift Cards', category: 'Executive', subject: 'Urgent task for you', red_flags: ['Spoofed sender', 'Unusual request', 'General greeting'] },
            { id: 3, name: 'Google Workspace Alert', category: 'Cloud App', subject: 'Unusual sign-in activity detected', red_flags: ['Brand spoofing', 'Urgency'] }
        ];
        res.json({ success: true, data: mockTemplates });
    } catch(error) { next(error); }
};

exports.trackEvent = async (req, res, next) => {
    try {
        const { campaign_id, user_id, event_type } = req.body;
        // event_type: opened, clicked, submitted, reported
        await PhishingEvent.create({ campaign_id, user_id, event_type, timestamp: new Date() });
        
        let campaign = await PhishingCampaign.findByPk(campaign_id);
        if (campaign) {
            if (event_type === 'clicked') campaign.emails_clicked += 1;
            if (event_type === 'submitted') campaign.credentials_submitted += 1;
            if (event_type === 'reported') campaign.reported_count += 1;
            await campaign.save();
        }
        res.json({ success: true, message: `Event ${event_type} tracked`});
    } catch (error) { next(error); }
};
