// Admin Dashboard Page Component
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { authService } from '../db/services/authService.js';
import { userService } from '../db/services/userService.js';
import { router } from '../router.js';
import { CustomSelect } from '../components/common/CustomSelect.js';

let currentPage = 1;
let searchQuery = '';
let roleFilter = '';

export function renderAdminDashboard() {
    return `
    <div class="page admin-dashboard">
        <div class="page-header-row">
            <div class="page-header-left">
                <h1 class="page-title">User Management</h1>
                <p class="page-subtitle">Manage system users and permissions</p>
            </div>
            <div class="page-header-actions">
                <button class="btn btn-filled" id="addUserBtn">
                    ${icons.plus}
                    <span>Add User</span>
                </button>
            </div>
        </div>

        <!-- Stats Cards -->
        <div class="admin-stats-grid" id="adminStats">
            <div class="stat-card admin-stat-card">
                <div class="stat-card-glow"></div>
                <div class="stat-card-icon stat-icon-primary">
                    ${icons.clients}
                </div>
                <div class="stat-card-content">
                    <span class="stat-card-label">Total Users</span>
                    <span class="stat-card-value" id="statTotalUsers">-</span>
                </div>
            </div>
            <div class="stat-card admin-stat-card">
                <div class="stat-card-glow"></div>
                <div class="stat-card-icon stat-icon-success">
                    ${icons.check}
                </div>
                <div class="stat-card-content">
                    <span class="stat-card-label">Active Users</span>
                    <span class="stat-card-value" id="statActiveUsers">-</span>
                </div>
            </div>
            <div class="stat-card admin-stat-card">
                <div class="stat-card-glow"></div>
                <div class="stat-card-icon stat-icon-warning">
                    ${icons.settings}
                </div>
                <div class="stat-card-content">
                    <span class="stat-card-label">Admins</span>
                    <span class="stat-card-value" id="statAdmins">-</span>
                </div>
            </div>
            <div class="stat-card admin-stat-card">
                <div class="stat-card-glow"></div>
                <div class="stat-card-icon stat-icon-danger">
                    ${icons.close}
                </div>
                <div class="stat-card-content">
                    <span class="stat-card-label">Inactive</span>
                    <span class="stat-card-value" id="statInactiveUsers">-</span>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="admin-filters card">
            <div class="admin-filters-row">
                <div class="search-container admin-search">
                    <span class="search-icon">${icons.search}</span>
                    <input 
                        type="text" 
                        id="userSearch" 
                        class="search-input" 
                        placeholder="Search users..."
                        value="${searchQuery}"
                    >
                </div>
                <div class="admin-filter-group">
                    <select id="roleFilter" class="input admin-filter-select">
                        <option value="">All Roles</option>
                        <option value="admin" ${roleFilter === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="user" ${roleFilter === 'user' ? 'selected' : ''}>User</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Users Table -->
        <div class="card">
            <div class="card-body table-wrapper">
                <table class="table admin-users-table" id="usersTable">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Last Login</th>
                            <th class="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr>
                            <td colspan="6" class="table-loading">
                                <div class="spinner"></div>
                                <span>Loading users...</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination -->
            <div class="table-pagination" id="usersPagination"></div>
        </div>

        <!-- User Modal -->
        <div class="modal-overlay" id="userModal">
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title" id="modalTitle">Add User</h3>
                    <button class="modal-close" data-close-modal>${icons.close}</button>
                </div>
                <form id="userForm" class="modal-content">
                    <input type="hidden" id="userId" value="">
                    
                    <div class="modal-form-grid">
                        <div class="form-group">
                            <label class="input-label" for="userUsername">Username <span class="required-mark">*</span></label>
                            <input type="text" id="userUsername" class="input" placeholder="e.g. jdoe" required>
                        </div>
                        <div class="form-group">
                            <label class="input-label" for="userFullName">Full Name</label>
                            <input type="text" id="userFullName" class="input" placeholder="e.g. John Doe">
                        </div>
                        
                        <div class="form-group modal-form-full">
                            <label class="input-label" for="userEmail">Email <span class="required-mark">*</span></label>
                            <input type="email" id="userEmail" class="input" placeholder="name@company.com" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="input-label" for="userPassword">Password <span class="required-mark">*</span></label>
                            <input type="password" id="userPassword" class="input" placeholder="At least 6 chars" minlength="6" required>
                        </div>
                        <div class="form-group">
                            <label class="input-label" for="userRole">Role <span class="required-mark">*</span></label>
                            <select id="userRole" class="input select" required>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        
                        <div class="form-group modal-form-full" id="isActiveField" style="display: none;">
                            <label class="toggle-switch">
                                <input type="checkbox" id="userIsActive" checked>
                                <span class="toggle-label">Active Account</span>
                            </label>
                        </div>
                    </div>
                </form>
                <div class="modal-actions">
                    <button type="button" class="btn btn-outlined" data-close-modal>Cancel</button>
                    <button type="submit" form="userForm" class="btn btn-filled" id="saveUserBtn">
                        Save User
                    </button>
                </div>
            </div>
        </div>

        <!-- Reset Password Modal -->
        <div class="modal-overlay" id="resetPasswordModal">
            <div class="modal" style="max-width: 400px;">
                <div class="modal-header">
                    <h3 class="modal-title">Reset Password</h3>
                    <button class="modal-close" data-close-modal>${icons.close}</button>
                </div>
                <form id="resetPasswordForm" class="modal-content">
                    <input type="hidden" id="resetPasswordUserId" value="">
                    <p class="mb-4 text-muted" id="resetPasswordUsername"></p>
                    
                    <div class="form-group">
                        <label class="input-label" for="newPassword">New Password <span class="required-mark">*</span></label>
                        <input type="password" id="newPassword" class="input" minlength="6" required placeholder="Enter new password">
                        <span class="text-sm text-muted mt-4">Minimum 6 characters</span>
                    </div>
                </form>
                <div class="modal-actions">
                    <button type="button" class="btn btn-outlined" data-close-modal>Cancel</button>
                    <button type="submit" form="resetPasswordForm" class="btn btn-filled">
                        Reset Password
                    </button>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div class="modal-overlay" id="deleteUserModal">
            <div class="modal" style="max-width: 400px;">
                <div class="modal-header">
                    <h3 class="modal-title">Delete User</h3>
                    <button class="modal-close" data-close-modal>${icons.close}</button>
                </div>
                <div class="modal-content">
                    <input type="hidden" id="deleteUserId" value="">
                    <p class="mb-4">Are you sure you want to delete <strong id="deleteUsername"></strong>?</p>
                    <p class="text-error text-sm">This action cannot be undone.</p>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-outlined" data-close-modal>Cancel</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                        Delete User
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
}

export async function initAdminDashboard() {
    // Check if user is admin
    if (!authService.isAdmin()) {
        router.navigate('/');
        return;
    }

    // Load initial data
    await loadStats();
    await loadUsers();

    // Setup event listeners
    setupEventListeners();

    // Initialize Custom Selects
    document.querySelectorAll('.admin-dashboard select').forEach(el => {
        new CustomSelect(el);
    });
}

async function loadStats() {
    try {
        const stats = await userService.getStats();

        document.getElementById('statTotalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('statActiveUsers').textContent = stats.activeUsers || 0;
        document.getElementById('statAdmins').textContent = stats.adminUsers || 0;
        document.getElementById('statInactiveUsers').textContent = stats.inactiveUsers || 0;
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

async function loadUsers() {
    const tbody = document.getElementById('usersTableBody');

    try {
        const result = await userService.getAll({
            page: currentPage,
            limit: 10,
            search: searchQuery,
            role: roleFilter
        });

        if (result.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="table-empty">
                        <div class="empty-state">
                            ${icons.clients}
                            <p>No users found</p>
                        </div>
                    </td>
                </tr>
            `;
            document.getElementById('usersPagination').innerHTML = '';
            return;
        }

        tbody.innerHTML = result.users.map(user => `
            <tr data-user-id="${user.id}">
                <td>
                    <div class="user-cell">
                        <div class="user-avatar">${getInitials(user.full_name || user.username)}</div>
                        <div class="user-info">
                            <span class="user-name">${escapeHtml(user.full_name || user.username)}</span>
                            <span class="user-username">@${escapeHtml(user.username)}</span>
                        </div>
                    </div>
                </td>
                <td>${escapeHtml(user.email)}</td>
                <td>
                    <span class="badge badge-${user.role === 'admin' ? 'primary' : 'secondary'}">
                        ${user.role}
                    </span>
                </td>
                <td>
                    <span class="badge badge-${user.is_active ? 'success' : 'danger'}">
                        ${user.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${user.last_login ? formatDate(user.last_login) : 'Never'}</td>
                <td class="text-right">
                    <div class="table-actions">
                        <button class="btn btn-icon btn-ghost" data-action="edit" data-id="${user.id}" title="Edit">
                            ${icons.edit}
                        </button>
                        <button class="btn btn-icon btn-ghost" data-action="reset-password" data-id="${user.id}" title="Reset Password">
                            ${icons.lock}
                        </button>
                        <button class="btn btn-icon btn-ghost btn-danger-ghost" data-action="delete" data-id="${user.id}" title="Delete">
                            ${icons.trash}
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Render pagination
        renderPagination(result.pagination);

        // Add row action listeners
        tbody.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', handleUserAction);
        });

    } catch (error) {
        console.error('Failed to load users:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="table-error">
                    <p>Failed to load users. Please try again.</p>
                    <button class="btn btn-outline btn-sm" onclick="window.location.reload()">Retry</button>
                </td>
            </tr>
        `;
    }
}

