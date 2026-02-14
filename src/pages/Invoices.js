// Invoices List Page
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { invoiceService } from '../db/services/invoiceService.js';
import { toast } from '../components/common/Toast.js';
import { confirm } from '../components/common/Modal.js';
import { router } from '../router.js';
import { renderTemplate } from '../templates/index.js';
import { exportToPdfBlob } from '../services/pdfService.js';
import { createZipBlob } from '../utils/zip.js';
import { CustomSelect } from '../components/common/CustomSelect.js';

function getSectionConfig(params = {}) {
  const isDeliveryNotes = params?.document_type === 'delivery_note';
  return {
    isDeliveryNotes,
    documentType: isDeliveryNotes ? 'delivery_note' : 'invoice',
    basePath: isDeliveryNotes ? '/delivery-notes' : '/invoices',
    title: isDeliveryNotes ? t('deliveryNotes.title') : t('invoices.title'),
    subtitle: isDeliveryNotes ? t('deliveryNotes.subtitle') : t('invoices.subtitle'),
    newLabel: isDeliveryNotes ? t('deliveryNotes.newDeliveryNote') : t('invoices.newInvoice'),
    emptyTitle: isDeliveryNotes ? t('deliveryNotes.emptyTitle') : t('invoices.emptyTitle'),
    emptyDescription: isDeliveryNotes ? t('deliveryNotes.emptyDescription') : t('invoices.emptyDescription'),
    noFilteredResults: isDeliveryNotes ? t('deliveryNotes.noFilteredResults') : t('invoices.noFilteredResults'),
    searchPlaceholder: isDeliveryNotes ? t('deliveryNotes.searchPlaceholder') : t('invoices.searchPlaceholder'),
    selectAriaLabel: (number) => isDeliveryNotes
      ? t('deliveryNotes.selectDocument', { number })
      : t('invoices.selectInvoice', { number }),
    saveSuccess: isDeliveryNotes ? t('deliveryNotes.saveSuccess') : t('invoices.saveSuccess'),
    deleteConfirm: isDeliveryNotes ? t('deliveryNotes.deleteConfirm') : t('invoices.deleteConfirm'),
    deleteSuccess: isDeliveryNotes ? t('deliveryNotes.deleteSuccess') : t('invoices.deleteSuccess'),
    zipNamePrefix: isDeliveryNotes ? 'delivery-notes' : 'invoices',
  };
}

