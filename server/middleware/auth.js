// Authentication Middleware
import jwt from 'jsonwebtoken';
import { getDb } from '../database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'invoicesmart-secret-key-change-in-production';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const db = await getDb();
        const user = await db.get(
            'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// Middleware to check if user is admin
export const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
};

// Optional authentication - continues even without token
export const optionalAuth = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const db = await getDb();
        const user = await db.get(
            'SELECT id, username, email, full_name, role, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );

        req.user = user && user.is_active ? user : null;
    } catch (error) {
        req.user = null;
    }

    next();
};

export { JWT_SECRET };
