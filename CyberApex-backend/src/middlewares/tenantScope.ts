import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
    tenantId?: string;
}

/**
 * Middleware to enforce tenant context inside a request.
 * Expects 'x-tenant-id' header or extracting tenantId from the verified JWT.
 */
export const tenantScopeMiddleware = (req: TenantRequest, res: Response, next: NextFunction) => {
    // In a robust scenario, this string would originate from the JWT token for Employees/Managers.
    // For Super Admins managing tenants, they might pass 'x-tenant-id' explicitly.
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
        return res.status(403).json({ error: 'Tenant context is missing (Missing x-tenant-id)' });
    }

    req.tenantId = tenantId;
    next();
};