export function renderInvoices(params = {}) {
  const section = getSectionConfig(params);

  return `
    <div class="page-container">
      <div class="page-header-row">
        <div class="page-header-left">
          <h1 class="page-title">${section.title}</h1>
          <p class="page-subtitle">${section.subtitle}</p>
        </div>
        <div class="page-header-actions" id="invoicesHeaderActions"></div>
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

export async function initInvoices(params = {}) {
  const section = getSectionConfig(params);
  const container = document.getElementById('invoicesListContainer');
  const headerActions = document.getElementById('invoicesHeaderActions');

  let currentInvoices = [];
  const selectedInvoiceIds = new Set();
  const filters = {
    invoiceNumber: '',
    client: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    totalMin: '',
    totalMax: '',
  };

  let isBulkDeleteRunning = false;
  let isBulkDownloadRunning = false;
  let statusFilterCustomSelect = null;

  function hasActiveFilters() {
    return (
      filters.invoiceNumber.trim() !== '' ||
      filters.client.trim() !== '' ||
      filters.status !== 'all' ||
      filters.dateFrom !== '' ||
      filters.dateTo !== '' ||
      filters.totalMin !== '' ||
      filters.totalMax !== ''
    );
  }

  function matchesFilters(invoice) {
    const invoiceNumber = String(invoice.invoice_number || '').toLowerCase();
    const clientName = String(invoice.client_name || '').toLowerCase();
    const invoiceNumberFilter = filters.invoiceNumber.trim().toLowerCase();
    const clientFilter = filters.client.trim().toLowerCase();
    const invoiceDate = String(invoice.issue_date || '').slice(0, 10);
    const invoiceTotal = Number(invoice.total || 0);
    const totalMin = filters.totalMin !== '' ? Number(filters.totalMin) : null;
    const totalMax = filters.totalMax !== '' ? Number(filters.totalMax) : null;

    const matchesInvoiceNumber = !invoiceNumberFilter || invoiceNumber.includes(invoiceNumberFilter);
    const matchesClient = !clientFilter || clientName.includes(clientFilter);
    const matchesStatus = filters.status === 'all' || invoice.status === filters.status;
    const matchesDateFrom = !filters.dateFrom || (invoiceDate && invoiceDate >= filters.dateFrom);
    const matchesDateTo = !filters.dateTo || (invoiceDate && invoiceDate <= filters.dateTo);
    const matchesTotalMin = totalMin === null || (!Number.isNaN(totalMin) && invoiceTotal >= totalMin);
    const matchesTotalMax = totalMax === null || (!Number.isNaN(totalMax) && invoiceTotal <= totalMax);

    return (
      matchesInvoiceNumber &&
      matchesClient &&
      matchesStatus &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesTotalMin &&
      matchesTotalMax
    );
  }

  function getFilteredInvoices() {
    return currentInvoices.filter(matchesFilters);
  }

  function getSelectedCount() {
    return selectedInvoiceIds.size;
  }

  function getSelectedInvoices() {
    return currentInvoices.filter((invoice) => selectedInvoiceIds.has(invoice.id));
  }

  function getSelectedInFilteredCount(filteredInvoices) {
    return filteredInvoices.reduce((count, invoice) => count + (selectedInvoiceIds.has(invoice.id) ? 1 : 0), 0);
  }

  function clearSelection() {
    selectedInvoiceIds.clear();
  }

  function selectAllFiltered(filteredInvoices) {
    filteredInvoices.forEach((invoice) => selectedInvoiceIds.add(invoice.id));
  }

  function clearFilteredSelection(filteredInvoices) {
    filteredInvoices.forEach((invoice) => selectedInvoiceIds.delete(invoice.id));
  }

  function toggleInvoiceSelection(invoiceId, checked) {
    if (checked) {
      selectedInvoiceIds.add(invoiceId);
      return;
    }

    selectedInvoiceIds.delete(invoiceId);
  }

  function syncSelection() {
    const availableIds = new Set(currentInvoices.map((invoice) => invoice.id));
    for (const id of Array.from(selectedInvoiceIds)) {
      if (!availableIds.has(id)) selectedInvoiceIds.delete(id);
    }
  }

  function renderHeaderActions(filteredInvoices) {
    if (!headerActions) return;

    const selectedCount = getSelectedCount();
    const selectedInFilteredCount = getSelectedInFilteredCount(filteredInvoices);
    const allFilteredSelected = filteredInvoices.length > 0 && selectedInFilteredCount === filteredInvoices.length;

    headerActions.innerHTML = `
      ${selectedCount > 0 ? `
        <div class="bulk-actions-bar">
          <span class="bulk-actions-count">${t('invoices.selectedCount', { count: selectedCount })}</span>
          ${filteredInvoices.length > 0 ? `
            <button class="btn btn-text btn-sm" id="toggleSelectAllBtn" type="button">
              ${allFilteredSelected ? t('invoices.clearSelectionInView') : t('invoices.selectAllInView')}
            </button>
          ` : ''}
          ${hasActiveFilters() && filteredInvoices.length > 0 && !allFilteredSelected ? `
            <button class="btn btn-text btn-sm" id="selectAllFilteredBtn" type="button">
              ${t('invoices.selectAllFiltered', { count: filteredInvoices.length })}
            </button>
          ` : ''}
          <button class="btn btn-tonal btn-sm" id="downloadSelectedBtn" type="button" ${isBulkDownloadRunning ? 'disabled' : ''}>
            ${icons.download}
            ${t('invoices.downloadZip')}
          </button>
          ${section.isDeliveryNotes ? `
            <button class="btn btn-filled btn-sm" id="createInvoiceFromSelectedBtn" type="button">
              ${icons.plus}
              ${t('deliveryNotes.createInvoiceFromSelected')}
            </button>
          ` : ''}
          <button class="btn btn-danger btn-sm" id="deleteSelectedBtn" type="button" ${isBulkDeleteRunning ? 'disabled' : ''}>
            ${icons.trash}
            ${t('invoices.deleteSelected')}
          </button>
          <button class="btn btn-text btn-sm" id="clearSelectionBtn" type="button">
            ${t('invoices.clearSelection')}
          </button>
        </div>
      ` : ''}
      ${currentInvoices.length > 0 ? `
        <a href="#${section.basePath}/new" class="btn btn-filled">
          ${icons.plus}
          ${section.newLabel}
        </a>
      ` : ''}
    `;

    if (selectedCount > 0) {
      const toggleSelectAllBtn = document.getElementById('toggleSelectAllBtn');
      const selectAllFilteredBtn = document.getElementById('selectAllFilteredBtn');
      const downloadSelectedBtn = document.getElementById('downloadSelectedBtn');
      const createInvoiceFromSelectedBtn = document.getElementById('createInvoiceFromSelectedBtn');
      const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
      const clearSelectionBtn = document.getElementById('clearSelectionBtn');

      toggleSelectAllBtn?.addEventListener('click', () => {
        if (allFilteredSelected) {
          clearFilteredSelection(filteredInvoices);
        } else {
          selectAllFiltered(filteredInvoices);
        }
        renderInvoicesList(getFilteredInvoices());
      });

      selectAllFilteredBtn?.addEventListener('click', () => {
        selectAllFiltered(filteredInvoices);
        renderInvoicesList(getFilteredInvoices());
      });

      downloadSelectedBtn?.addEventListener('click', async () => {
        await handleBulkDownload();
      });

      createInvoiceFromSelectedBtn?.addEventListener('click', () => {
        handleCreateInvoiceFromSelected();
      });

      deleteSelectedBtn?.addEventListener('click', () => {
        handleBulkDelete();
      });

      clearSelectionBtn?.addEventListener('click', () => {
        clearSelection();
        renderInvoicesList(getFilteredInvoices());
      });
    }
  }

  function renderInvoicesList(filteredInvoices) {
    if (statusFilterCustomSelect) {
      statusFilterCustomSelect.destroy();
      statusFilterCustomSelect = null;
    }

    renderHeaderActions(filteredInvoices);

    if (currentInvoices.length === 0) {
      container.innerHTML = `
        <div class="card card-elevated">
          <div class="empty-state">
            <div class="empty-state-icon">${icons.emptyInvoice}</div>
            <h3 class="empty-state-title">${section.emptyTitle}</h3>
            <p class="empty-state-description">${section.emptyDescription}</p>
            <a href="#${section.basePath}/new" class="btn btn-filled">
              ${icons.plus}
              ${section.newLabel}
            </a>
          </div>
        </div>
      `;
      return;
    }

    const selectedInFilteredCount = getSelectedInFilteredCount(filteredInvoices);
    const allFilteredSelected = filteredInvoices.length > 0 && selectedInFilteredCount === filteredInvoices.length;

    container.innerHTML = `
      <div class="invoices-filters-card card card-elevated">
        <div class="invoices-filters-bar">
          <div class="invoices-filter-group invoices-filter-search-group">
            <label class="invoices-filter-label" for="invoiceNumberFilterInput">${t('invoices.invoiceNumber')}</label>
            <input
              id="invoiceNumberFilterInput"
              class="invoices-filter-input"
              type="text"
              placeholder="${t('invoices.filterByNumber')}"
              value="${escapeHtml(filters.invoiceNumber)}"
            >
          </div>
          <div class="invoices-filter-group invoices-filter-search-group">
            <label class="invoices-filter-label" for="invoiceClientFilterInput">${t('invoices.client')}</label>
            <input
              id="invoiceClientFilterInput"
              class="invoices-filter-input"
              type="text"
              placeholder="${t('invoices.filterByClient')}"
              value="${escapeHtml(filters.client)}"
            >
          </div>
          <div class="invoices-filter-group invoices-filter-status-group">
            <label class="invoices-filter-label" for="invoiceStatusFilter">${t('invoices.status')}</label>
            <select id="invoiceStatusFilter" class="invoices-filter-input">
              <option value="all" ${filters.status === 'all' ? 'selected' : ''}>${t('invoices.filterStatusAll')}</option>
              <option value="draft" ${filters.status === 'draft' ? 'selected' : ''}>${t('invoices.statusDraft')}</option>
              <option value="sent" ${filters.status === 'sent' ? 'selected' : ''}>${t('invoices.statusSent')}</option>
              <option value="paid" ${filters.status === 'paid' ? 'selected' : ''}>${t('invoices.statusPaid')}</option>
              <option value="overdue" ${filters.status === 'overdue' ? 'selected' : ''}>${t('invoices.statusOverdue')}</option>
              <option value="cancelled" ${filters.status === 'cancelled' ? 'selected' : ''}>${t('invoices.statusCancelled')}</option>
            </select>
          </div>
          <div class="invoices-filter-group invoices-filter-pair">
            <label class="invoices-filter-label">${t('invoices.total')}</label>
            <div class="invoices-filter-pair-inputs">
              <input
                id="invoiceTotalMinFilter"
                class="invoices-filter-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="${t('invoices.totalMin')}"
                value="${escapeHtml(filters.totalMin)}"
                aria-label="${t('invoices.totalMin')}"
              >
              <input
                id="invoiceTotalMaxFilter"
                class="invoices-filter-input"
                type="number"
                min="0"
                step="0.01"
                placeholder="${t('invoices.totalMax')}"
                value="${escapeHtml(filters.totalMax)}"
                aria-label="${t('invoices.totalMax')}"
              >
            </div>
          </div>
          <div class="invoices-filter-group invoices-filter-pair">
            <label class="invoices-filter-label">${t('invoices.date')}</label>
            <div class="invoices-filter-pair-inputs">
              <input
                id="invoiceDateFromFilter"
                class="invoices-filter-input"
                type="date"
                value="${filters.dateFrom}"
                aria-label="${t('invoices.dateFrom')}"
              >
              <input
                id="invoiceDateToFilter"
                class="invoices-filter-input"
                type="date"
                value="${filters.dateTo}"
                aria-label="${t('invoices.dateTo')}"
              >
            </div>
          </div>
          ${hasActiveFilters() ? `
            <button class="btn btn-text btn-sm invoices-clear-filters" id="clearInvoiceFiltersBtn" type="button">
              ${t('invoices.clearFilters')}
            </button>
          ` : ''}
        </div>

      </div>

      ${filteredInvoices.length > 0 ? `
        <div class="table-container card-elevated">
          <table class="table">
            <thead>
              <tr>
                <th class="bulk-select-column">
                  <input type="checkbox" class="bulk-select-checkbox" id="selectAllInvoices" aria-label="${t('invoices.selectAllInView')}">
                </th>
                <th>${t('invoices.date')}</th>
                <th>${t('invoices.invoiceNumber')}</th>
                <th>${t('invoices.client')}</th>
                <th>${t('invoices.status')}</th>
                <th class="text-right">${t('invoices.total')}</th>
                <th class="text-right">${t('actions.edit')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredInvoices.map((invoice) => {
      const status = getStatusChip(invoice.status);
      const checked = selectedInvoiceIds.has(invoice.id) ? 'checked' : '';
      const isInvoicedDeliveryNote = section.isDeliveryNotes && Number(invoice.is_invoiced) === 1;
      const linkedNumbers = invoice.linked_invoice_numbers ? escapeHtml(invoice.linked_invoice_numbers) : '';

      return `
                  <tr data-invoice-id="${invoice.id}">
                    <td class="bulk-select-column">
                      <input type="checkbox" class="bulk-select-checkbox select-invoice-checkbox" data-id="${invoice.id}" ${checked} aria-label="${section.selectAriaLabel(invoice.invoice_number)}">
                    </td>
                    <td>${new Date(invoice.issue_date).toLocaleDateString()}</td>
                    <td>
                      <a href="#${section.basePath}/${invoice.id}" class="text-primary font-medium">
                        ${invoice.invoice_number}
                      </a>
                      ${isInvoicedDeliveryNote && linkedNumbers ? `
                        <br><span class="text-sm text-muted">${t('deliveryNotes.invoicedAs')}: ${linkedNumbers}</span>
                      ` : ''}
                    </td>
                    <td>${invoice.client_name || '-'}</td>
                    <td class="status-cell">
                      <div class="status-badges">
                        <span class="${status.class}">${status.text}</span>
                        ${isInvoicedDeliveryNote ? `<span class="chip chip-success">${t('deliveryNotes.invoiced')}</span>` : ''}
                      </div>
                    </td>
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
      ` : `
        <div class="table-container card-elevated">
          <div class="table-empty">
            <div class="table-empty-icon">${icons.search}</div>
            <p>${section.noFilteredResults}</p>
            <button class="btn btn-text" id="clearInvoiceFiltersBtn" type="button">${t('invoices.clearFilters')}</button>
          </div>
        </div>
      `}
    `;

    attachEventListeners(filteredInvoices, allFilteredSelected);
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

  async function buildInvoicePdfBlob(invoice) {
    const tempDocument = document.createElement('div');
    tempDocument.innerHTML = renderTemplate(invoice.template || 'modern', invoice);
    return exportToPdfBlob(tempDocument);
  }

  function triggerBlobDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleBulkDownload() {
    const selected = getSelectedInvoices();
    if (selected.length === 0 || isBulkDownloadRunning) return;

    isBulkDownloadRunning = true;
    renderHeaderActions(getFilteredInvoices());

    try {
      const detailedInvoices = await Promise.all(
        selected.map((invoice) => invoiceService.getById(invoice.id))
      );

      const validInvoices = detailedInvoices.filter(Boolean);
      if (validInvoices.length === 0) {
        toast.error(t('invoices.bulkDownloadFailed'));
        return;
      }

      const files = [];
      for (const invoice of validInvoices) {
        const pdfBlob = await buildInvoicePdfBlob(invoice);
        const pdfBytes = new Uint8Array(await pdfBlob.arrayBuffer());
        files.push({ name: `${invoice.invoice_number}.pdf`, data: pdfBytes });
      }

      const zipBlob = createZipBlob(files);
      const zipName = `${section.zipNamePrefix}-${new Date().toISOString().split('T')[0]}.zip`;
      triggerBlobDownload(zipBlob, zipName);

      toast.success(t('invoices.bulkDownloadSuccess', { count: files.length }));
    } catch (error) {
      console.error('Failed to download selected invoices as zip:', error);
      toast.error(t('invoices.bulkDownloadFailed'));
    } finally {
      isBulkDownloadRunning = false;
      renderHeaderActions(getFilteredInvoices());
    }
  }

  function handleBulkDelete() {
    const selected = getSelectedInvoices();
    if (selected.length === 0 || isBulkDeleteRunning) return;

    confirm({
      title: t('actions.delete'),
      message: t('invoices.deleteSelectedConfirm', { count: selected.length }),
      confirmText: t('actions.delete'),
      cancelText: t('actions.cancel'),
      onConfirm: async () => {
        isBulkDeleteRunning = true;
        renderHeaderActions(getFilteredInvoices());

        try {
          const results = await Promise.allSettled(
            selected.map((invoice) => invoiceService.delete(invoice.id))
          );

          const deletedCount = results.filter((result) => result.status === 'fulfilled').length;
          if (deletedCount > 0) {
            selected.forEach((invoice) => selectedInvoiceIds.delete(invoice.id));
            toast.success(t('invoices.deleteSelectedSuccess', { count: deletedCount }));
            await loadInvoices();
          }

          if (deletedCount !== selected.length) {
            toast.error(t('invoices.deleteSelectedPartial', { count: selected.length - deletedCount }));
          }
        } catch (error) {
          console.error('Failed to delete selected invoices:', error);
          toast.error(t('invoices.bulkDeleteFailed'));
        } finally {
          isBulkDeleteRunning = false;
          renderHeaderActions(getFilteredInvoices());
        }
      },
    });
  }

  function handleCreateInvoiceFromSelected() {
    const selected = getSelectedInvoices();
    if (!section.isDeliveryNotes || selected.length === 0) return;

    const ids = selected.map((invoice) => invoice.id).join(',');
    router.navigate(`/invoices/new/from-delivery-notes/${ids}`);
  }

  function attachEventListeners(filteredInvoices, allFilteredSelected) {
    const invoiceNumberFilterInput = container.querySelector('#invoiceNumberFilterInput');
    const invoiceClientFilterInput = container.querySelector('#invoiceClientFilterInput');
    const statusFilter = container.querySelector('#invoiceStatusFilter');
    const dateFromFilter = container.querySelector('#invoiceDateFromFilter');
    const dateToFilter = container.querySelector('#invoiceDateToFilter');
    const totalMinFilter = container.querySelector('#invoiceTotalMinFilter');
    const totalMaxFilter = container.querySelector('#invoiceTotalMaxFilter');
    const clearFiltersBtn = container.querySelector('#clearInvoiceFiltersBtn');

    if (statusFilter) {
      statusFilterCustomSelect = new CustomSelect(statusFilter);
    }

    invoiceNumberFilterInput?.addEventListener('input', () => {
      filters.invoiceNumber = invoiceNumberFilterInput.value;
      renderInvoicesList(getFilteredInvoices());
    });

    invoiceClientFilterInput?.addEventListener('input', () => {
      filters.client = invoiceClientFilterInput.value;
      renderInvoicesList(getFilteredInvoices());
    });

    statusFilter?.addEventListener('change', () => {
      filters.status = statusFilter.value;
      renderInvoicesList(getFilteredInvoices());
    });

    dateFromFilter?.addEventListener('change', () => {
      filters.dateFrom = dateFromFilter.value;
      renderInvoicesList(getFilteredInvoices());
    });

    dateToFilter?.addEventListener('change', () => {
      filters.dateTo = dateToFilter.value;
      renderInvoicesList(getFilteredInvoices());
    });

    totalMinFilter?.addEventListener('input', () => {
      filters.totalMin = totalMinFilter.value;
      renderInvoicesList(getFilteredInvoices());
    });

    totalMaxFilter?.addEventListener('input', () => {
      filters.totalMax = totalMaxFilter.value;
      renderInvoicesList(getFilteredInvoices());
    });

    clearFiltersBtn?.addEventListener('click', () => {
      filters.invoiceNumber = '';
      filters.client = '';
      filters.status = 'all';
      filters.dateFrom = '';
      filters.dateTo = '';
      filters.totalMin = '';
      filters.totalMax = '';
      renderInvoicesList(getFilteredInvoices());
    });

    const selectAllCheckbox = container.querySelector('#selectAllInvoices');

    if (selectAllCheckbox) {
      const selectedInFilteredCount = getSelectedInFilteredCount(filteredInvoices);
      selectAllCheckbox.checked = allFilteredSelected;
      selectAllCheckbox.indeterminate = selectedInFilteredCount > 0 && !allFilteredSelected;

      selectAllCheckbox.addEventListener('change', () => {
        if (selectAllCheckbox.checked) {
          selectAllFiltered(filteredInvoices);
        } else {
          clearFilteredSelection(filteredInvoices);
        }

        renderInvoicesList(getFilteredInvoices());
      });
    }

    container.querySelectorAll('.select-invoice-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        toggleInvoiceSelection(parseInt(checkbox.dataset.id, 10), checkbox.checked);
        renderInvoicesList(getFilteredInvoices());
      });
    });

    container.querySelectorAll('.preview-invoice-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        router.navigate(`${section.basePath}/${btn.dataset.id}/preview`);
      });
    });

    container.querySelectorAll('.mark-paid-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          await invoiceService.updateStatus(parseInt(btn.dataset.id, 10), 'paid');
          toast.success(section.saveSuccess);
          loadInvoices();
        } catch (error) {
          toast.error('Failed to update status');
        }
      });
    });

    container.querySelectorAll('.edit-invoice-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        router.navigate(`${section.basePath}/${btn.dataset.id}`);
      });
    });

    container.querySelectorAll('.duplicate-invoice-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        try {
          const newId = await invoiceService.duplicate(parseInt(btn.dataset.id, 10));
          if (newId) {
            toast.success(section.saveSuccess);
            loadInvoices();
          }
        } catch (error) {
          toast.error('Failed to duplicate invoice');
        }
      });
    });

    container.querySelectorAll('.delete-invoice-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const invoiceId = parseInt(btn.dataset.id, 10);

        confirm({
          title: t('actions.delete'),
          message: section.deleteConfirm,
          confirmText: t('actions.delete'),
          cancelText: t('actions.cancel'),
          onConfirm: async () => {
            try {
              await invoiceService.delete(invoiceId);
              selectedInvoiceIds.delete(invoiceId);
              toast.success(section.deleteSuccess);
              loadInvoices();
            } catch (error) {
              toast.error('Failed to delete invoice');
            }
          },
        });
      });
    });
  }

  async function loadInvoices() {
    if (!container) return;

    try {
      currentInvoices = await invoiceService.getAll({ document_type: section.documentType });
      syncSelection();
      renderInvoicesList(getFilteredInvoices());
    } catch (error) {
      console.error('Failed to load invoices:', error);
      container.innerHTML = `<div class="p-4 text-center text-error">Failed to load invoices</div>`;
    }
  }

  await loadInvoices();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
