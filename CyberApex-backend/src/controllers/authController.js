'use strict';
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const TenantAuthService = require('../services/tenantAuthService');
const { User, Tenant, IndividualStudent } = require('../models');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login - Enhanced for multi-tenant support
// ─────────────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const emailLower = email.toLowerCase().trim();

        try {
            // 1. Try authenticating as tenant admin, CISO, or employee
            const user = await TenantAuthService.authenticateUser(emailLower, password);

            // Generate tokens
            const { accessToken, refreshToken } = TenantAuthService.generateTokens(user);

            return res.json({
                success: true,
                message: 'Login successful',
                data: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        tenant_id: user.tenant_id,
                        tenant: user.tenant || null
                    }
                }
            });
        } catch (err) {
            if (err.message !== 'Invalid credentials' && err.message !== 'Account is active') {
                console.error('[Auth] Tenant auth error:', err.message);
            }
        }

        // 2. Try as individual student
        try {
            let student = await IndividualStudent.findOne({ where: { email: emailLower } });

            if (!student) {
                const allStudents = await IndividualStudent.findAll({
                    attributes: ['student_id', 'login_id', 'name', 'email', 'password_hash', 'service_status']
                });
                student = allStudents.find(s => s.login_id && s.login_id.toLowerCase() === emailLower);
            }

            if (student) {
                const isValidPassword = await bcrypt.compare(password, student.password_hash);
                if (isValidPassword) {
                    if (student.service_status === 'stopped') {
                        return res.status(403).json({
                            success: false,
                            message: 'Your LMS access has been stopped. Please contact your administrator.'
                        });
                    }

                    await student.update({ last_login: new Date() });

                    const userData = {
                        id: student.student_id,
                        name: student.name,
                        email: student.email,
                        role: 'student',
                        tenant_id: null
                    };

                    const { accessToken, refreshToken } = TenantAuthService.generateTokens(userData);

                    return res.json({
                        success: true,
                        message: 'Login successful',
                        data: {
                            accessToken,
                            refreshToken,
                            user: {
                                id: userData.id,
                                name: userData.name,
                                email: userData.email,
                                role: userData.role,
                                tenant_id: userData.tenant_id
                            }
                        }
                    });
                }
            }
        } catch (err) {
            console.error('[Auth] Student lookup error:', err);
        }

        // 3. User not found in any system
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    } catch (err) {
        console.error('[Auth] login error:', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /api/auth/register - Create new tenant user (SuperAdmin managed)
// ⚠️ DEPRECATED: Use /api/v1/auth/register instead for new implementations
exports.register = async (req, res) => {
    try {
        const { name, email, password, role = 'employee', tenant_id } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'name, email and password are required.' });
        }

        // Check if email exists (note: this query is not tenant-scoped - a known limitation)
        // Prefer using the v1 register endpoint which has proper tenant scoping
        const existing = await User.findOne({ where: { email: email.toLowerCase() } });
        if (existing) {
            return res.status(409).json({ success: false, message: 'Email already registered.' });
        }

        // Create user via service
        const user = await TenantAuthService.createTenantUser(tenant_id || null, {
            name,
            email,
            password,
            role
        });

        const { accessToken, refreshToken } = TenantAuthService.generateTokens(user);

        res.status(201).json({
            success: true,
            message: 'User registered successfully.',
            data: {
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    tenant_id: user.tenant_id
                }
            }
        });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};

// POST /api/auth/refresh - Refresh access token
exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token required.' });
        }

        const decoded = TenantAuthService.verifyToken(refreshToken, 'refresh');
        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'name', 'email', 'role', 'tenant_id']
        });

        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }

        const tokens = TenantAuthService.generateTokens(user);
        res.json({ success: true, data: tokens });
    } catch (err) {
        res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
    res.json({ success: true, message: 'Logged out successfully.' });
};

// GET /api/auth/me - Get current user info
exports.me = async (req, res) => {
    try {
        // Get user from request (populated by auth middleware)
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }

        // Check User table first
        let user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email', 'role', 'tenant_id', 'status']
        });

        if (user) {
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenant_id: user.tenant_id,
                status: user.status
            };

            // If tenant user, include tenant details
            if (user.tenant_id) {
                const tenant = await Tenant.findByPk(user.tenant_id);
                if (tenant) {
                    userData.tenant = {
                        tenant_id: tenant.tenant_id,
                        organization_name: tenant.organization_name,
                        plan_type: tenant.plan_type
                    };
                }
            }

            return res.json({ success: true, data: userData });
        }

        // Check student table
        if (req.user.role === 'student') {
            const student = await IndividualStudent.findByPk(userId, {
                attributes: { exclude: ['password_hash'] }
            });

            if (student) {
                return res.json({
                    success: true,
                    data: {
                        id: student.student_id,
                        name: student.name,
                        email: student.email,
                        role: 'student',
                        tenant_id: null
                    }
                });
            }
        }

        return res.status(404).json({ success: false, message: 'User not found.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};
