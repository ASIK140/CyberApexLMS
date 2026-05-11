import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCodes } from '../lib/app-error';

export function authorize(allowedRoles: string[], opts: { sameTenantOnly?: boolean } = {}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user!;

    if (!allowedRoles.includes(user.role)) {
      next(new AppError(ErrorCodes.FORBIDDEN, 'Insufficient permissions', 403));
      return;
    }

    if (opts.sameTenantOnly && user.role !== 'super_admin') {
      const resourceTenantId = req.params.tenantId ?? (req.body as any)?.tenantId ?? req.query.tenantId;
      if (resourceTenantId && resourceTenantId !== user.tenantId) {
        next(new AppError(ErrorCodes.FORBIDDEN, 'Cross-tenant access denied', 403));
        return;
      }
    }

    next();
  };
}
