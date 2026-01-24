// Sidebar Component
import { t, i18n } from '../i18n/index.js';
import { router } from '../router.js';
import { icons } from './icons.js';
import { authService } from '../db/services/authService.js';

export function renderSidebar() {
  const currentPath = router.getPath();
  const user = authService.getUser();
  const isLoggedIn = authService.isLoggedIn();
  const isAdmin = authService.isAdmin();

  const navItems = [
    { path: '/', icon: icons.dashboard, label: 'nav.dashboard' },
    { path: '/reports', icon: icons.chart, label: 'nav.reports' },
    { path: '/invoices', icon: icons.invoice, label: 'nav.invoices' },
    { path: '/clients', icon: icons.clients, label: 'nav.clients' },
    { path: '/settings', icon: icons.settings, label: 'nav.settings' },
  ];

  // Add admin dashboard if user is admin
  if (isAdmin) {
    navItems.push({ path: '/admin', icon: icons.shield, label: 'nav.admin' });
  }

  const locales = i18n.getLocales();
  const currentLocale = i18n.locale;

  return `
    <aside class="sidebar">
        <!-- Decorative blur shapes -->
        <div class="sidebar-blur-shape sidebar-blur-1"></div>
        <div class="sidebar-blur-shape sidebar-blur-2"></div>
        
        <button class="sidebar-toggle" id="sidebarToggle">
            ${icons.chevronRight}
        </button>

        <div class="sidebar-content">
            <div class="sidebar-header">
                <div class="sidebar-logo">
                    ${icons.logo}
                    <span class="sidebar-logo-text">InvoiceSmart</span>
                </div>
            </div>

            <nav class="sidebar-nav">
                ${navItems.map(item => `
                    <a href="#${item.path}" 
                       class="sidebar-nav-item ${currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path)) ? 'active' : ''}">
                        <span class="sidebar-nav-icon">${item.icon}</span>
                        <span class="sidebar-nav-label">${t(item.label)}</span>
                    </a>
                `).join('')}
            </nav>

            <div class="sidebar-footer">
                ${isLoggedIn ? `
                    <div class="sidebar-user">
                        <div class="sidebar-user-avatar">${getInitials(user?.fullName || user?.username || 'U')}</div>
                        <div class="sidebar-user-info">
                            <span class="sidebar-user-name">${escapeHtml(user?.fullName || user?.username || 'User')}</span>
                            <span class="sidebar-user-role">${user?.role === 'admin' ? 'Administrator' : 'User'}</span>
                        </div>
                        <button class="sidebar-logout-btn" id="logoutBtn" title="Sign Out">
                            ${icons.logout}
                        </button>
                    </div>
                ` : `
                    <a href="#/login" class="sidebar-nav-item sidebar-login-btn">
                        <span class="sidebar-nav-icon">${icons.login}</span>
                        <span class="sidebar-nav-label">Sign In</span>
                    </a>
                `}

                <div class="language-switcher">
                    <button class="language-switcher-btn" id="languageSwitcherBtn">
                        ${icons.globe}
                        <span>${locales.find(l => l.code === currentLocale)?.flag}</span>
                    </button>
                    <div class="language-dropdown" id="languageDropdown">
                        ${locales.map(locale => `
                            <button class="language-option ${locale.code === currentLocale ? 'active' : ''}" 
                                    data-locale="${locale.code}">
                                <span class="language-flag">${locale.flag}</span>
                                <span class="language-name">${locale.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    </aside>
    `;
}

export function initSidebar() {
  const switcherBtn = document.getElementById('languageSwitcherBtn');
  const dropdown = document.getElementById('languageDropdown');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const logoutBtn = document.getElementById('logoutBtn');

  // Sidebar toggle
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-collapsed');
      localStorage.setItem('sidebarCollapsed', document.body.classList.contains('sidebar-collapsed'));
    });
  }

  // Language switcher
  if (switcherBtn && dropdown) {
    switcherBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    dropdown.querySelectorAll('.language-option').forEach(btn => {
      btn.addEventListener('click', () => {
        i18n.locale = btn.dataset.locale;
        dropdown.classList.remove('open');
        window.dispatchEvent(new CustomEvent('app:refresh'));
      });
    });
  }

  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await authService.logout();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      router.navigate('/login');
    });
  }

  // Close dropdowns when clicking outside
  document.addEventListener('click', () => {
    dropdown?.classList.remove('open');
  });
}

function getInitials(name) {
  if (!name) return 'U';
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
