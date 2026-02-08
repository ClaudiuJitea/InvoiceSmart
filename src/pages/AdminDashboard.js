// Admin Dashboard Page Component
import { t, i18n } from '../i18n/index.js';
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
                <h1 class="page-title">${t('admin.title')}</h1>
                <p class="page-subtitle">${t('admin.subtitle')}</p>
            </div>
            <div class="page-header-actions">
                <button class="btn btn-filled" id="addUserBtn">
                    ${icons.plus}
                    <span>${t('admin.addUser')}</span>
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
                    <span class="stat-card-label">${t('admin.totalUsers')}</span>
                    <span class="stat-card-value" id="statTotalUsers">-</span>
                </div>
            </div>
            <div class="stat-card admin-stat-card">
                <div class="stat-card-glow"></div>
                <div class="stat-card-icon stat-icon-success">
                    ${icons.check}
                </div>
                <div class="stat-card-content">
                    <span class="stat-card-label">${t('admin.activeUsers')}</span>
                    <span class="stat-card-value" id="statActiveUsers">-</span>
                </div>
            </div>
            <div class="stat-card admin-stat-card">
                <div class="stat-card-glow"></div>
                <div class="stat-card-icon stat-icon-warning">
                    ${icons.settings}
                </div>
                <div class="stat-card-content">
                    <span class="stat-card-label">${t('admin.admins')}</span>
                    <span class="stat-card-value" id="statAdmins">-</span>
                </div>
            </div>
            <div class="stat-card admin-stat-card">
                <div class="stat-card-glow"></div>
                <div class="stat-card-icon stat-icon-danger">
                    ${icons.close}
                </div>
                <div class="stat-card-content">
                    <span class="stat-card-label">${t('admin.inactive')}</span>
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
                        placeholder="${t('admin.searchPlaceholder')}"
                        value="${searchQuery}"
                    >
                </div>
                <div class="admin-filter-group">
                    <select id="roleFilter" class="input admin-filter-select">
                        <option value="">${t('admin.allRoles')}</option>
                        <option value="admin" ${roleFilter === 'admin' ? 'selected' : ''}>${t('admin.form.roleAdmin')}</option>
                        <option value="user" ${roleFilter === 'user' ? 'selected' : ''}>${t('admin.form.roleUser')}</option>
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
                            <th>${t('admin.headers.user')}</th>
                            <th>${t('admin.headers.email')}</th>
                            <th>${t('admin.headers.role')}</th>
                            <th>${t('admin.headers.status')}</th>
                            <th>${t('admin.headers.lastLogin')}</th>
                            <th class="text-right">${t('admin.headers.actions')}</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <tr>
                            <td colspan="6" class="table-loading">
                                <div class="spinner"></div>
                                <span>${t('general.loading')}</span>
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
                    <h3 class="modal-title" id="modalTitle">${t('admin.modal.addUserTitle')}</h3>
                    <button class="modal-close" data-close-modal>${icons.close}</button>
                </div>
                <form id="userForm" class="modal-content">
                    <input type="hidden" id="userId" value="">
                    
                    <div class="modal-form-grid">
                        <div class="form-group">
                            <label class="input-label" for="userUsername">${t('admin.form.username')} <span class="required-mark">*</span></label>
                            <input type="text" id="userUsername" class="input" placeholder="e.g. jdoe" required>
                        </div>
                        <div class="form-group">
                            <label class="input-label" for="userFullName">${t('admin.form.fullName')}</label>
                            <input type="text" id="userFullName" class="input" placeholder="e.g. John Doe">
                        </div>
                        
                        <div class="form-group modal-form-full">
                            <label class="input-label" for="userEmail">${t('admin.form.email')} <span class="required-mark">*</span></label>
                            <input type="email" id="userEmail" class="input" placeholder="name@company.com" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="input-label" for="userPassword">${t('admin.form.password')} <span class="required-mark">*</span></label>
                            <input type="password" id="userPassword" class="input" placeholder="${t('admin.form.passwordHint')}" minlength="6" required>
                        </div>
                        <div class="form-group">
                            <label class="input-label" for="userRole">${t('admin.form.role')} <span class="required-mark">*</span></label>
                            <select id="userRole" class="input select" required>
                                <option value="user">${t('admin.form.roleUser')}</option>
                                <option value="admin">${t('admin.form.roleAdmin')}</option>
                            </select>
                        </div>
                        
                        <div class="form-group modal-form-full" id="isActiveField" style="display: none;">
                            <label class="toggle-switch">
                                <input type="checkbox" id="userIsActive" checked>
                                <span class="toggle-label">${t('admin.form.activeAccount')}</span>
                            </label>
                        </div>
                    </div>
                </form>
                <div class="modal-actions">
                    <button type="button" class="btn btn-outlined" data-close-modal>${t('actions.cancel')}</button>
                    <button type="submit" form="userForm" class="btn btn-filled" id="saveUserBtn">
                        ${t('admin.form.saveUser')}
                    </button>
                </div>
            </div>
        </div>

        <!-- Reset Password Modal -->
        <div class="modal-overlay" id="resetPasswordModal">
            <div class="modal" style="max-width: 400px;">
                <div class="modal-header">
                    <h3 class="modal-title">${t('admin.modal.resetPasswordTitle')}</h3>
                    <button class="modal-close" data-close-modal>${icons.close}</button>
                </div>
                <form id="resetPasswordForm" class="modal-content">
                    <input type="hidden" id="resetPasswordUserId" value="">
                    <p class="mb-4 text-muted" id="resetPasswordUsername"></p>
                    
                    <div class="form-group">
                        <label class="input-label" for="newPassword">${t('admin.form.newPassword')} <span class="required-mark">*</span></label>
                        <input type="password" id="newPassword" class="input" minlength="6" required placeholder="${t('admin.form.newPasswordPlaceholder')}">
                        <span class="text-sm text-muted mt-4">${t('admin.messages.passwordLength')}</span>
                    </div>
                </form>
                <div class="modal-actions">
                    <button type="button" class="btn btn-outlined" data-close-modal>${t('actions.cancel')}</button>
                    <button type="submit" form="resetPasswordForm" class="btn btn-filled">
                        ${t('admin.form.resetPassword')}
                    </button>
                </div>
            </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div class="modal-overlay" id="deleteUserModal">
            <div class="modal" style="max-width: 400px;">
                <div class="modal-header">
                    <h3 class="modal-title">${t('admin.modal.deleteUserTitle')}</h3>
                    <button class="modal-close" data-close-modal>${icons.close}</button>
                </div>
                <div class="modal-content">
                    <input type="hidden" id="deleteUserId" value="">
                    <p class="mb-4"><span id="deleteUsername"></span></p>
                    <p class="text-error text-sm">${t('admin.messages.deleteWarning')}</p>
                </div>
                <div class="modal-actions">
                    <button type="button" class="btn btn-outlined" data-close-modal>${t('actions.cancel')}</button>
                    <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                        ${t('admin.form.deleteUser')}
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
                            <p>${t('general.noResults')}</p>
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
                        ${user.role === 'admin' ? t('admin.form.roleAdmin') : t('admin.form.roleUser')}
                    </span>
                </td>
                <td>
                    <span class="badge badge-${user.is_active ? 'success' : 'danger'}">
                        ${user.is_active ? t('admin.status.active') : t('admin.status.inactive')}
                    </span>
                </td>
                <td>${user.last_login ? formatDate(user.last_login) : t('admin.never')}</td>
                <td class="text-right">
                    <div class="table-actions">
                        <button class="btn btn-icon btn-ghost" data-action="edit" data-id="${user.id}" title="${t('actions.edit')}">
                            ${icons.edit}
                        </button>
                        <button class="btn btn-icon btn-ghost" data-action="reset-password" data-id="${user.id}" title="${t('admin.form.resetPassword')}">
                            ${icons.lock}
                        </button>
                        <button class="btn btn-icon btn-ghost btn-danger-ghost" data-action="delete" data-id="${user.id}" title="${t('actions.delete')}">
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
                    <p>${t('admin.messages.loadError')}.</p>
                    <button class="btn btn-outline btn-sm" onclick="window.location.reload()">${t('actions.refresh') || 'Retry'}</button>
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
                ${t('admin.pagination.previous')}
            </button>
            <div class="pagination-pages">
                ${pages.map(p => p === '...'
        ? '<span class="pagination-ellipsis">...</span>'
        : `<button class="pagination-page ${p === pagination.page ? 'active' : ''}" data-page="${p}">${p}</button>`
    ).join('')}
            </div>
            <button class="pagination-btn" ${pagination.page === pagination.totalPages ? 'disabled' : ''} data-page="${pagination.page + 1}">
                ${t('admin.pagination.next')}
            </button>
        </div>
        <span class="pagination-info">
            ${t('admin.pagination.showing', {
        start: (pagination.page - 1) * pagination.limit + 1,
        end: Math.min(pagination.page * pagination.limit, pagination.total),
        total: pagination.total
    })}
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
        title.textContent = t('admin.modal.editUserTitle');
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
        title.textContent = t('admin.modal.addUserTitle');
        document.getElementById('userId').value = '';
        document.getElementById('userForm').reset();
        passwordInput.required = true;
        passwordInput.placeholder = t('admin.form.passwordHint');
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
                alert(t('admin.messages.loadError') + ': ' + error.message);
            }
            break;

        case 'reset-password':
            const row = btn.closest('tr');
            const username = row.querySelector('.user-username').textContent;
            document.getElementById('resetPasswordUserId').value = userId;
            document.getElementById('resetPasswordUsername').innerHTML =
                `${t('admin.form.resetPassword')} <strong>${username}</strong>`;
            document.getElementById('newPassword').value = '';
            document.getElementById('resetPasswordModal').classList.add('open');
            break;

        case 'delete':
            const deleteRow = btn.closest('tr');
            const deleteUsername = deleteRow.querySelector('.user-name').textContent;
            document.getElementById('deleteUserId').value = userId;
            document.getElementById('deleteUsername').textContent = t('admin.messages.deleteConfirm', { name: deleteUsername });
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
            alert(t('admin.messages.passwordLength'));
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
        alert(t('admin.messages.saveError', { error: error.message }));
    }
}

async function handleResetPassword(e) {
    e.preventDefault();

    const userId = document.getElementById('resetPasswordUserId').value;
    const newPassword = document.getElementById('newPassword').value;

    if (!newPassword || newPassword.length < 6) {
        alert(t('admin.messages.passwordLength'));
        return;
    }

    try {
        await userService.resetPassword(userId, newPassword);
        closeAllModals();
        alert(t('admin.messages.resetSuccess'));
    } catch (error) {
        alert(t('admin.messages.resetError', { error: error.message }));
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
        alert(t('admin.messages.deleteError', { error: error.message }));
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
    return date.toLocaleDateString(i18n.locale === 'ro' ? 'ro-RO' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
