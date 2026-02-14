// Users Service - Admin API client
import { authService } from './authService.js';

const API_BASE = '/api/users';

export const userService = {
    // Get authorization header
    getAuthHeader() {
        return authService.getAuthHeader();
    },

    // Get all users with pagination
    async getAll(options = {}) {
        const { page = 1, limit = 10, search = '', role = '' } = options;
        const params = new URLSearchParams({ page, limit, search, role });

        const response = await fetch(`${API_BASE}?${params}`, {
            headers: this.getAuthHeader(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch users');
        }

        return data;
    },

    // Get single user
    async getById(id) {
        const response = await fetch(`${API_BASE}/${id}`, {
            headers: this.getAuthHeader(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch user');
        }

        return data;
    },

    // Create new user
    async create(userData) {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to create user');
        }

        return data;
    },

    // Update user
    async update(id, userData) {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update user');
        }

        return data;
    },

    // Delete user
    async delete(id) {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeader(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to delete user');
        }

        return data;
    },

    // Reset user password
    async resetPassword(id, newPassword) {
        const response = await fetch(`${API_BASE}/${id}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            body: JSON.stringify({ newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to reset password');
        }

        return data;
    },

    // Get user statistics
    async getStats() {
        const response = await fetch(`${API_BASE}/stats/overview`, {
            headers: this.getAuthHeader(),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch user statistics');
        }

        return data;
    },

    // Get audit logs (admin only)
    async getLogs(options = {}) {
        const { page = 1, limit = 20, search = '', userId = '', startTime = '', endTime = '' } = options;
        const params = new URLSearchParams({
            page: String(page),
            limit: String(limit),
            search,
        });

        if (userId) params.set('user_id', String(userId));
        if (startTime) params.set('start_time', startTime);
        if (endTime) params.set('end_time', endTime);

        const response = await fetch(`${API_BASE}/logs?${params.toString()}`, {
            headers: this.getAuthHeader(),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch audit logs');
        }

        return data;
    },

    async getLogActors() {
        const response = await fetch(`${API_BASE}/logs/actors`, {
            headers: this.getAuthHeader(),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch log actors');
        }

        return data;
    },
};

export default userService;
