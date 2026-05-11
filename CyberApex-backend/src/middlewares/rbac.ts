import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

export enum Roles {
    SUPER_ADMIN = 'super_admin',
    CISO = 'ciso',
    TENANT_ADMIN = 'tenant_admin',
    EMPLOYEE = 'employee',
}

/**
 * Middleware to strictly check allowed roles before accessing specific route logic.
 */
export const authorizeRoles = (...roles: Roles[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Not authorized' });
        }

        if (!roles.includes(req.user.role as Roles)) {
            return res.status(403).json({
                error: `Role ${req.user.role} is not permitted to access this resource`
            });
        }

        next();
    };
};
