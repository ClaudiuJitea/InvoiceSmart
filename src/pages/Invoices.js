// Invoices List Page
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { invoiceService } from '../db/services/invoiceService.js';
import { clientService } from '../db/services/clientService.js';
import { settingsService } from '../db/services/settingsService.js';
import { toast } from '../components/common/Toast.js';
import { confirm } from '../components/common/Modal.js';
import { router } from '../router.js';
import { renderTemplate } from '../templates/index.js';
import { exportToPdfBlob } from '../services/pdfService.js';
import { createZipBlob } from '../utils/zip.js';
import { CustomSelect } from '../components/common/CustomSelect.js';
import {
  downloadCsv,
  downloadWorkbook,
  groupRowsBy,
  readStructuredFile,
  resolveFirstValue,
  toNullableString,
  toNumber,
  toTrimmedString,
} from '../utils/importExport.js';
import { normalizeSeriesTemplates } from '../utils/seriesTemplates.js';

const INVOICE_EXPORT_COLUMNS = [
  { key: 'document_type', label: 'document_type' },
  { key: 'invoice_number', label: 'invoice_number' },
  { key: 'series', label: 'series' },
  { key: 'client_name', label: 'client_name' },
  { key: 'client_cif', label: 'client_cif' },
  { key: 'client_reg_no', label: 'client_reg_no' },
  { key: 'client_address', label: 'client_address' },
  { key: 'client_city', label: 'client_city' },
  { key: 'client_country', label: 'client_country' },
  { key: 'client_email', label: 'client_email' },
  { key: 'client_phone', label: 'client_phone' },
  { key: 'issue_date', label: 'issue_date' },
  { key: 'due_date', label: 'due_date' },
  { key: 'currency', label: 'currency' },
  { key: 'secondary_currency', label: 'secondary_currency' },
  { key: 'exchange_rate', label: 'exchange_rate' },
  { key: 'status', label: 'status' },
  { key: 'template', label: 'template' },
  { key: 'payment_method', label: 'payment_method' },
  { key: 'language', label: 'language' },
  { key: 'secondary_language', label: 'secondary_language' },
  { key: 'language_mode', label: 'language_mode' },
  { key: 'notes', label: 'notes' },
  { key: 'item_description', label: 'item_description' },
  { key: 'item_unit', label: 'item_unit' },
  { key: 'item_quantity', label: 'item_quantity' },
  { key: 'item_unit_price', label: 'item_unit_price' },
  { key: 'item_tax_rate', label: 'item_tax_rate' },
  { key: 'item_total', label: 'item_total' },
];

function buildInvoiceItemPayload(row, fallbackTaxRate = 0) {
  const description = toTrimmedString(resolveFirstValue(row, ['item_description', 'description', 'line_description']));
  if (!description) return null;

  const quantity = toNumber(resolveFirstValue(row, ['item_quantity', 'quantity']), 1);
  const unitPrice = toNumber(resolveFirstValue(row, ['item_unit_price', 'unit_price', 'price']), 0);
  const taxRate = toNumber(resolveFirstValue(row, ['item_tax_rate', 'tax_rate', 'vat_rate']), fallbackTaxRate);
  const explicitTotal = resolveFirstValue(row, ['item_total', 'total', 'line_total']);

  return {
    description,
    unit: toTrimmedString(resolveFirstValue(row, ['item_unit', 'unit'])) || 'hrs',
    quantity,
    unit_price: unitPrice,
    tax_rate: taxRate,
    total: explicitTotal === '' ? quantity * unitPrice : toNumber(explicitTotal, quantity * unitPrice),
  };
}

