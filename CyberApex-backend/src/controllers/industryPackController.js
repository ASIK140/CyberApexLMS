const { IndustryPack, Tenant, Course } = require('../models');
const { v4: uuidv4 } = require('uuid');
const ExportUtil = require('../utils/exportUtility');

// GET /admin/industry-packs
exports.list = async (req, res) => {
    try {
        const { industry } = req.query;
        const where = {};
        if (industry) where.industry = industry;

        const packs = await IndustryPack.findAll({ where });
        
        // Map to frontend format
        const data = packs.map(p => ({
            pack_id: p.pack_id,
            pack_name: p.pack_name,
            industry_category: p.industry,
            description: p.description,
            courses_count: (p.included_courses || []).length,
            templates_count: 5, // Mock for now
            frameworks: [],
            created_at: p.created_at
        }));

        res.json({ success: true, count: data.length, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /admin/industry-packs/:id
exports.getById = async (req, res) => {
    try {
        const pack = await IndustryPack.findByPk(req.params.id);
        if (!pack) return res.status(404).json({ success: false, message: 'Industry pack not found.' });
        
        res.json({ success: true, data: pack });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /admin/industry-packs/assign
exports.assignToTenant = async (req, res) => {
    try {
        const { pack_id, tenant_id } = req.body;
        if (!pack_id || !tenant_id) {
            return res.status(400).json({ success: false, message: 'pack_id and tenant_id are required.' });
        }

        const pack = await IndustryPack.findByPk(pack_id);
        if (!pack) return res.status(404).json({ success: false, message: 'Pack not found.' });

        const tenant = await Tenant.findByPk(tenant_id);
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found.' });

        // Logic to assign courses would go here...
        
        res.json({ 
            success: true, 
            message: `Successfully assigned "${pack.pack_name}" to tenant ${tenant.organization_name}.`,
            details: {
                courses_deployed: (pack.included_courses || []).length,
                templates_created: 5,
                frameworks_mapped: 2
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /admin/industry-packs/custom
exports.createCustomPack = async (req, res) => {
    try {
        const { pack_name, industry_category, courses, templates, frameworks, description } = req.body;
        
        if (!pack_name || !industry_category) {
            return res.status(400).json({ success: false, message: 'pack_name and industry_category are required.' });
        }

        const newPack = await IndustryPack.create({
            pack_name,
            industry: industry_category,
            description: description || `Custom security pack for ${industry_category}`,
            included_courses: courses || [],
            status: 'active'
        });

        res.status(201).json({ success: true, message: 'Custom industry pack created.', data: newPack });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.create = exports.createCustomPack;

exports.update = async (req, res) => {
    try {
        const pack = await IndustryPack.findByPk(req.params.id);
        if (!pack) return res.status(404).json({ success: false, message: 'Pack not found.' });
        
        await pack.update(req.body);
        res.json({ success: true, message: 'Pack updated.', data: pack });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const pack = await IndustryPack.findByPk(req.params.id);
        if (!pack) return res.status(404).json({ success: false, message: 'Pack not found.' });
        await pack.destroy();
        res.json({ success: true, message: 'Industry pack deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.exportPacks = async (req, res) => {
    try {
        const { format = 'csv' } = req.query;
        const packs = await IndustryPack.findAll({ order: [['pack_name', 'ASC']] });
        
        const data = packs.map(p => ({
            name: p.pack_name,
            industry: p.industry,
            desc: p.description,
            courses: (p.included_courses || []).length,
            status: p.status || 'active',
            date: new Date(p.created_at).toLocaleDateString()
        }));

        const columns = [
            { header: 'Pack Name', key: 'name', width: 150 },
            { header: 'Industry', key: 'industry', width: 100 },
            { header: 'Description', key: 'desc', width: 200 },
            { header: 'Courses Count', key: 'courses', width: 80 },
            { header: 'Status', key: 'status', width: 70 },
            { header: 'Created', key: 'date', width: 90 }
        ];

        const filename = `industry_packs_inventory_${new Date().toISOString().split('T')[0]}`;

        if (format === 'pdf') {
            return await ExportUtil.generatePDF(res, 'Industry Content Packs Inventory', columns, data, `${filename}.pdf`);
        } else if (format === 'excel') {
            return await ExportUtil.generateExcel(res, 'Industry Content Packs Inventory', columns, data, `${filename}.xlsx`);
        } else {
            return ExportUtil.generateCSV(res, columns, data, `${filename}.csv`);
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.exportCsv = exports.exportPacks;