function renderPagination(pagination) {
    const container = document.getElementById('usersPagination');

    if (pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const pages = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (
            i === 1 ||
            i === pagination.totalPages ||
            (i >= pagination.page - 1 && i <= pagination.page + 1)
        ) {
            pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
            pages.push('...');
        }
    }

    container.innerHTML = `
        <div class="pagination">
            <button class="pagination-btn" ${pagination.page === 1 ? 'disabled' : ''} data-page="${pagination.page - 1}">
                Previous
            </button>
            <div class="pagination-pages">
                ${pages.map(p => p === '...'
        ? '<span class="pagination-ellipsis">...</span>'
        : `<button class="pagination-page ${p === pagination.page ? 'active' : ''}" data-page="${p}">${p}</button>`
    ).join('')}
            </div>
            <button class="pagination-btn" ${pagination.page === pagination.totalPages ? 'disabled' : ''} data-page="${pagination.page + 1}">
                Next
            </button>
        </div>
        <span class="pagination-info">
            Showing ${(pagination.page - 1) * pagination.limit + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}
        </span>
    `;

    container.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            loadUsers();
        });
    });
}

function setupEventListeners() {
    // Add user button
    document.getElementById('addUserBtn')?.addEventListener('click', () => openUserModal());

    // Search
    const searchInput = document.getElementById('userSearch');
    let searchTimeout;
    searchInput?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = e.target.value;
            currentPage = 1;
            loadUsers();
        }, 300);
    });

    // Role filter
    document.getElementById('roleFilter')?.addEventListener('change', (e) => {
        roleFilter = e.target.value;
        currentPage = 1;
        loadUsers();
    });

    // User form submission
    document.getElementById('userForm')?.addEventListener('submit', handleUserSubmit);

    // Reset password form
    document.getElementById('resetPasswordForm')?.addEventListener('submit', handleResetPassword);

    // Delete confirmation
    document.getElementById('confirmDeleteBtn')?.addEventListener('click', handleDeleteUser);

    // Modal close buttons
    document.querySelectorAll('[data-close-modal]').forEach(el => {
        el.addEventListener('click', closeAllModals);
    });

    // Close modal when clicking on overlay (outside the modal)
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            // Only close if clicking directly on the overlay, not the modal content
            if (e.target === overlay) {
                closeAllModals();
            }
        });
    });
}

