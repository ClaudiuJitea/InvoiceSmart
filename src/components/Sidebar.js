// Sidebar Component
import { t, i18n } from '../i18n/index.js';
import { router } from '../router.js';
import { icons } from './icons.js';

export function renderSidebar() {
  const currentPath = router.getPath();

  const navItems = [
    { path: '/', icon: icons.dashboard, label: 'nav.dashboard' },
    { path: '/reports', icon: icons.chart, label: 'nav.reports' },
    { path: '/invoices', icon: icons.invoice, label: 'nav.invoices' },
    { path: '/clients', icon: icons.clients, label: 'nav.clients' },
    { path: '/settings', icon: icons.settings, label: 'nav.settings' },
  ];

  const locales = i18n.getLocales();
  const currentLocale = i18n.locale;

  return `
    <aside class="sidebar">
      <!-- Decorative blur shapes -->
      <div class="sidebar-blur-shape sidebar-blur-1"></div>
      <div class="sidebar-blur-shape sidebar-blur-2"></div>
      
      <div class="sidebar-content">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <img src="/icon.png" alt="Logo" style="width: 28px; height: 28px;">
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

  if (switcherBtn && dropdown) {
    switcherBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });

    dropdown.querySelectorAll('.language-option').forEach(btn => {
      btn.addEventListener('click', () => {
        i18n.locale = btn.dataset.locale;
        dropdown.classList.remove('open');
        // Re-render the entire app
        window.dispatchEvent(new CustomEvent('app:refresh'));
      });
    });

    document.addEventListener('click', () => {
      dropdown.classList.remove('open');
    });
  }
}
