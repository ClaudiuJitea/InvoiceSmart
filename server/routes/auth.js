// Authentication Routes
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '../database.js';
import { authenticateToken, JWT_SECRET } from '../middleware/auth.js';
import { buildRequestAuditContext, logAuditEvent } from '../auditLogger.js';

const router = express.Router();

const TOKEN_EXPIRY = '7d'; // Token expires in 7 days

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, fullName } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const db = await getDb();

        // Check if user already exists
        const existingUser = await db.get(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const result = await db.run(
            `INSERT INTO users (username, email, password_hash, full_name, role) 
             VALUES (?, ?, ?, ?, 'user')`,
            [username, email, passwordHash, fullName || username]
        );

        // Generate token
        const token = jwt.sign(
            { userId: result.lastID, username },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        await logAuditEvent({
            ...buildRequestAuditContext(req),
            userId: result.lastID,
            username,
            action: 'auth.register',
            method: 'POST',
            path: '/api/auth/register',
            statusCode: 201,
            details: { email, fullName: fullName || username },
        });

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: result.lastID,
                username,
                email,
                fullName: fullName || username,
                role: 'user'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const db = await getDb();

        // Find user by username or email
        const user = await db.get(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await db.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Generate token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: TOKEN_EXPIRY }
        );

        await logAuditEvent({
            ...buildRequestAuditContext(req),
            userId: user.id,
            username: user.username,
            action: 'auth.login',
            method: 'POST',
            path: '/api/auth/login',
            statusCode: 200,
            details: { usernameOrEmail: username },
        });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                fullName: req.user.full_name,
                role: req.user.role
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user information' });
    }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters' });
        }

        const db = await getDb();

        // Get user with password
        const user = await db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Update password
        await db.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newPasswordHash, req.user.id]
        );

        await logAuditEvent({
            ...buildRequestAuditContext(req),
            userId: req.user.id,
            username: req.user.username,
            action: 'auth.change_password',
            method: 'POST',
            path: '/api/auth/change-password',
            statusCode: 200,
        });

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Logout (client-side - just invalidate token)
router.post('/logout', async (req, res) => {
    // In a production app, you might want to blacklist the token
    if (req.user?.id) {
        await logAuditEvent({
            ...buildRequestAuditContext(req),
            userId: req.user.id,
            username: req.user.username,
            action: 'auth.logout',
            method: 'POST',
            path: '/api/auth/logout',
            statusCode: 200,
        });
    }

    res.json({ message: 'Logged out successfully' });
});

export default router;