function openUserModal(user = null) {
    const modal = document.getElementById('userModal');
    const title = document.getElementById('modalTitle');
    const passwordFields = document.getElementById('passwordFields');
    const isActiveField = document.getElementById('isActiveField');
    const passwordInput = document.getElementById('userPassword');

    if (user) {
        title.textContent = 'Edit User';
        document.getElementById('userId').value = user.id;
        document.getElementById('userUsername').value = user.username;
        document.getElementById('userFullName').value = user.full_name || '';
        document.getElementById('userEmail').value = user.email;
        document.getElementById('userRole').value = user.role;
        document.getElementById('userIsActive').checked = user.is_active;
        passwordInput.required = false;
        passwordInput.placeholder = 'Leave empty to keep current';
        isActiveField.style.display = 'block';
    } else {
        title.textContent = 'Add User';
        document.getElementById('userId').value = '';
        document.getElementById('userForm').reset();
        passwordInput.required = true;
        passwordInput.placeholder = 'At least 6 chars';
        isActiveField.style.display = 'none';
    }

    // Trigger change event for CustomSelect
    document.getElementById('userRole').dispatchEvent(new Event('change'));

    modal.classList.add('open');
}

async function handleUserAction(e) {
    const btn = e.currentTarget;
    const action = btn.dataset.action;
    const userId = btn.dataset.id;

    switch (action) {
        case 'edit':
            try {
                const user = await userService.getById(userId);
                openUserModal(user);
            } catch (error) {
                alert('Failed to load user: ' + error.message);
            }
            break;

        case 'reset-password':
            const row = btn.closest('tr');
            const username = row.querySelector('.user-username').textContent;
            document.getElementById('resetPasswordUserId').value = userId;
            document.getElementById('resetPasswordUsername').innerHTML =
                `Reset password for <strong>${username}</strong>`;
            document.getElementById('newPassword').value = '';
            document.getElementById('resetPasswordModal').classList.add('open');
            break;

        case 'delete':
            const deleteRow = btn.closest('tr');
            const deleteUsername = deleteRow.querySelector('.user-name').textContent;
            document.getElementById('deleteUserId').value = userId;
            document.getElementById('deleteUsername').textContent = deleteUsername;
            document.getElementById('deleteUserModal').classList.add('open');
            break;
    }
}

