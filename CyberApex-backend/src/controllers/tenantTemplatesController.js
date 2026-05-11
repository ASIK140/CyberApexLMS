const { EmailTemplate, TemplateUsage } = require('../models');

// Mock data parser
const parseMergeTags = (html, userData) => {
    if (!html) return '';
    let parsed = html;
    const defaults = {
        '{{first_name}}': 'Valued User',
        '{{course_name}}': 'Security Awareness 101',
        '{{deadline_date}}': new Date().toLocaleDateString(),
        '{{completion_pct}}': '0%',
        '{{risk_score}}': '0 (Unknown)',
        '{{training_link}}': 'https://lms.cyberapex.com/training',
        '{{manager_name}}': 'Your Manager',
        '{{cert_link}}': 'https://lms.cyberapex.com/certificates'
    };

    Object.keys(defaults).forEach(key => {
        const value = userData[key.replace(/[{}]/g, '')] || defaults[key];
        parsed = parsed.replace(new RegExp(key, 'g'), value);
    });

    return parsed;
};

exports.getTemplates = async (req, res, next) => {
    try {
        const tenant_id = req.user?.tenant_id || 'tenant_acme'; // mocked
        const templates = await EmailTemplate.findAll({
            where: { tenant_id },
            order: [['created_at', 'DESC']]
        });
        res.json({ success: true, count: templates.length, data: templates });
    } catch (err) { next(err); }
};

exports.getTemplate = async (req, res, next) => {
    try {
        const template = await EmailTemplate.findByPk(req.params.id);
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
        res.json({ success: true, data: template });
    } catch (err) { next(err); }
};

exports.createTemplate = async (req, res, next) => {
    try {
        const tenant_id = req.user?.tenant_id || 'tenant_acme';
        const template = await EmailTemplate.create({
            tenant_id,
            ...req.body
        });
        res.json({ success: true, data: template, message: 'Template Created' });
    } catch (err) { next(err); }
};

exports.updateTemplate = async (req, res, next) => {
    try {
        const template = await EmailTemplate.findByPk(req.params.id);
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
        
        await template.update(req.body);
        res.json({ success: true, data: template, message: 'Template Updated' });
    } catch (err) { next(err); }
};

exports.deleteTemplate = async (req, res, next) => {
    try {
        const template = await EmailTemplate.findByPk(req.params.id);
        if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
        
        await template.destroy();
        res.json({ success: true, message: 'Template Deleted' });
    } catch (err) { next(err); }
};

exports.previewTemplate = async (req, res, next) => {
    try {
        const { html_body, text_body } = req.body;
        // Mock sample data
        const sampleData = {
            first_name: 'Alice',
            risk_score: '22 (Low)',
            completion_pct: '88%'
        };
        
        const previewHtml = parseMergeTags(html_body, sampleData);
        res.json({ success: true, previewHtml, previewText: text_body });
    } catch (err) { next(err); }
};

exports.testEmail = async (req, res, next) => {
    try {
        const { to_email, template_id, subject, html_body } = req.body;
        
        // Mock sending action
        res.json({ success: true, message: `Test email simulated and dispatched to ${to_email}` });
    } catch (err) { next(err); }
};
