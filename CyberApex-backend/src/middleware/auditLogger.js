'use strict';

const { logEvent } = require('../controllers/auditController');

/**
 * Audit Logger Middleware
 * Intercepts requests and logs significant actions based on route/method
 */
const auditLogger = (options = {}) => {
    return (req, res, next) => {
        const originalSend = res.send;
        
        // Wrap res.send to capture the result after the request is processed
        res.send = function (body) {
            res.send = originalSend;
            
            // Only log successful or important failed actions based on context
            // In a real system, we'd have a map of routes to action types
            const actionInfo = getActionInfo(req);
            
            if (actionInfo && res.statusCode < 400) {
                logEvent({
                    actor: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System',
                    role: req.user ? req.user.role : 'Automated',
                    action: actionInfo.action,
                    target: actionInfo.target || req.originalUrl,
                    tenant_id: req.user ? req.user.tenantId : null,
                    ip: req.ip || req.connection.remoteAddress,
                    result: 'Success',
                    metadata: {
                        method: req.method,
                        path: req.originalUrl,
                        status: res.statusCode
                    }
                });
            } else if (actionInfo && res.statusCode >= 400) {
                 logEvent({
                    actor: req.user ? `${req.user.firstName} ${req.user.lastName}` : 'System',
                    role: req.user ? req.user.role : 'Automated',
                    action: actionInfo.action,
                    target: actionInfo.target || req.originalUrl,
                    tenant_id: req.user ? req.user.tenantId : null,
                    ip: req.ip || req.connection.remoteAddress,
                    result: 'Failed',
                    metadata: {
                        method: req.method,
                        path: req.originalUrl,
                        status: res.statusCode,
                        error: body ? JSON.parse(body).message : 'Unknown Error'
                    }
                });
            }

            return originalSend.call(this, body);
        };

        next();
    };
};

// Helper to determine action type based on request
function getActionInfo(req) {
    const url = req.originalUrl;
    const method = req.method;

    if (url.includes('/admin/tenants') && method === 'POST') return { action: 'TenantOnboarded', target: req.body.name };
    if (url.includes('/admin/ngo/approve')) return { action: 'NGOApproved', target: req.body.ngoName || 'NGO' };
    if (url.includes('/courses') && method === 'POST') return { action: 'CoursePublished', target: req.body.title };
    if (url.includes('/campaigns/launch')) return { action: 'EmailCampaignLaunched', target: req.body.campaignName };
    if (url.includes('/security/sso') && method === 'POST') return { action: 'SSOConfigured', target: req.body.provider };
    if (url.includes('/email-deliverability/fix')) return { action: 'DNSUpdated', target: req.body.domain };
    if (url.includes('/users/import')) return { action: 'UserImported', target: 'Bulk Import' };
    
    // Default to null if not a tracked critical action
    return null;
}

module.exports = auditLogger;