async function handleUserSubmit(e) {
    e.preventDefault();

    const userId = document.getElementById('userId').value;
    const userData = {
        username: document.getElementById('userUsername').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        fullName: document.getElementById('userFullName').value.trim(),
        role: document.getElementById('userRole').value,
    };

    const password = document.getElementById('userPassword').value;

    if (userId) {
        // Edit mode
        userData.isActive = document.getElementById('userIsActive').checked;
    } else {
        // Create mode
        if (!password || password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        userData.password = password;
    }

    try {
        if (userId) {
            await userService.update(userId, userData);
        } else {
            await userService.create(userData);
        }

        closeAllModals();
        await loadStats();
        await loadUsers();
    } catch (error) {
        alert('Failed to save user: ' + error.message);
    }
}

async function handleResetPassword(e) {
    e.preventDefault();

    const userId = document.getElementById('resetPasswordUserId').value;
    const newPassword = document.getElementById('newPassword').value;

    if (!newPassword || newPassword.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }

    try {
        await userService.resetPassword(userId, newPassword);
        closeAllModals();
        alert('Password reset successfully');
    } catch (error) {
        alert('Failed to reset password: ' + error.message);
    }
}

async function handleDeleteUser() {
    const userId = document.getElementById('deleteUserId').value;

    try {
        await userService.delete(userId);
        closeAllModals();
        await loadStats();
        await loadUsers();
    } catch (error) {
        alert('Failed to delete user: ' + error.message);
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay.open').forEach(modal => {
        modal.classList.remove('open');
    });
}

function getInitials(name) {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
