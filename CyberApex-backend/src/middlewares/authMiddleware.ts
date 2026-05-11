import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supers3cret_jwt_key_cyberapex_!2026$';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        tenantId?: string;
    };
}

export const protectRoute = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Not authorized, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            tenantId: decoded.tenantId,
        };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Not authorized, token failed' });
    }
};
