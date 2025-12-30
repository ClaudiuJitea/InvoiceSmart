// Dashboard Page
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { clientService } from '../db/services/clientService.js';
import { invoiceService } from '../db/services/invoiceService.js';
import { settingsService } from '../db/services/settingsService.js';
import { router } from '../router.js';

export function renderDashboard() {
    const settings = settingsService.get();
    const totalInvoices = invoiceService.getCount();
    const totalClients = clientService.getCount();
    const pendingInvoices = invoiceService.getPendingCount();
    const totalRevenue = invoiceService.getTotalRevenue(settings?.default_currency || 'EUR');
    const recentInvoices = invoiceService.getRecent(5);

    const stats = [
        {
            icon: icons.invoice,
            label: t('dashboard.totalInvoices'),
            value: totalInvoices,
            color: 'primary',
        },
        {
            icon: icons.clients,
            label: t('dashboard.totalClients'),
            value: totalClients,
            color: 'secondary',
        },
        {
            icon: icons.money,
            label: t('dashboard.totalRevenue'),
            value: `${totalRevenue.toFixed(2)} ${settings?.default_currency || 'EUR'}`,
            color: 'tertiary',
        },
        {
            icon: icons.clock,
            label: t('dashboard.pendingInvoices'),
            value: pendingInvoices,
            color: 'warning',
        },
    ];

    const getStatusChip = (status) => {
        const statusMap = {
            draft: { class: 'chip', text: t('invoices.statusDraft') },
            sent: { class: 'chip chip-primary', text: t('invoices.statusSent') },
            paid: { class: 'chip chip-success', text: t('invoices.statusPaid') },
            overdue: { class: 'chip chip-error', text: t('invoices.statusOverdue') },
            cancelled: { class: 'chip chip-warning', text: t('invoices.statusCancelled') },
        };
        return statusMap[status] || statusMap.draft;
    };

    return `
    <div class="page-container">
      <!-- Decorative background shapes -->
      <div class="dashboard-bg-shapes">
        <div class="bg-shape bg-shape-1"></div>
        <div class="bg-shape bg-shape-2"></div>
      </div>

      <div class="page-header-row">
        <div class="page-header-left">
          <h1 class="page-title">${t('dashboard.title')}</h1>
          <p class="page-subtitle">${t('dashboard.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <a href="#/clients/new" class="btn btn-tonal">
            ${icons.plus}
            ${t('dashboard.newClient')}
          </a>
          <a href="#/invoices/new" class="btn btn-filled">
            ${icons.plus}
            ${t('dashboard.newInvoice')}
          </a>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        ${stats.map(stat => `
          <div class="stat-card card-elevated">
            <div class="stat-icon stat-icon-${stat.color}">
              ${stat.icon}
            </div>
            <div class="stat-content">
              <div class="stat-label">${stat.label}</div>
              <div class="stat-value">${stat.value}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Recent Invoices -->
      <div class="card card-elevated">
        <div class="card-header">
          <h2 class="card-title">${t('dashboard.recentInvoices')}</h2>
          <a href="#/invoices" class="btn btn-text">
            ${t('actions.view')} ${icons.chevronRight}
          </a>
        </div>
        <div class="card-content">
          ${recentInvoices.length > 0 ? `
            <div class="table-container" style="background: transparent;">
              <table class="table">
                <thead>
                  <tr>
                    <th>${t('invoices.invoiceNumber')}</th>
                    <th>${t('invoices.client')}</th>
                    <th>${t('invoices.date')}</th>
                    <th>${t('invoices.status')}</th>
                    <th class="text-right">${t('invoices.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentInvoices.map(invoice => {
        const status = getStatusChip(invoice.status);
        return `
                      <tr>
                        <td>
                          <a href="#/invoices/${invoice.id}" class="text-primary font-medium">
                            ${invoice.invoice_number}
                          </a>
                        </td>
                        <td>${invoice.client_name || '-'}</td>
                        <td>${new Date(invoice.issue_date).toLocaleDateString()}</td>
                        <td><span class="${status.class}">${status.text}</span></td>
                        <td class="text-right font-medium">
                          ${invoice.total.toFixed(2)} ${invoice.currency}
                          ${invoice.total_secondary ? `<br><span class="text-sm text-muted">${invoice.total_secondary.toFixed(2)} ${invoice.secondary_currency}</span>` : ''}
                        </td>
                      </tr>
                    `;
    }).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="empty-state" style="padding: var(--space-8);">
              <div class="empty-state-icon">${icons.emptyInvoice}</div>
              <h3 class="empty-state-title">${t('invoices.emptyTitle')}</h3>
              <p class="empty-state-description">${t('invoices.emptyDescription')}</p>
              <a href="#/invoices/new" class="btn btn-filled">
                ${icons.plus}
                ${t('invoices.newInvoice')}
              </a>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

export function initDashboard() {
    // Add any dashboard-specific event handlers here
}

// Add dashboard-specific styles
const style = document.createElement('style');
style.textContent = `
  .dashboard-bg-shapes {
    position: fixed;
    top: 0;
    left: var(--sidebar-width);
    right: 0;
    bottom: 0;
    pointer-events: none;
    overflow: hidden;
    z-index: -1;
  }

  .bg-shape {
    position: absolute;
    border-radius: 100px;
    filter: blur(80px);
    opacity: 0.4;
  }

  .bg-shape-1 {
    width: 400px;
    height: 400px;
    background: var(--md-primary-container);
    top: -100px;
    right: -100px;
  }

  .bg-shape-2 {
    width: 300px;
    height: 300px;
    background: var(--md-tertiary-container);
    bottom: -50px;
    left: 200px;
  }

  .stat-icon-primary {
    background: var(--md-primary-container);
    color: var(--md-on-primary-container);
  }

  .stat-icon-secondary {
    background: var(--md-secondary-container);
    color: var(--md-on-secondary-container);
  }

  .stat-icon-tertiary {
    background: var(--md-tertiary-container);
    color: var(--md-on-tertiary-container);
  }

  .stat-icon-warning {
    background: #FFF3E0;
    color: #E65100;
  }

  @media (max-width: 1024px) {
    .dashboard-bg-shapes {
      left: 0;
    }
  }
`;
document.head.appendChild(style);
