// Users Management Routes (Admin only)
import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users with pagination and search
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = '' } = req.query;
        const offset = (page - 1) * limit;

        const db = await getDb();

        let whereClause = '1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        if (role) {
            whereClause += ' AND role = ?';
            params.push(role);
        }

        // Get total count
        const countResult = await db.get(
            `SELECT COUNT(*) as total FROM users WHERE ${whereClause}`,
            params
        );

        // Get users
        const users = await db.all(
            `SELECT id, username, email, full_name, role, is_active, last_login, created_at, updated_at 
             FROM users 
             WHERE ${whereClause}
             ORDER BY created_at DESC 
             LIMIT ? OFFSET ?`,
            [...params, parseInt(limit), parseInt(offset)]
        );

        res.json({
            users,
            pagination: {
                total: countResult.total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult.total / limit)
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to get users' });
    }
});

// Get single user
router.get('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const user = await db.get(
            `SELECT id, username, email, full_name, role, is_active, last_login, created_at, updated_at 
             FROM users WHERE id = ?`,
            [req.params.id]
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Create new user
router.post('/', async (req, res) => {
    try {
        const { username, email, password, fullName, role = 'user' } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
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

        const result = await db.run(
            `INSERT INTO users (username, email, password_hash, full_name, role) 
             VALUES (?, ?, ?, ?, ?)`,
            [username, email, passwordHash, fullName || username, role]
        );

        const newUser = await db.get(
            `SELECT id, username, email, full_name, role, is_active, created_at 
             FROM users WHERE id = ?`,
            [result.lastID]
        );

        res.status(201).json(newUser);
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Update user
router.put('/:id', async (req, res) => {
    try {
        const { username, email, fullName, role, isActive } = req.body;

        const db = await getDb();

        const user = await db.get('SELECT id FROM users WHERE id = ?', [req.params.id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deactivating yourself
        if (req.user.id === parseInt(req.params.id) && isActive === false) {
            return res.status(400).json({ error: 'Cannot deactivate your own account' });
        }

        // Check for duplicate username/email
        if (username || email) {
            const existingUser = await db.get(
                'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
                [username, email, req.params.id]
            );

            if (existingUser) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }
        }

        const updates = [];
        const values = [];

        if (username !== undefined) {
            updates.push('username = ?');
            values.push(username);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            values.push(email);
        }
        if (fullName !== undefined) {
            updates.push('full_name = ?');
            values.push(fullName);
        }
        if (role !== undefined && ['user', 'admin'].includes(role)) {
            // Prevent demoting yourself
            if (req.user.id === parseInt(req.params.id) && role !== 'admin') {
                return res.status(400).json({ error: 'Cannot change your own role' });
            }
            updates.push('role = ?');
            values.push(role);
        }
        if (isActive !== undefined) {
            updates.push('is_active = ?');
            values.push(isActive ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.params.id);

        await db.run(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        const updatedUser = await db.get(
            `SELECT id, username, email, full_name, role, is_active, last_login, created_at, updated_at 
             FROM users WHERE id = ?`,
            [req.params.id]
        );

        res.json(updatedUser);
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Reset user password
router.post('/:id/reset-password', async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        const db = await getDb();

        const user = await db.get('SELECT id FROM users WHERE id = ?', [req.params.id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);

        await db.run(
            'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [passwordHash, req.params.id]
        );

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// Delete user
router.delete('/:id', async (req, res) => {
    try {
        const db = await getDb();

        const user = await db.get('SELECT id FROM users WHERE id = ?', [req.params.id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting yourself
        if (req.user.id === parseInt(req.params.id)) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get user statistics
router.get('/stats/overview', async (req, res) => {
    try {
        const db = await getDb();

        const stats = await db.get(`
            SELECT 
                COUNT(*) as totalUsers,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as adminUsers,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeUsers,
                SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactiveUsers
            FROM users
        `);

        res.json(stats);
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ error: 'Failed to get user statistics' });
    }
});

export default router;