function extractSeriesNumber(invoiceNumber) {
  const match = String(invoiceNumber || '').match(/(\d+)(?!.*\d)/);
  return match ? parseInt(match[1], 10) : null;
}

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
      <input type="file" id="invoiceImportInput" accept=".csv,.xlsx,.xls" style="display:none;">

      <div id="invoicesListContainer">
        <div class="card card-elevated" style="padding: 40px; text-align: center;">
            <div class="loading-spinner"></div>
            <p style="margin-top: 10px; color: var(--md-on-surface-variant);">${t('general.loading')}</p>
        </div>
      </div>
    </div>
  `;
}

export async function initInvoices(params = {}) {
  const section = getSectionConfig(params);
  const container = document.getElementById('invoicesListContainer');
  const headerActions = document.getElementById('invoicesHeaderActions');
  const invoiceImportInput = document.getElementById('invoiceImportInput');

  let currentInvoices = [];
  let currentSettings = {};
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
    const baseExportName = `${section.zipNamePrefix}-${new Date().toISOString().slice(0, 10)}`;

    headerActions.innerHTML = `
      <button class="btn btn-tonal btn-sm" id="importInvoicesBtn" type="button">
        ${icons.upload}
        ${t('dataExchange.import')}
      </button>
      <details class="header-action-dropdown" ${filteredInvoices.length === 0 ? 'data-disabled="true"' : ''}>
        <summary class="btn btn-tonal btn-sm ${filteredInvoices.length === 0 ? 'is-disabled' : ''}">
          ${icons.download}
          ${t('dataExchange.exportAs')}
          ${icons.chevronDown}
        </summary>
        <div class="header-action-menu">
          <button class="header-action-menu-btn" id="exportInvoicesCsvBtn" type="button">
            CSV
          </button>
          <button class="header-action-menu-btn" id="exportInvoicesExcelBtn" type="button">
            Excel
          </button>
        </div>
      </details>
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
      <a href="#${section.basePath}/new" class="btn btn-filled">
        ${icons.plus}
        ${section.newLabel}
      </a>
    `;

    document.getElementById('importInvoicesBtn')?.addEventListener('click', () => {
      invoiceImportInput?.click();
    });

    document.getElementById('exportInvoicesCsvBtn')?.addEventListener('click', async () => {
      try {
        const rows = await buildInvoiceExportRows(filteredInvoices);
        downloadCsv(`${baseExportName}.csv`, rows, INVOICE_EXPORT_COLUMNS);
        document.getElementById('exportInvoicesCsvBtn')?.closest('details')?.removeAttribute('open');
      } catch (error) {
        toast.error(`${t('dataExchange.exportFailed')}: ${error.message}`);
      }
    });

    document.getElementById('exportInvoicesExcelBtn')?.addEventListener('click', async () => {
      try {
        const rows = await buildInvoiceExportRows(filteredInvoices);
        await downloadWorkbook(`${baseExportName}.xlsx`, rows, INVOICE_EXPORT_COLUMNS, section.isDeliveryNotes ? 'Delivery Notes' : 'Invoices');
        document.getElementById('exportInvoicesExcelBtn')?.closest('details')?.removeAttribute('open');
      } catch (error) {
        toast.error(`${t('dataExchange.exportFailed')}: ${error.message}`);
      }
    });

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
    tempDocument.innerHTML = renderTemplate(invoice.template || 'modern', invoice, currentSettings);
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

  async function buildInvoiceExportRows(invoices) {
    const detailedInvoices = await Promise.all(
      invoices.map((invoice) => invoiceService.getById(invoice.id))
    );

    return detailedInvoices.flatMap((invoice) => {
      if (!invoice) return [];

      const baseRow = {
        document_type: invoice.document_type || section.documentType,
        invoice_number: invoice.invoice_number || '',
        series: invoice.series || '',
        client_name: invoice.client_name || '',
        client_cif: invoice.client_cif || '',
        client_reg_no: invoice.client_reg_no || '',
        client_address: invoice.client_address || '',
        client_city: invoice.client_city || '',
        client_country: invoice.client_country || '',
        client_email: invoice.client_email || '',
        client_phone: invoice.client_phone || '',
        issue_date: String(invoice.issue_date || '').slice(0, 10),
        due_date: String(invoice.due_date || '').slice(0, 10),
        currency: invoice.currency || 'EUR',
        secondary_currency: invoice.secondary_currency || 'RON',
        exchange_rate: invoice.exchange_rate ?? 1,
        status: invoice.status || 'draft',
        template: invoice.template || 'modern',
        payment_method: invoice.payment_method || '',
        language: invoice.language || 'en',
        secondary_language: invoice.secondary_language || 'ro',
        language_mode: invoice.language_mode || 'single',
        notes: invoice.notes || '',
      };

      if (!Array.isArray(invoice.items) || invoice.items.length === 0) {
        return [{
          ...baseRow,
          item_description: '',
          item_unit: '',
          item_quantity: '',
          item_unit_price: '',
          item_tax_rate: '',
          item_total: '',
        }];
      }

      return invoice.items.map((item) => ({
        ...baseRow,
        item_description: item.description || '',
        item_unit: item.unit || '',
        item_quantity: item.quantity ?? '',
        item_unit_price: item.unit_price ?? '',
        item_tax_rate: item.tax_rate ?? '',
        item_total: item.total ?? '',
      }));
    });
  }

  async function resolveClientForImport(baseRow, clientsByCif, clientsByName) {
    const clientName = toTrimmedString(resolveFirstValue(baseRow, ['client_name', 'name', 'company_name']));
    const clientCif = toNullableString(resolveFirstValue(baseRow, ['client_cif', 'client_vat', 'cif', 'vat']));

    if (!clientName) {
      throw new Error(t('dataExchange.invoiceImportMissingClient'));
    }

    const existingClient = (clientCif && clientsByCif.get(clientCif.toLowerCase()))
      || clientsByName.get(clientName.toLowerCase());

    if (existingClient) {
      return existingClient.id;
    }

    const payload = {
      name: clientName,
      cif: clientCif,
      reg_no: toNullableString(resolveFirstValue(baseRow, ['client_reg_no', 'reg_no'])),
      address: toNullableString(resolveFirstValue(baseRow, ['client_address', 'address'])),
      city: toNullableString(resolveFirstValue(baseRow, ['client_city', 'city'])),
      country: toNullableString(resolveFirstValue(baseRow, ['client_country', 'country'])),
      email: toNullableString(resolveFirstValue(baseRow, ['client_email', 'email'])),
      phone: toNullableString(resolveFirstValue(baseRow, ['client_phone', 'phone'])),
      bank_account: toNullableString(resolveFirstValue(baseRow, ['client_bank_account', 'bank_account', 'iban'])),
      bank_name: toNullableString(resolveFirstValue(baseRow, ['client_bank_name', 'bank_name'])),
      notes: null,
    };

    const id = await clientService.create(payload);
    const createdClient = { id, ...payload };
    clientsByName.set(clientName.toLowerCase(), createdClient);
    if (clientCif) clientsByCif.set(clientCif.toLowerCase(), createdClient);
    return id;
  }

  async function syncSeriesCounters(importedInvoices) {
    const settings = await settingsService.get();
    const templates = normalizeSeriesTemplates(settings || {});
    let changed = false;

    importedInvoices.forEach((invoice) => {
      const importedNumber = extractSeriesNumber(invoice.invoice_number);
      if (!Number.isInteger(importedNumber)) return;

      const template = templates.find((item) => (
        item.document_type === (invoice.document_type || section.documentType)
        && item.prefix === invoice.series
      ));

      if (template && importedNumber >= template.next_number) {
        template.next_number = importedNumber + 1;
        changed = true;
      }
    });

    if (changed) {
      currentSettings = {
        ...settings,
        document_series_templates: templates,
      };
      await settingsService.update(currentSettings);
    }
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
          toast.error(t('invoices.updateStatusFailed'));
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
          toast.error(t('invoices.duplicateFailed'));
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
              toast.error(t('invoices.deleteFailed'));
            }
          },
        });
      });
    });
  }

  async function loadInvoices() {
    if (!container) return;

    try {
      const [invoices, settings] = await Promise.all([
        invoiceService.getAll({ document_type: section.documentType }),
        settingsService.get(),
      ]);
      currentInvoices = invoices;
      currentSettings = settings || {};
      syncSelection();
      renderInvoicesList(getFilteredInvoices());
    } catch (error) {
      console.error('Failed to load invoices:', error);
      container.innerHTML = `<div class="p-4 text-center text-error">${t('invoices.loadError')}</div>`;
    }
  }

  invoiceImportInput?.addEventListener('change', async () => {
    const file = invoiceImportInput.files?.[0];
    if (!file) return;

    try {
      const rows = await readStructuredFile(file);
      if (!rows.length) {
        toast.error(t('dataExchange.importNoRows'));
        return;
      }

      const groupedRows = groupRowsBy(rows, (row, index) => {
        const invoiceNumber = toTrimmedString(resolveFirstValue(row, ['invoice_number', 'number']));
        return invoiceNumber || `row_${index}`;
      });

      const [existingInvoices, existingClients] = await Promise.all([
        invoiceService.getAll({ document_type: section.documentType }),
        clientService.getAll(),
      ]);

      const existingInvoicesByNumber = new Map(
        existingInvoices.map((invoice) => [String(invoice.invoice_number || '').trim().toLowerCase(), invoice])
      );
      const clientsByCif = new Map();
      const clientsByName = new Map();
      existingClients.forEach((client) => {
        if (client.cif) clientsByCif.set(String(client.cif).trim().toLowerCase(), client);
        if (client.name) clientsByName.set(String(client.name).trim().toLowerCase(), client);
      });

      let created = 0;
      let updated = 0;
      let skipped = 0;
      const importedInvoices = [];

      for (const grouped of groupedRows.values()) {
        const baseRow = grouped[0] || {};
        const invoiceNumber = toTrimmedString(resolveFirstValue(baseRow, ['invoice_number', 'number']));
        if (!invoiceNumber) {
          skipped += 1;
          continue;
        }

        try {
          const clientId = await resolveClientForImport(baseRow, clientsByCif, clientsByName);
          const invoiceTaxRate = toNumber(resolveFirstValue(baseRow, ['tax_rate', 'default_tax_rate']), 0);
          const items = grouped
            .map((row) => buildInvoiceItemPayload(row, invoiceTaxRate))
            .filter(Boolean);

          if (items.length === 0) {
            skipped += 1;
            continue;
          }

          const series = toTrimmedString(resolveFirstValue(baseRow, ['series'])) || (section.isDeliveryNotes ? 'AVZ' : 'INV');
          const issueDate = toTrimmedString(resolveFirstValue(baseRow, ['issue_date', 'date'])) || new Date().toISOString().slice(0, 10);
          const dueDate = toTrimmedString(resolveFirstValue(baseRow, ['due_date'])) || issueDate;
          const payload = {
            invoice_number: invoiceNumber,
            series,
            client_id: clientId,
            issue_date: issueDate,
            due_date: dueDate,
            currency: toTrimmedString(resolveFirstValue(baseRow, ['currency'])) || 'EUR',
            exchange_rate: toNumber(resolveFirstValue(baseRow, ['exchange_rate']), 1),
            tax_rate: invoiceTaxRate,
            payment_method: toNullableString(resolveFirstValue(baseRow, ['payment_method'])),
            notes: toNullableString(resolveFirstValue(baseRow, ['notes'])),
            document_type: section.documentType,
            status: toTrimmedString(resolveFirstValue(baseRow, ['status'])) || 'draft',
            template: toTrimmedString(resolveFirstValue(baseRow, ['template'])) || 'modern',
            language: toTrimmedString(resolveFirstValue(baseRow, ['language'])) || 'en',
            secondary_language: toTrimmedString(resolveFirstValue(baseRow, ['secondary_language'])) || 'ro',
            language_mode: toTrimmedString(resolveFirstValue(baseRow, ['language_mode'])) || 'single',
            secondary_currency: toTrimmedString(resolveFirstValue(baseRow, ['secondary_currency'])) || currentSettings.secondary_currency || 'RON',
          };

          const existing = existingInvoicesByNumber.get(invoiceNumber.toLowerCase());
          if (existing) {
            await invoiceService.update(existing.id, payload, items);
            updated += 1;
          } else {
            const id = await invoiceService.create(payload, items);
            created += 1;
            existingInvoicesByNumber.set(invoiceNumber.toLowerCase(), { id, ...payload });
          }

          importedInvoices.push({
            document_type: section.documentType,
            series,
            invoice_number: invoiceNumber,
          });
        } catch (error) {
          console.error('Failed to import invoice row group:', error);
          skipped += 1;
        }
      }

      if (importedInvoices.length > 0) {
        await syncSeriesCounters(importedInvoices);
      }

      toast.success(t('dataExchange.importCompleted', { created, updated, skipped }));
      await loadInvoices();
    } catch (error) {
      console.error('Failed to import invoices:', error);
      toast.error(`${t('dataExchange.importFailed')}: ${error.message}`);
    } finally {
      invoiceImportInput.value = '';
    }
  });

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
