// Users Management Routes (Admin only)
import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb } from '../database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { buildRequestAuditContext, logAuditEvent } from '../auditLogger.js';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateToken);
router.use(requireAdmin);

function normalizeTimestampInput(value) {
    if (typeof value !== 'string' || !value.trim()) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toISOString().slice(0, 19).replace('T', ' ');
}

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

// Get audit logs (admin only)
router.get('/logs', async (req, res) => {
    try {
        const { page = 1, limit = 20, search = '', user_id = '', start_time = '', end_time = '' } = req.query;
        const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
        const safePage = Math.max(parseInt(page, 10) || 1, 1);
        const offset = (safePage - 1) * safeLimit;
        const db = await getDb();

        let whereClause = `
            al.action <> 'api.mutation'
            AND al.action NOT LIKE 'auth.%'
            AND al.action NOT LIKE 'settings.%'
        `;
        const params = [];

        if (search) {
            whereClause += ' AND (al.action LIKE ? OR al.path LIKE ? OR al.username_snapshot LIKE ?)';
            const pattern = `%${search}%`;
            params.push(pattern, pattern, pattern);
        }

        if (user_id) {
            const userId = parseInt(user_id, 10);
            if (Number.isNaN(userId)) {
                return res.status(400).json({ error: 'Invalid user_id' });
            }
            whereClause += ' AND al.user_id = ?';
            params.push(userId);
        }

        if (start_time) {
            const normalizedStart = normalizeTimestampInput(start_time);
            if (!normalizedStart) {
                return res.status(400).json({ error: 'Invalid start_time' });
            }
            whereClause += ' AND al.created_at >= ?';
            params.push(normalizedStart);
        }

        if (end_time) {
            const normalizedEnd = normalizeTimestampInput(end_time);
            if (!normalizedEnd) {
                return res.status(400).json({ error: 'Invalid end_time' });
            }
            whereClause += ' AND al.created_at <= ?';
            params.push(normalizedEnd);
        }

        if (start_time && end_time) {
            const normalizedStart = normalizeTimestampInput(start_time);
            const normalizedEnd = normalizeTimestampInput(end_time);
            if (normalizedStart && normalizedEnd && normalizedStart > normalizedEnd) {
                return res.status(400).json({ error: 'start_time must be before end_time' });
            }
        }

        const totalRow = await db.get(
            `SELECT COUNT(*) as total
             FROM audit_logs al
             WHERE ${whereClause}`,
            params
        );

        const logs = await db.all(
            `SELECT
                al.id,
                al.user_id,
                al.username_snapshot,
                COALESCE(u.full_name, u.username, al.username_snapshot, 'System') as actor_name,
                al.action,
                al.method,
                al.path,
                al.status_code,
                al.details,
                al.ip_address,
                al.user_agent,
                al.created_at
             FROM audit_logs al
             LEFT JOIN users u ON u.id = al.user_id
             WHERE ${whereClause}
             ORDER BY al.created_at DESC, al.id DESC
             LIMIT ? OFFSET ?`,
            [...params, safeLimit, offset]
        );

        res.json({
            logs,
            pagination: {
                total: totalRow?.total || 0,
                page: safePage,
                limit: safeLimit,
                totalPages: Math.ceil((totalRow?.total || 0) / safeLimit),
            },
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: 'Failed to get audit logs' });
    }
});

router.get('/logs/actors', async (req, res) => {
    try {
        const db = await getDb();
        const actors = await db.all(
            `SELECT
                al.user_id,
                COALESCE(u.full_name, u.username, al.username_snapshot, 'System') as actor_name
             FROM audit_logs al
             LEFT JOIN users u ON u.id = al.user_id
             WHERE al.user_id IS NOT NULL
               AND al.action <> 'api.mutation'
               AND al.action NOT LIKE 'auth.%'
               AND al.action NOT LIKE 'settings.%'
             GROUP BY al.user_id
             ORDER BY actor_name ASC`
        );

        res.json({ actors });
    } catch (error) {
        console.error('Get audit log actors error:', error);
        res.status(500).json({ error: 'Failed to get audit log actors' });
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

        await logAuditEvent({
            userId: req.user.id,
            username: req.user.username,
            action: 'admin.user.create',
            method: 'POST',
            path: '/api/users',
            statusCode: 201,
            details: {
                created_user_id: newUser.id,
                created_username: newUser.username,
                role: newUser.role,
            },
            ...buildRequestAuditContext(req),
        });

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

        await logAuditEvent({
            userId: req.user.id,
            username: req.user.username,
            action: 'admin.user.update',
            method: 'PUT',
            path: `/api/users/${req.params.id}`,
            statusCode: 200,
            details: {
                target_user_id: updatedUser.id,
                target_username: updatedUser.username,
                updates: {
                    username,
                    email,
                    fullName,
                    role,
                    isActive,
                },
            },
            ...buildRequestAuditContext(req),
        });

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

        await logAuditEvent({
            userId: req.user.id,
            username: req.user.username,
            action: 'admin.user.reset_password',
            method: 'POST',
            path: `/api/users/${req.params.id}/reset-password`,
            statusCode: 200,
            details: { target_user_id: parseInt(req.params.id, 10) },
            ...buildRequestAuditContext(req),
        });

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

        const user = await db.get('SELECT id, username FROM users WHERE id = ?', [req.params.id]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Prevent deleting yourself
        if (req.user.id === parseInt(req.params.id)) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await db.run('DELETE FROM users WHERE id = ?', [req.params.id]);

        await logAuditEvent({
            userId: req.user.id,
            username: req.user.username,
            action: 'admin.user.delete',
            method: 'DELETE',
            path: `/api/users/${req.params.id}`,
            statusCode: 200,
            details: { deleted_user_id: parseInt(req.params.id, 10), deleted_username: user.username },
            ...buildRequestAuditContext(req),
        });

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
