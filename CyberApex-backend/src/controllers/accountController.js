'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

let ADMIN_SETTINGS = {
    mfa_enforced_globally: true
};

const ADMIN_ACCOUNTS = [
    { admin_id: 'admin_001', name: 'Super Admin', email: 'admin@cyberapex.io', role: 'super_admin', status: 'active', mfa_enabled: true, last_login: '2026-03-12T18:47:00Z', created_at: '2024-01-01' },
    { admin_id: 'admin_002', name: 'Operations Master', email: 'ops@cyberapex.io', role: 'super_admin', status: 'active', mfa_enabled: true, last_login: '2026-03-11T09:00:00Z', created_at: '2024-06-01' },
    { admin_id: 'admin_003', name: 'Content Manager', email: 'content@cyberapex.io', role: 'content_manager', status: 'active', mfa_enabled: true, last_login: '2026-03-10T14:30:00Z', created_at: '2024-08-15' },
    { admin_id: 'admin_004', name: 'Support Agent', email: 'support@cyberapex.io', role: 'support', status: 'active', mfa_enabled: true, last_login: '2026-02-20T11:00:00Z', created_at: '2025-01-10' },
    { admin_id: 'admin_005', name: 'Test Admin', email: 'test.admin@cyberapex.io', role: 'platform_ops', status: 'active', mfa_enabled: true, last_login: null, created_at: '2026-03-16' },
];

exports.list = (req, res) => {
    const { status, role } = req.query;
    let data = ADMIN_ACCOUNTS.map(a => ({ ...a, password: undefined }));
    if (status) data = data.filter(a => a.status === status);
    if (role) data = data.filter(a => a.role === role);
    res.json({ success: true, count: data.length, data, settings: ADMIN_SETTINGS });
};

exports.getSettings = (req, res) => {
    res.json({ success: true, settings: ADMIN_SETTINGS });
};

exports.updateSettings = (req, res) => {
    const { mfa_enforced_globally } = req.body;
    if (typeof mfa_enforced_globally === 'boolean') {
        ADMIN_SETTINGS.mfa_enforced_globally = mfa_enforced_globally;
    }
    res.json({ success: true, message: 'Admin global settings updated.', settings: ADMIN_SETTINGS });
};

exports.getById = (req, res) => {
    const admin = ADMIN_ACCOUNTS.find(a => a.admin_id === req.params.id);
    if (!admin) return res.status(404).json({ success: false, message: 'Admin account not found.' });
    const { password, ...safe } = admin;
    res.json({ success: true, data: safe });
};

exports.create = async (req, res) => {
    const { name, email, role, password } = req.body;
    if (!name || !email || !role || !password) return res.status(400).json({ success: false, message: 'name, email, role and password required.' });
    if (ADMIN_ACCOUNTS.find(a => a.email === email)) return res.status(409).json({ success: false, message: 'Email already in use.' });
    const hashedPwd = await bcrypt.hash(password, 10);
    const admin = { admin_id: 'admin_' + uuidv4().slice(0, 6), name, email, role, password: hashedPwd, status: 'active', mfa_enabled: true, last_login: null, created_at: new Date().toISOString().split('T')[0] };
    ADMIN_ACCOUNTS.push(admin);
    const { password: _, ...safe } = admin;
    res.status(201).json({ success: true, message: 'Admin account created.', data: safe });
};

exports.update = (req, res) => {
    const idx = ADMIN_ACCOUNTS.findIndex(a => a.admin_id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Admin account not found.' });
    const { password, ...updates } = req.body;
    ADMIN_ACCOUNTS[idx] = { ...ADMIN_ACCOUNTS[idx], ...updates, admin_id: ADMIN_ACCOUNTS[idx].admin_id };
    const { password: _, ...safe } = ADMIN_ACCOUNTS[idx];
    res.json({ success: true, message: 'Admin account updated.', data: safe });
};

exports.remove = (req, res) => {
    const idx = ADMIN_ACCOUNTS.findIndex(a => a.admin_id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, message: 'Admin account not found.' });
    if (ADMIN_ACCOUNTS[idx].role === 'super_admin') return res.status(403).json({ success: false, message: 'Cannot delete the super admin account.' });
    ADMIN_ACCOUNTS.splice(idx, 1);
    res.json({ success: true, message: 'Admin account deleted.' });
};
