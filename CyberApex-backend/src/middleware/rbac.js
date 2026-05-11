'use strict';

/**
 * Role-Based Access Control middleware factory.
 * Usage: requireRole('super_admin') or requireRole(['super_admin','tenant_admin'])
 */
const requireRole = (...allowedRoles) => {
    const roles = allowedRoles.flat();
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required.' });
        }
        const userRole = req.user.role;
        if (!roles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: [${roles.join(', ')}]. Your role: ${userRole}`,
            });
        }
        next();
    };
};

/**
 * Tenant isolation middleware.
 * Ensures non-super_admin users can only access their own tenant's data.
 * Handles both camelCase (RS256 JWT from auth.service.ts) and snake_case (legacy HS256 JWT).
 */
const tenantIsolation = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required for isolation.' });
    }

    if (req.user.role === 'super_admin') {
        return next();
    }

    const tenantId = req.user.tenantId || req.user.tenant_id;
    if (!tenantId) {
        return res.status(403).json({ success: false, message: 'Access denied. Account not associated with a tenant.' });
    }

    req.tenantId = tenantId;
    next();
};

module.exports = { requireRole, tenantIsolation };
