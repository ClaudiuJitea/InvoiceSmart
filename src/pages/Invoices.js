// Invoices List Page
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { invoiceService } from '../db/services/invoiceService.js';
import { toast } from '../components/common/Toast.js';
import { confirm } from '../components/common/Modal.js';
import { router } from '../router.js';

export function renderInvoices() {
  return `
    <div class="page-container">
      <div class="page-header-row">
        <div class="page-header-left">
          <h1 class="page-title">${t('invoices.title')}</h1>
          <p class="page-subtitle">${t('invoices.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <a href="#/invoices/new" class="btn btn-filled">
            ${icons.plus}
            ${t('invoices.newInvoice')}
          </a>
        </div>
      </div>

      <div id="invoicesListContainer">
        <div class="card card-elevated" style="padding: 40px; text-align: center;">
            <div class="loading-spinner"></div>
            <p style="margin-top: 10px; color: var(--md-on-surface-variant);">Loading...</p>
        </div>
      </div>
    </div>
  `;
}

export async function initInvoices() {
  const container = document.getElementById('invoicesListContainer');

  async function loadInvoices() {
    if (!container) return;

    try {
      const invoices = await invoiceService.getAll();
      renderInvoicesList(invoices);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      container.innerHTML = `<div class="p-4 text-center text-error">Failed to load invoices</div>`;
    }
  }

  function renderInvoicesList(invoices) {
    if (invoices.length > 0) {
      container.innerHTML = `
        <div class="table-container card-elevated">
          <table class="table">
            <thead>
              <tr>
                <th>${t('invoices.date')}</th>
                <th>${t('invoices.invoiceNumber')}</th>
                <th>${t('invoices.client')}</th>
                <th>${t('invoices.status')}</th>
                <th class="text-right">${t('invoices.total')}</th>
                <th class="text-right">${t('actions.edit')}</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(invoice => {
        const status = getStatusChip(invoice.status);
        return `
                  <tr data-invoice-id="${invoice.id}">
                    <td>${new Date(invoice.issue_date).toLocaleDateString()}</td>
                    <td>
                      <a href="#/invoices/${invoice.id}" class="text-primary font-medium">
                        ${invoice.invoice_number}
                      </a>
                    </td>
                    <td>${invoice.client_name || '-'}</td>
                    <td><span class="${status.class}">${status.text}</span></td>
                    <td class="text-right">
                      <span class="font-medium">${Number(invoice.total).toFixed(2)} ${invoice.currency}</span>
                      ${invoice.total_secondary ? `<br><span class="text-sm text-muted">${Number(invoice.total_secondary).toFixed(2)} ${invoice.secondary_currency}</span>` : ''}
                    </td>
                    <td>
                      <div class="table-actions">
                        <button class="btn btn-icon preview-invoice-btn" data-id="${invoice.id}" title="${t('invoices.preview')}">
                          ${icons.eye}
                        </button>
                        ${invoice.status !== 'paid' ? `
                        <button class="btn btn-icon mark-paid-btn" data-id="${invoice.id}" title="${t('invoices.statusPaid')}">
                          ${icons.check}
                        </button>
                        ` : ''}
                        <button class="btn btn-icon edit-invoice-btn" data-id="${invoice.id}" title="${t('actions.edit')}">
                          ${icons.edit}
                        </button>
                        <button class="btn btn-icon duplicate-invoice-btn" data-id="${invoice.id}" title="${t('actions.duplicate')}">
                          ${icons.copy}
                        </button>
                        <button class="btn btn-icon delete-invoice-btn" data-id="${invoice.id}" title="${t('actions.delete')}">
                          ${icons.trash}
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
      }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="card card-elevated">
          <div class="empty-state">
            <div class="empty-state-icon">${icons.emptyInvoice}</div>
            <h3 class="empty-state-title">${t('invoices.emptyTitle')}</h3>
            <p class="empty-state-description">${t('invoices.emptyDescription')}</p>
            <a href="#/invoices/new" class="btn btn-filled">
              ${icons.plus}
              ${t('invoices.newInvoice')}
            </a>
          </div>
        </div>
      `;
    }

    attachEventListeners();
  }

  function getStatusChip(status) {
    const statusMap = {
      draft: { class: 'chip', text: t('invoices.statusDraft') },
      sent: { class: 'chip chip-primary', text: t('invoices.statusSent') },
      paid: { class: 'chip chip-success', text: t('invoices.statusPaid') },
      overdue: { class: 'chip chip-error', text: t('invoices.statusOverdue') },
      cancelled: { class: 'chip chip-warning', text: t('invoices.statusCancelled') },
    };
    return statusMap[status] || statusMap.draft;
  }

  function attachEventListeners() {
    // Preview buttons
    container.querySelectorAll('.preview-invoice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        router.navigate(`/invoices/${btn.dataset.id}/preview`);
      });
    });

    // Mark Paid buttons
    container.querySelectorAll('.mark-paid-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          await invoiceService.updateStatus(parseInt(btn.dataset.id), 'paid');
          toast.success(t('invoices.saveSuccess'));
          loadInvoices(); // Refresh list
        } catch (error) {
          toast.error('Failed to update status');
        }
      });
    });

    // Edit buttons
    container.querySelectorAll('.edit-invoice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        router.navigate(`/invoices/${btn.dataset.id}`);
      });
    });

    // Duplicate buttons
    container.querySelectorAll('.duplicate-invoice-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        try {
          const newId = await invoiceService.duplicate(parseInt(btn.dataset.id));
          if (newId) {
            toast.success(t('invoices.saveSuccess'));
            loadInvoices(); // Refresh list
          }
        } catch (error) {
          toast.error('Failed to duplicate invoice');
        }
      });
    });

    // Delete buttons
    container.querySelectorAll('.delete-invoice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        confirm({
          title: t('actions.delete'),
          message: t('invoices.deleteConfirm'),
          confirmText: t('actions.delete'),
          cancelText: t('actions.cancel'),
          onConfirm: async () => {
            try {
              await invoiceService.delete(parseInt(btn.dataset.id));
              toast.success(t('invoices.deleteSuccess'));
              loadInvoices(); // Refresh list
            } catch (error) {
              toast.error('Failed to delete invoice');
            }
          },
        });
      });
    });
  }

  // Initial load
  await loadInvoices();
}
