// Invoices List Page
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { invoiceService } from '../db/services/invoiceService.js';
import { toast } from '../components/common/Toast.js';
import { confirm } from '../components/common/Modal.js';
import { router } from '../router.js';

export function renderInvoices() {
  const invoices = invoiceService.getAll();

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

      ${invoices.length > 0 ? `
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
                      <span class="font-medium">${invoice.total.toFixed(2)} ${invoice.currency}</span>
                      ${invoice.total_secondary ? `<br><span class="text-sm text-muted">${invoice.total_secondary.toFixed(2)} ${invoice.secondary_currency}</span>` : ''}
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
      ` : `
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
      `}
    </div>
  `;
}

export function initInvoices() {
  // Preview buttons
  document.querySelectorAll('.preview-invoice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      router.navigate(`/invoices/${btn.dataset.id}/preview`);
    });
  });

  // Mark Paid buttons
  document.querySelectorAll('.mark-paid-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      invoiceService.updateStatus(parseInt(btn.dataset.id), 'paid');
      toast.success(t('invoices.saveSuccess'));
      window.dispatchEvent(new CustomEvent('app:refresh'));
    });
  });

  // Edit buttons
  document.querySelectorAll('.edit-invoice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      router.navigate(`/invoices/${btn.dataset.id}`);
    });
  });

  // Duplicate buttons
  document.querySelectorAll('.duplicate-invoice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const newId = invoiceService.duplicate(parseInt(btn.dataset.id));
      if (newId) {
        toast.success(t('invoices.saveSuccess'));
        window.dispatchEvent(new CustomEvent('app:refresh'));
      }
    });
  });

  // Delete buttons
  document.querySelectorAll('.delete-invoice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      confirm({
        title: t('actions.delete'),
        message: t('invoices.deleteConfirm'),
        confirmText: t('actions.delete'),
        cancelText: t('actions.cancel'),
        onConfirm: () => {
          invoiceService.delete(parseInt(btn.dataset.id));
          toast.success(t('invoices.deleteSuccess'));
          window.dispatchEvent(new CustomEvent('app:refresh'));
        },
      });
    });
  });
}
