/**
 * Tenant Users Controller
 * Manages user creation, updates, and management for each tenant
 */

const { User, Tenant } = require('../models');
const TenantAuthService = require('../services/tenantAuthService');

// GET /api/admin/tenants/:tenantId/users - List all users in a tenant
exports.list = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { role, status } = req.query;

        // Get all users for this tenant
        const users = await TenantAuthService.getTenantUsers(tenantId, {
            role: role || undefined,
            status: status || undefined
        });

        res.json({
            success: true,
            data: users.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                status: u.status,
                created_at: u.created_at
            }))
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /api/admin/tenants/:tenantId/users/:userId - Get single user
exports.getOne = async (req, res) => {
    try {
        const { tenantId, userId } = req.params;

        const user = await User.findOne({
            where: { id: userId, tenant_id: tenantId },
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                created_at: user.created_at
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/admin/tenants/:tenantId/users - Create new tenant user
exports.create = async (req, res) => {
    try {
        const { tenantId } = req.params;
        const { name, email, password, role = 'employee' } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'name, email, and password are required.'
            });
        }

        // Verify tenant exists
        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found.' });
        }

        // Create user via service
        const newUser = await TenantAuthService.createTenantUser(tenantId, {
            name,
            email,
            password,
            role
        }, req.user.id);

        res.status(201).json({
            success: true,
            message: 'User created successfully.',
            data: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                status: newUser.status
            }
        });
    } catch (err) {
        if (err.message.includes('already exists')) {
            return res.status(409).json({ success: false, message: err.message });
        }
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/admin/tenants/:tenantId/users/:userId - Update user
exports.update = async (req, res) => {
    try {
        const { tenantId, userId } = req.params;
        const { name, email, role } = req.body;

        const user = await User.findOne({
            where: { id: userId, tenant_id: tenantId }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Update allowed fields
        if (name) user.name = name;
        if (email) user.email = email.toLowerCase();
        if (role && ['employee', 'ciso', 'tenant_admin'].includes(role)) {
            user.role = role;
        }

        await user.save();

        res.json({
            success: true,
            message: 'User updated successfully.',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PATCH /api/admin/tenants/:tenantId/users/:userId/status - Update user status
exports.updateStatus = async (req, res) => {
    try {
        const { tenantId, userId } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'suspended'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be active, inactive, or suspended.'
            });
        }

        await TenantAuthService.updateUserStatus(userId, status);

        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        res.json({
            success: true,
            message: 'User status updated successfully.',
            data: {
                id: user.id,
                email: user.email,
                status: user.status
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// DELETE /api/admin/tenants/:tenantId/users/:userId - Delete user
exports.delete = async (req, res) => {
    try {
        const { tenantId, userId } = req.params;

        const user = await User.findOne({
            where: { id: userId, tenant_id: tenantId }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        // Prevent deleting tenant admin if it's the only admin
        if (user.role === 'tenant_admin') {
            const adminCount = await User.count({
                where: { tenant_id: tenantId, role: 'tenant_admin' }
            });

            if (adminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete the only tenant admin.'
                });
            }
        }

        await user.destroy();

        res.json({
            success: true,
            message: 'User deleted successfully.'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/admin/tenants/:tenantId/users/:userId/reset-password - Reset user password
exports.resetPassword = async (req, res) => {
    try {
        const { tenantId, userId } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters.'
            });
        }

        const user = await User.findOne({
            where: { id: userId, tenant_id: tenantId }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        await TenantAuthService.resetPassword(userId, newPassword, req.user.id);

        res.json({
            success: true,
            message: 'Password reset successfully.'
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
