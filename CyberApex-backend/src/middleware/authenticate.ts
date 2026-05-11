import { Request, Response, NextFunction } from 'express';
import { authService, RequestUser } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next({ statusCode: 401, code: 'UNAUTHORIZED', message: 'Authentication required' });
    return;
  }
  try {
    req.user = authService.verifyAccessToken(header.slice(7));
    next();
  } catch (err) {
    next(err);
  }
}
