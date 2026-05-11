'use strict';
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Tenant } = require('../models');
const { v4: uuidv4 } = require('uuid');

/**
 * Tenant Authentication Service
 * Handles all tenant admin authentication, user management, and tenant isolation
 */

class TenantAuthService {
    /**
     * Authenticate a user (tenant admin, ciso, employee, or student)
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {object} Authenticated user with tokens
     */
    static async authenticateUser(email, password) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        const emailLower = email.toLowerCase().trim();

        // 1. Check User table (includes tenant admins, CISOs, employees)
        // Fetch both password and password_hash to support legacy and Prisma columns
        const [allUsers] = await User.sequelize.query(
            'SELECT id, name, email, password, password_hash, role, tenant_id, status FROM users'
        );

        let dbUser = allUsers.find(u => u.email && u.email.toLowerCase() === emailLower);

        if (dbUser) {
            // Verify password (support either legacy 'password' or Prisma 'password_hash' column)
            const storedHash = dbUser.password || dbUser.password_hash || '';
            const isValidPassword = await bcrypt.compare(password, storedHash);
            if (!isValidPassword) {
                throw new Error('Invalid credentials');
            }

            // Check account status
            if (dbUser.status !== 'active') {
                throw new Error(`Account is ${dbUser.status}. Please contact administrator.`);
            }

            // Return user info with tenant details if applicable
            const userData = {
                id: dbUser.id,
                name: dbUser.name,
                email: dbUser.email,
                role: dbUser.role,
                tenant_id: dbUser.tenant_id,
                status: dbUser.status
            };

            // If tenant_admin or other tenant role, enrich with tenant details
            if (dbUser.tenant_id && (dbUser.role === 'tenant_admin' || dbUser.role === 'ciso' || dbUser.role === 'employee')) {
                const tenant = await Tenant.findByPk(dbUser.tenant_id);
                if (tenant) {
                    userData.tenant = {
                        tenant_id: tenant.tenant_id,
                        organization_name: tenant.organization_name,
                        plan_type: tenant.plan_type,
                        status: tenant.status
                    };
                }
            }

            return userData;
        }

        throw new Error('Invalid credentials');
    }

    /**
     * Create a tenant admin user when a new tenant is created
     * @param {object} tenantData - Tenant data
     * @param {object} adminData - Admin user data
     * @returns {object} Created user
     */
    static async createTenantAdmin(tenantData, adminData) {
        const { tenant_id, organization_name, admin_email, admin_password, admin_name } = {
            ...tenantData,
            ...adminData
        };

        if (!tenant_id || !admin_email || !admin_password || !admin_name) {
            throw new Error('Missing required fields for tenant admin creation');
        }

        // Check if email already exists
        const existingUser = await User.findOne({ where: { email: admin_email.toLowerCase() } });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(admin_password, 10);

        // Create user
        const user = await User.create({
            id: uuidv4(),
            name: admin_name,
            email: admin_email,
            password: hashedPassword,
            role: 'tenant_admin',
            tenant_id: tenant_id,
            status: 'active'
        });

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenant_id: user.tenant_id
        };
    }

    /**
     * Create additional tenant users (CISO, employees, etc.)
     * @param {string} tenantId - Tenant ID
     * @param {object} userData - User data
     * @param {string} createdBy - User creating the new user
     * @returns {object} Created user
     */
    static async createTenantUser(tenantId, userData, createdBy) {
        const { name, email, password, role = 'employee' } = userData;

        if (!name || !email || !password) {
            throw new Error('Name, email, and password are required');
        }

        if (!['ciso', 'employee'].includes(role)) {
            throw new Error('Invalid role. Must be ciso or employee');
        }

        // Verify tenant exists
        const tenant = await Tenant.findByPk(tenantId);
        if (!tenant) {
            throw new Error('Tenant not found');
        }

        // Check if email already exists
        const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            id: uuidv4(),
            name: name,
            email: email,
            password: hashedPassword,
            role: role,
            tenant_id: tenantId,
            status: 'active'
        });

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            tenant_id: user.tenant_id
        };
    }

    /**
     * Generate JWT tokens for authenticated user
     * @param {object} user - User object
     * @returns {object} Access and refresh tokens
     */
    static generateTokens(user) {
        const payload = {
            id: user.id,
            email: user.email,
            role: user.role,
            tenant_id: user.tenant_id,
            name: user.name
        };

        const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'cyberapex_dev_secret', {
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        });

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.JWT_REFRESH_SECRET || 'cyberapex_refresh_dev',
            { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
        );

        return { accessToken, refreshToken };
    }

    /**
     * Verify a JWT token
     * @param {string} token - JWT token
     * @param {string} type - 'access' or 'refresh'
     * @returns {object} Decoded token
     */
    static verifyToken(token, type = 'access') {
        try {
            const secret =
                type === 'refresh'
                    ? process.env.JWT_REFRESH_SECRET || 'cyberapex_refresh_dev'
                    : process.env.JWT_SECRET || 'cyberapex_dev_secret';

            return jwt.verify(token, secret);
        } catch (err) {
            throw new Error(`Invalid or expired ${type} token`);
        }
    }

    /**
     * Get tenant users
     * @param {string} tenantId - Tenant ID
     * @param {object} options - Query options (role, status, etc.)
     * @returns {array} List of users
     */
    static async getTenantUsers(tenantId, options = {}) {
        const { role, status, limit = 100, offset = 0 } = options;

        const where = { tenant_id: tenantId };
        if (role) where.role = role;
        if (status) where.status = status;

        const users = await User.findAll({
            where,
            attributes: ['id', 'name', 'email', 'role', 'status', 'created_at'],
            limit,
            offset,
            order: [['created_at', 'DESC']]
        });

        return users;
    }

    /**
     * Update user status
     * @param {string} userId - User ID
     * @param {string} status - New status (active, inactive, suspended)
     * @returns {object} Updated user
     */
    static async updateUserStatus(userId, status) {
        if (!['active', 'inactive', 'suspended'].includes(status)) {
            throw new Error('Invalid status');
        }

        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        await user.update({ status });

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            status: user.status
        };
    }

    /**
     * Reset user password
     * @param {string} userId - User ID
     * @param {string} newPassword - New password
     * @param {string} requestedBy - User requesting the change
     * @returns {boolean} Success
     */
    static async resetPassword(userId, newPassword, requestedBy) {
        if (!newPassword || newPassword.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }

        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await user.update({ password: hashedPassword });

        return true;
    }
}

module.exports = TenantAuthService;
