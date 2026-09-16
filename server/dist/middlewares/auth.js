"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => {
    // Prioritize Bearer token header (for cross-origin Vercel/mobile apps) then fallback to cookie
    const authHeader = (req.headers['authorization'] || req.headers['Authorization']);
    const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = bearerToken || req.cookies?.token;
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No authentication token provided.' });
    }
    try {
        const secret = process.env.JWT_SECRET || '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        // Allow if role is explicitly in allowed list OR if user is SUPER_ADMIN accessing admin roles
        const hasRole = roles.includes(req.user.role) || (req.user.role === 'SUPER_ADMIN' && roles.some(r => ['ADMIN', 'MANAGER'].includes(r)));
        if (!hasRole && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: 'Forbidden. You do not have the required role.' });
        }
        next();
    };
};
exports.requireRole = requireRole;
