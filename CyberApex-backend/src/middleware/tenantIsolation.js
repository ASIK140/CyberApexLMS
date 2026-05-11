/**
 * Tenant Isolation Middleware
 * Ensures that tenant users can only access their own tenant's data
 * Super admins bypass this check
 */

const tenantIsolation = (req, res, next) => {
    try {
        // Super admin bypass
        if (req.user?.role === 'super_admin') {
            return next();
        }

        // Tenant users must match tenant_id in route
        if (req.user?.tenant_id) {
            const routeTenantId = req.params.tenantId || req.params.tenant_id;
            
            if (routeTenantId && req.user.tenant_id !== routeTenantId) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied: You can only access your own tenant data.'
                });
            }
        }

        // If no tenant_id in user, must be super_admin
        if (!req.user?.tenant_id && req.user?.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Invalid user role for this operation.'
            });
        }

        next();
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = tenantIsolation;
