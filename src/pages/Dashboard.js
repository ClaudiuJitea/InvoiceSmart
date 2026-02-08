// Dashboard Page
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { clientService } from '../db/services/clientService.js';
import { invoiceService } from '../db/services/invoiceService.js';
import { settingsService } from '../db/services/settingsService.js';
import { router } from '../router.js';

export function renderDashboard() {
  return `
    <div class="dashboard-page">
      <!-- Animated background -->
      <div class="dashboard-bg">
        <div class="dashboard-bg-gradient"></div>
        <div class="dashboard-bg-orb dashboard-bg-orb-1"></div>
        <div class="dashboard-bg-orb dashboard-bg-orb-2"></div>
        <div class="dashboard-bg-orb dashboard-bg-orb-3"></div>
      </div>

      <div class="dashboard-content">
        <!-- Welcome Section -->
        <div class="dashboard-header">
          <div class="dashboard-header-left">
            <h1 class="dashboard-title">${t('dashboard.title')}</h1>
            <p class="dashboard-subtitle">${t('dashboard.subtitle')}</p>
          </div>
          <div class="dashboard-header-actions">
            <a href="#/clients/new" class="dashboard-action-btn dashboard-action-secondary">
              <span class="action-icon">${icons.plus}</span>
              <span class="action-text">${t('dashboard.newClient')}</span>
            </a>
            <a href="#/invoices/new" class="dashboard-action-btn dashboard-action-primary">
              <span class="action-icon">${icons.plus}</span>
              <span class="action-text">${t('dashboard.newInvoice')}</span>
            </a>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="dashboard-stats">
          <div class="dashboard-stat-card dashboard-stat-invoices">
            <div class="stat-card-glow"></div>
            <div class="stat-card-content">
              <div class="stat-icon-wrapper stat-icon-blue">
                <div class="stat-icon-bg"></div>
                ${icons.invoice}
              </div>
              <div class="stat-info">
                <span class="stat-label">${t('dashboard.totalInvoices')}</span>
                <div class="stat-value-row">
                  <span class="stat-number" id="dashboard-total-invoices">
                    <span class="stat-loading"></span>
                  </span>
                </div>
              </div>
            </div>
            <div class="stat-card-decoration"></div>
          </div>

          <div class="dashboard-stat-card dashboard-stat-clients">
            <div class="stat-card-glow"></div>
            <div class="stat-card-content">
              <div class="stat-icon-wrapper stat-icon-indigo">
                <div class="stat-icon-bg"></div>
                ${icons.clients}
              </div>
              <div class="stat-info">
                <span class="stat-label">${t('dashboard.totalClients')}</span>
                <div class="stat-value-row">
                  <span class="stat-number" id="dashboard-total-clients">
                    <span class="stat-loading"></span>
                  </span>
                </div>
              </div>
            </div>
            <div class="stat-card-decoration"></div>
          </div>

          <div class="dashboard-stat-card dashboard-stat-revenue">
            <div class="stat-card-glow"></div>
            <div class="currency-dropdown" id="currency-dropdown">
              <button class="currency-dropdown-trigger" id="currency-dropdown-trigger" type="button">
                <span id="currency-dropdown-value">EUR</span>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M2.5 4L5 6.5L7.5 4"/>
                </svg>
              </button>
              <div class="currency-dropdown-menu" id="currency-dropdown-menu">
                <!-- Options will be populated by JS -->
              </div>
            </div>
            <div class="stat-card-content">
              <div class="stat-icon-wrapper stat-icon-emerald">
                <div class="stat-icon-bg"></div>
                ${icons.money}
              </div>
              <div class="stat-info">
                <span class="stat-label" id="revenue-label">TOTAL IN <span id="revenue-label-currency">EUR</span></span>
                <div class="stat-value-row">
                  <span class="stat-number stat-number-sm" id="dashboard-total-revenue">
                    <span class="stat-loading"></span>
                  </span>
                </div>
              </div>

            </div>
            <div class="stat-card-decoration"></div>
          </div>




          <div class="dashboard-stat-card dashboard-stat-pending">
            <div class="stat-card-glow"></div>
            <div class="stat-card-content">
              <div class="stat-icon-wrapper stat-icon-amber">
                <div class="stat-icon-bg"></div>
                ${icons.clock}
              </div>
              <div class="stat-info">
                <span class="stat-label">${t('dashboard.pendingInvoices')}</span>
                <div class="stat-value-row">
                  <span class="stat-number" id="dashboard-pending-invoices">
                    <span class="stat-loading"></span>
                  </span>
                </div>
              </div>
            </div>
            <div class="stat-card-decoration"></div>
          </div>
        </div>

        <!-- Recent Invoices Section -->
        <div class="dashboard-invoices-section">
          <div class="section-header">
            <div class="section-title-group">
              <h2 class="section-title">${t('dashboard.recentInvoices')}</h2>
              <span class="section-badge" id="invoice-count-badge">0</span>
            </div>
            <a href="#/invoices" class="section-link">
              <span>${t('actions.view')}</span>
              ${icons.chevronRight}
            </a>
          </div>
          <div class="invoices-table-wrapper" id="dashboard-recent-invoices">
            <div class="table-loading">
              <div class="table-loading-row"></div>
              <div class="table-loading-row"></div>
              <div class="table-loading-row"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function initDashboard() {
  try {
    const settings = await settingsService.get();
    const defaultCurrency = settings?.default_currency || 'EUR';

    // Fetch stats in parallel
    const [totalInvoices, totalClients, pendingInvoices, availableCurrencies] = await Promise.all([
      invoiceService.getCount(),
      clientService.getCount(),
      invoiceService.getPendingCount(),
      fetchAvailableCurrencies()
    ]);

    // Update stats
    const updateEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    updateEl('dashboard-total-invoices', totalInvoices);
    updateEl('dashboard-total-clients', totalClients);
    updateEl('dashboard-pending-invoices', pendingInvoices);

    // Setup custom currency dropdown
    const dropdown = document.getElementById('currency-dropdown');
    const trigger = document.getElementById('currency-dropdown-trigger');
    const menu = document.getElementById('currency-dropdown-menu');
    const valueSpan = document.getElementById('currency-dropdown-value');

    if (dropdown && trigger && menu && availableCurrencies.length > 0) {
      // Set initial value
      const initialCurrency = availableCurrencies.includes(defaultCurrency) ? defaultCurrency : availableCurrencies[0];
      valueSpan.textContent = initialCurrency;

      // Populate dropdown menu
      menu.innerHTML = availableCurrencies.map(c => `
        <button class="currency-dropdown-item ${c === initialCurrency ? 'active' : ''}" data-currency="${c}" type="button">
          ${c}
        </button>
      `).join('');

      // Load initial revenue
      await updateRevenueDisplay(initialCurrency);

      // Toggle dropdown on trigger click
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });

      // Handle option selection
      menu.addEventListener('click', async (e) => {
        const item = e.target.closest('.currency-dropdown-item');
        if (item) {
          const currency = item.dataset.currency;
          valueSpan.textContent = currency;

          // Update active state
          menu.querySelectorAll('.currency-dropdown-item').forEach(i => i.classList.remove('active'));
          item.classList.add('active');

          dropdown.classList.remove('open');
          await updateRevenueDisplay(currency);
        }
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });
    } else {
      // Fallback if no currencies available
      await updateRevenueDisplay(defaultCurrency);
    }

    // Fetch and render recent invoices
    const recentInvoices = await invoiceService.getRecent(5);
    renderRecentInvoices(recentInvoices, defaultCurrency, settings);

  } catch (error) {
    console.error('Error loading dashboard data:', error);
  }
}


// Helper to fetch available currencies
async function fetchAvailableCurrencies() {
  try {
    const response = await fetch('/api/stats/available-currencies');
    if (!response.ok) return ['EUR', 'RON', 'USD'];
    return response.json();
  } catch {
    return ['EUR', 'RON', 'USD'];
  }
}

// Helper to update revenue display based on selected currency
async function updateRevenueDisplay(currency) {
  const revenueEl = document.getElementById('dashboard-total-revenue');
  const labelCurrencyEl = document.getElementById('revenue-label-currency');

  if (!revenueEl) return;

  // Update label currency
  if (labelCurrencyEl) {
    labelCurrencyEl.textContent = currency;
  }

  // Show loading state
  revenueEl.innerHTML = '<span class="stat-loading"></span>';

  try {
    const revenueData = await invoiceService.getRevenueByCurrency(currency);
    const formattedAmount = Number(revenueData.totalRevenue || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    revenueEl.textContent = formattedAmount;
  } catch (error) {
    console.error('Error fetching revenue:', error);
    revenueEl.textContent = '0.00';
  }
}





function renderRecentInvoices(invoices, currency, settings) {
  const container = document.getElementById('dashboard-recent-invoices');
  const badge = document.getElementById('invoice-count-badge');
  if (!container) return;

  // Update badge
  if (badge) {
    badge.textContent = invoices.length;
  }

  if (invoices.length === 0) {
    container.innerHTML = `
      <div class="dashboard-empty-state">
        <div class="empty-illustration">
          <div class="empty-icon-wrapper">
            ${icons.emptyInvoice}
          </div>
        </div>
        <h3 class="empty-title">${t('invoices.emptyTitle')}</h3>
        <p class="empty-description">${t('invoices.emptyDescription')}</p>
        <a href="#/invoices/new" class="btn btn-filled btn-lg">
          ${icons.plus}
          ${t('invoices.newInvoice')}
        </a>
      </div>
    `;
    return;
  }

  const getStatusConfig = (status) => {
    const statusMap = {
      draft: { class: 'status-draft', text: t('invoices.statusDraft'), icon: '📝' },
      sent: { class: 'status-sent', text: t('invoices.statusSent'), icon: '📤' },
      paid: { class: 'status-paid', text: t('invoices.statusPaid'), icon: '✓' },
      overdue: { class: 'status-overdue', text: t('invoices.statusOverdue'), icon: '⚠️' },
      cancelled: { class: 'status-cancelled', text: t('invoices.statusCancelled'), icon: '✕' },
    };
    return statusMap[status] || statusMap.draft;
  };

  const invoiceRows = invoices.map((invoice, index) => {
    const status = getStatusConfig(invoice.status);
    const formattedDate = new Date(invoice.issue_date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <div class="invoice-row" style="animation-delay: ${index * 0.05}s">
        <div class="invoice-row-main">
          <div class="invoice-info">
            <a href="#/invoices/${invoice.id}" class="invoice-number-link">
              <span class="invoice-number">${invoice.invoice_number}</span>
              <span class="invoice-arrow">→</span>
            </a>
            <span class="invoice-client">${invoice.client_name || 'Unknown Client'}</span>
          </div>
          <div class="invoice-meta">
            <span class="invoice-date">${formattedDate}</span>
            <span class="invoice-status ${status.class}">${status.text}</span>
            <span class="invoice-amount">
              <span class="amount-primary">${Number(invoice.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${invoice.currency}</span>
              ${invoice.total_secondary ? `<span class="amount-secondary">${Number(invoice.total_secondary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${invoice.secondary_currency}</span>` : ''}
            </span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="invoices-list">
      ${invoiceRows}
    </div>
  `;
}

// Premium Dashboard Styles
const dashboardStyles = document.createElement('style');
dashboardStyles.textContent = `
  /* ========================================
     Dashboard Page - Premium Design
     ======================================== */

  .dashboard-page {
    position: relative;
    min-height: 100vh;
    padding: var(--space-8);
    overflow: hidden;
  }

  /* Animated Background */
  .dashboard-bg {
    position: fixed;
    top: 0;
    left: var(--sidebar-width);
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .dashboard-bg-gradient {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e8eef5 100%);
  }

  .dashboard-bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    animation: float 20s ease-in-out infinite;
  }

  .dashboard-bg-orb-1 {
    width: 600px;
    height: 600px;
    background: linear-gradient(135deg, rgba(30, 58, 95, 0.06) 0%, rgba(59, 130, 246, 0.04) 100%);
    top: -200px;
    right: -100px;
    animation-delay: 0s;
  }

  .dashboard-bg-orb-2 {
    width: 400px;
    height: 400px;
    background: linear-gradient(135deg, rgba(90, 108, 125, 0.06) 0%, rgba(30, 58, 95, 0.04) 100%);
    bottom: -100px;
    left: 10%;
    animation-delay: -7s;
  }

  .dashboard-bg-orb-3 {
    width: 300px;
    height: 300px;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(30, 58, 95, 0.03) 100%);
    top: 40%;
    right: 20%;
    animation-delay: -14s;
  }

  @keyframes float {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
    33% {
      transform: translate(30px, -30px) scale(1.05);
    }
    66% {
      transform: translate(-20px, 20px) scale(0.95);
    }
  }

  .dashboard-content {
    position: relative;
    z-index: 1;
    max-width: 1400px;
    margin: 0 auto;
  }

  /* Dashboard Header */
  .dashboard-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: var(--space-8);
    gap: var(--space-6);
    flex-wrap: wrap;
  }

  .dashboard-header-left {
    flex: 1;
  }

  .dashboard-title {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 700;
    color: var(--md-primary);
    margin: 0 0 var(--space-2) 0;
    letter-spacing: -0.01em;
  }

  .dashboard-subtitle {
    color: var(--md-on-surface-variant);
    font-size: var(--text-body-lg);
    margin: 0;
  }

  .dashboard-header-actions {
    display: flex;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  /* Action Buttons */
  .dashboard-action-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-5);
    border-radius: var(--radius-full);
    font-weight: 600;
    font-size: var(--text-body-md);
    text-decoration: none;
    transition: all var(--transition-standard);
    cursor: pointer;
    border: none;
  }

  .dashboard-action-btn .action-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dashboard-action-btn .action-icon svg {
    width: 18px;
    height: 18px;
  }

  .dashboard-action-primary {
    background: linear-gradient(135deg, var(--md-primary) 0%, #2a4f7c 100%);
    color: white;
    box-shadow: 0 4px 14px rgba(30, 58, 95, 0.25), 0 2px 4px rgba(30, 58, 95, 0.15);
  }

  .dashboard-action-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(30, 58, 95, 0.3), 0 4px 8px rgba(30, 58, 95, 0.2);
  }

  .dashboard-action-secondary {
    background: rgba(255, 255, 255, 0.8);
    color: var(--md-primary);
    border: 1px solid var(--md-outline-variant);
    backdrop-filter: blur(10px);
  }

  .dashboard-action-secondary:hover {
    background: white;
    border-color: var(--md-primary);
    box-shadow: 0 4px 12px rgba(30, 58, 95, 0.1);
    transform: translateY(-2px);
  }

  /* Stats Grid */
  .dashboard-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-5);
    margin-bottom: var(--space-8);
  }

  @media (max-width: 1200px) {
    .dashboard-stats {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 640px) {
    .dashboard-stats {
      grid-template-columns: 1fr;
    }
  }

  /* Stat Cards */
  .dashboard-stat-card {
    position: relative;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(20px);
    border-radius: var(--radius-xl);
    padding: var(--space-6);
    border: 1px solid rgba(255, 255, 255, 0.5);
    overflow: hidden;
    transition: all var(--transition-standard);
    box-shadow: 0 4px 24px rgba(30, 58, 95, 0.06), 0 1px 4px rgba(30, 58, 95, 0.04);
  }

  .dashboard-stat-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 48px rgba(30, 58, 95, 0.12), 0 4px 12px rgba(30, 58, 95, 0.08);
  }

  .stat-card-glow {
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    opacity: 0;
    transition: opacity var(--transition-standard);
    pointer-events: none;
  }

  .dashboard-stat-card:hover .stat-card-glow {
    opacity: 1;
  }

  .dashboard-stat-invoices .stat-card-glow {
    background: radial-gradient(circle, rgba(30, 58, 95, 0.06) 0%, transparent 70%);
  }

  .dashboard-stat-clients .stat-card-glow {
    background: radial-gradient(circle, rgba(30, 58, 95, 0.06) 0%, transparent 70%);
  }

  .dashboard-stat-revenue .stat-card-glow {
    background: radial-gradient(circle, rgba(30, 58, 95, 0.06) 0%, transparent 70%);
  }

  .dashboard-stat-pending .stat-card-glow {
    background: radial-gradient(circle, rgba(30, 58, 95, 0.06) 0%, transparent 70%);
  }

  .stat-card-content {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    gap: var(--space-4);
  }

  .stat-icon-wrapper {
    position: relative;
    width: 56px;
    height: 56px;
    border-radius: var(--radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform var(--transition-standard);
  }

  .dashboard-stat-card:hover .stat-icon-wrapper {
    transform: scale(1.1);
  }

  .stat-icon-wrapper svg {
    width: 28px;
    height: 28px;
    position: relative;
    z-index: 1;
  }

  .stat-icon-blue {
    background: linear-gradient(135deg, var(--md-surface-container) 0%, var(--md-surface-container-high) 100%);
    color: var(--md-on-surface-variant);
  }

  .stat-icon-indigo {
    background: linear-gradient(135deg, var(--md-surface-container) 0%, var(--md-surface-container-high) 100%);
    color: var(--md-on-surface-variant);
  }

  .stat-icon-emerald {
    background: linear-gradient(135deg, var(--md-surface-container) 0%, var(--md-surface-container-high) 100%);
    color: var(--md-on-surface-variant);
  }

  .stat-icon-amber {
    background: linear-gradient(135deg, var(--md-surface-container) 0%, var(--md-surface-container-high) 100%);
    color: var(--md-on-surface-variant);
  }

  .stat-info {
    flex: 1;
    min-width: 0;
  }

  .stat-label {
    display: block;
    font-size: var(--text-body-sm);
    font-weight: 500;
    color: var(--md-on-surface-variant);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--space-2);
  }

  .stat-value-row {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
  }

  .stat-number {
    font-family: var(--font-display);
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--md-on-surface);
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .stat-number-sm {
    font-size: 1.5rem;
  }

  /* Multi-currency revenue display */
  .revenue-primary {
    display: block;
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--md-on-surface);
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .revenue-secondary {
    display: block;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    color: var(--md-on-surface-variant);
    line-height: 1.2;
    margin-top: var(--space-1);
  }

  /* Currency selector styles */
  .dashboard-stat-revenue {
    position: relative;
  }

  .currency-dropdown {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    z-index: 10;
  }

  .currency-dropdown-trigger {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    background: linear-gradient(135deg, var(--md-primary) 0%, #2a4f7c 100%);
    border: none;
    border-radius: var(--radius-full);
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-label-sm);
    font-weight: 700;
    color: white;
    cursor: pointer;
    transition: all var(--transition-fast);
    box-shadow: 0 2px 8px rgba(30, 58, 95, 0.25);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .currency-dropdown-trigger svg {
    width: 10px;
    height: 10px;
    transition: transform var(--transition-fast);
  }

  .currency-dropdown.open .currency-dropdown-trigger svg {
    transform: rotate(180deg);
  }

  .currency-dropdown-trigger:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(30, 58, 95, 0.35);
  }

  .currency-dropdown-trigger:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.2), 0 4px 12px rgba(30, 58, 95, 0.35);
  }

  .currency-dropdown-menu {
    position: absolute;
    top: calc(100% + var(--space-2));
    right: 0;
    min-width: 80px;
    background: white;
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 20px rgba(30, 58, 95, 0.15), 0 2px 8px rgba(30, 58, 95, 0.1);
    padding: var(--space-1);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-8px);
    transition: all var(--transition-fast);
    border: 1px solid var(--md-outline-variant);
  }

  .currency-dropdown.open .currency-dropdown-menu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .currency-dropdown-item {
    display: block;
    width: 100%;
    padding: var(--space-2) var(--space-3);
    background: transparent;
    border: none;
    border-radius: var(--radius-md);
    font-size: var(--text-body-sm);
    font-weight: 600;
    color: var(--md-on-surface);
    cursor: pointer;
    transition: all var(--transition-fast);
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .currency-dropdown-item:hover {
    background: var(--md-surface-container-high);
    color: var(--md-primary);
  }

  .currency-dropdown-item.active {
    background: var(--md-primary-container);
    color: var(--md-primary);
  }

  .stat-currency-badge {
    font-size: var(--text-body-sm);
    font-weight: 600;
    color: var(--md-on-surface-variant);
    margin-left: var(--space-1);
  }


  .stat-loading {
    display: inline-block;
    width: 60px;
    height: 32px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: var(--radius-sm);
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .stat-card-decoration {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 120px;
    height: 120px;
    background: linear-gradient(135deg, transparent 50%, rgba(0, 0, 0, 0.02) 100%);
    border-radius: var(--radius-xl);
    pointer-events: none;
  }

  /* Invoices Section */
  .dashboard-invoices-section {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: var(--radius-2xl);
    border: 1px solid rgba(255, 255, 255, 0.5);
    overflow: hidden;
    box-shadow: 0 4px 24px rgba(30, 58, 95, 0.06), 0 1px 4px rgba(30, 58, 95, 0.04);
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-5) var(--space-6);
    border-bottom: 1px solid var(--md-outline-variant);
    background: linear-gradient(180deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 0) 100%);
  }

  .section-title-group {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .section-title {
    font-family: var(--font-display);
    font-size: var(--text-title-lg);
    font-weight: 600;
    color: var(--md-on-surface);
    margin: 0;
  }

  .section-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 var(--space-2);
    background: linear-gradient(135deg, var(--md-primary) 0%, #2a4f7c 100%);
    color: white;
    font-size: var(--text-label-sm);
    font-weight: 700;
    border-radius: var(--radius-full);
  }

  .section-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--md-primary);
    font-weight: 600;
    font-size: var(--text-body-md);
    text-decoration: none;
    transition: all var(--transition-fast);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-full);
  }

  .section-link:hover {
    background: var(--md-primary-container);
  }

  .section-link svg {
    width: 16px;
    height: 16px;
    transition: transform var(--transition-fast);
  }

  .section-link:hover svg {
    transform: translateX(4px);
  }

  .invoices-table-wrapper {
    padding: var(--space-4);
  }

  /* Table Loading State */
  .table-loading {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .table-loading-row {
    height: 64px;
    background: linear-gradient(90deg, #f5f5f5 25%, #eeeeee 50%, #f5f5f5 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: var(--radius-md);
  }

  /* Invoice List */
  .invoices-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .invoice-row {
    background: var(--md-surface);
    border-radius: var(--radius-lg);
    transition: all var(--transition-fast);
    animation: fadeSlideIn 0.4s ease forwards;
    opacity: 0;
    transform: translateY(10px);
  }

  @keyframes fadeSlideIn {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .invoice-row:hover {
    background: rgba(30, 58, 95, 0.03);
    box-shadow: 0 2px 8px rgba(30, 58, 95, 0.06);
  }

  .invoice-row-main {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-5);
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .invoice-info {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .invoice-number-link {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    text-decoration: none;
    transition: all var(--transition-fast);
  }

  .invoice-number-link:hover .invoice-number {
    color: var(--md-primary);
  }

  .invoice-number-link:hover .invoice-arrow {
    opacity: 1;
    transform: translateX(0);
  }

  .invoice-number {
    font-weight: 700;
    font-size: var(--text-body-lg);
    color: var(--md-on-surface);
    transition: color var(--transition-fast);
  }

  .invoice-arrow {
    opacity: 0;
    transform: translateX(-8px);
    transition: all var(--transition-fast);
    color: var(--md-primary);
    font-weight: 500;
  }

  .invoice-client {
    font-size: var(--text-body-sm);
    color: var(--md-on-surface-variant);
  }

  .invoice-meta {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .invoice-date {
    font-size: var(--text-body-sm);
    color: var(--md-on-surface-variant);
  }

  .invoice-status {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    font-size: var(--text-label-sm);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .status-draft {
    background: var(--md-surface-container-high);
    color: var(--md-on-surface-variant);
  }

  .status-sent {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .status-paid {
    background: #d1fae5;
    color: #047857;
  }

  .status-overdue {
    background: #fee2e2;
    color: #dc2626;
  }

  .status-cancelled {
    background: #fef3c7;
    color: #b45309;
  }

  .invoice-amount {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 120px;
  }

  .amount-primary {
    font-weight: 700;
    font-size: var(--text-body-md);
    color: var(--md-on-surface);
  }

  .amount-secondary {
    font-size: var(--text-body-sm);
    color: var(--md-on-surface-variant);
  }

  /* Empty State */
  .dashboard-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-12) var(--space-6);
    text-align: center;
  }

  .empty-illustration {
    margin-bottom: var(--space-6);
  }

  .empty-icon-wrapper {
    width: 96px;
    height: 96px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-full);
    background: linear-gradient(135deg, var(--md-surface-container) 0%, var(--md-surface-container-high) 100%);
    color: var(--md-on-surface-variant);
  }

  .empty-icon-wrapper svg {
    width: 48px;
    height: 48px;
    opacity: 0.5;
  }

  .empty-title {
    font-family: var(--font-display);
    font-size: var(--text-title-lg);
    font-weight: 600;
    color: var(--md-on-surface);
    margin: 0 0 var(--space-2);
  }

  .empty-description {
    font-size: var(--text-body-md);
    color: var(--md-on-surface-variant);
    margin: 0 0 var(--space-6);
    max-width: 400px;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .dashboard-page {
      padding: var(--space-4);
    }

    .dashboard-title {
      font-size: 1.5rem;
    }

    .dashboard-header {
      flex-direction: column;
      align-items: stretch;
    }

    .dashboard-header-actions {
      justify-content: stretch;
    }

    .dashboard-action-btn {
      flex: 1;
      justify-content: center;
    }

    .invoice-row-main {
      flex-direction: column;
      align-items: stretch;
    }

    .invoice-meta {
      justify-content: flex-start;
    }

    .invoice-amount {
      align-items: flex-start;
    }
  }

  @media (max-width: 1024px) {
    .dashboard-bg {
      left: 0;
    }
  }
`;
document.head.appendChild(dashboardStyles);
