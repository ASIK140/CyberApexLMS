'use strict';
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

function getPublicKey() {
    try {
        if (process.env.JWT_PUBLIC_KEY_PATH) {
            const keyPath = path.resolve(process.cwd(), process.env.JWT_PUBLIC_KEY_PATH);
            return fs.readFileSync(keyPath, 'utf8');
        }
        if (process.env.JWT_PUBLIC_KEY) {
            return process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
        }
    } catch (err) {
        console.error('Error loading public key in legacy auth middleware:', err.message);
    }
    return null;
}

const authenticate = (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        console.log('Auth Header:', authHeader);
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }
        
        // 1. Try legacy symmetric verification (HS256)
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cyberapex_super_secret_jwt_key_2026');
            req.user = decoded;
            return next();
        } catch (err) {
            // If it's just an invalid signature, try the new RS256 verification
            if (err.name !== 'JsonWebTokenError' && err.name !== 'TokenExpiredError') {
                throw err;
            }
        }

        // 2. Try new asymmetric verification (RS256)
        const publicKey = getPublicKey();
        if (publicKey) {
            try {
                const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
                // Normalize payload for legacy routes: sub -> id
                req.user = {
                    ...decoded,
                    id: decoded.sub || decoded.id
                };
                return next();
            } catch (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ success: false, message: 'Token expired.' });
                }
            }
        }

        return res.status(401).json({ success: false, message: 'Invalid token.' });
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        return res.status(401).json({ success: false, message: 'Authentication failed.' });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden. You lack the required permissions.' });
        }
        next();
    };
};

module.exports = { authenticate, authorizeRoles };
