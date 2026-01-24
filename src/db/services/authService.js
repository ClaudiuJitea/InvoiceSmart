// Authentication Service - API client
const API_BASE = '/api/auth';
const TOKEN_KEY = 'invoicesmart_token';
const USER_KEY = 'invoicesmart_user';

export const authService = {
    // Get stored token
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },

    // Get stored user
    getUser() {
        const userStr = localStorage.getItem(USER_KEY);
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    },

    // Check if user is logged in
    isLoggedIn() {
        return !!this.getToken();
    },

    // Check if user is admin
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    // Store auth data
    setAuth(token, user) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    },

    // Clear auth data
    clearAuth() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    },

    // Get authorization header
    getAuthHeader() {
        const token = this.getToken();
        return token ? { Authorization: `Bearer ${token}` } : {};
    },

    // Login
    async login(username, password) {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        this.setAuth(data.token, data.user);
        return data;
    },

    // Register
    async register(username, email, password, fullName) {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password, fullName }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Registration failed');
        }

        this.setAuth(data.token, data.user);
        return data;
    },

    // Logout
    async logout() {
        try {
            await fetch(`${API_BASE}/logout`, {
                method: 'POST',
                headers: this.getAuthHeader(),
            });
        } catch (error) {
            console.error('Logout error:', error);
        }

        this.clearAuth();
    },

    // Get current user from server
    async getCurrentUser() {
        const response = await fetch(`${API_BASE}/me`, {
            headers: this.getAuthHeader(),
        });

        if (!response.ok) {
            if (response.status === 401) {
                this.clearAuth();
            }
            throw new Error('Failed to get user');
        }

        const data = await response.json();
        // Update stored user
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
    },

    // Change password
    async changePassword(currentPassword, newPassword) {
        const response = await fetch(`${API_BASE}/change-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
            },
            body: JSON.stringify({ currentPassword, newPassword }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to change password');
        }

        return data;
    },

    // Validate token (useful on app startup)
    async validateToken() {
        if (!this.isLoggedIn()) {
            return false;
        }

        try {
            await this.getCurrentUser();
            return true;
        } catch (error) {
            this.clearAuth();
            return false;
        }
    },
};

export default authService;
