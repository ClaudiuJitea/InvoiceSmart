// Receipts Page - List and manage receipts
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { invoiceService } from '../db/services/invoiceService.js';
import { settingsService } from '../db/services/settingsService.js';
import { authService } from '../db/services/authService.js';
import { renderReceiptTemplate } from '../templates/receipt.js';
import { exportToPdfBlob } from '../services/pdfService.js';
import { createZipBlob } from '../utils/zip.js';
import { CustomSelect } from '../components/common/CustomSelect.js';
import { toast } from '../components/common/Toast.js';
import { confirm } from '../components/common/Modal.js';

export function renderReceipts() {
  return `
    <div class="page-container">
      <div class="page-header-row">
        <div class="page-header-left">
          <h1 class="page-title">${t('receipts.title')}</h1>
          <p class="page-subtitle">${t('receipts.subtitle')}</p>
        </div>
        <div class="page-header-actions" id="receiptsHeaderActions"></div>
      </div>

      <div id="receiptsListContainer">
        <div class="card card-elevated" style="padding: 40px; text-align: center;">
          <div class="loading-spinner"></div>
          <p style="margin-top: 10px; color: var(--md-on-surface-variant);">${t('general.loading')}</p>
        </div>
      </div>
    </div>
  `;
}

export async function initReceipts() {
  const container = document.getElementById('receiptsListContainer');
  const headerActions = document.getElementById('receiptsHeaderActions');
  if (!container) return;

  let receipts = [];
  let invoicesById = {};
  let settings = {};
  const selectedReceiptIds = new Set();
  const filters = {
    receiptNumber: '',
    invoiceNumber: '',
    client: '',
    currency: 'all',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
  };

  let isBulkDeleteRunning = false;
  let isBulkDownloadRunning = false;
  let currencyFilterCustomSelect = null;

  function hasActiveFilters() {
    return (
      filters.receiptNumber.trim() !== '' ||
      filters.invoiceNumber.trim() !== '' ||
      filters.client.trim() !== '' ||
      filters.currency !== 'all' ||
      filters.dateFrom !== '' ||
      filters.dateTo !== '' ||
      filters.amountMin !== '' ||
      filters.amountMax !== ''
    );
  }

  function matchesFilters(receipt) {
    const invoice = invoicesById[receipt.invoice_id] || {};
    const receiptNumber = String(receipt.receipt_number || '').toLowerCase();
    const invoiceNumber = String(invoice.invoice_number || '').toLowerCase();
    const clientName = String(invoice.client_name || '').toLowerCase();
    const issueDate = String(receipt.issue_date || '').slice(0, 10);
    const amount = Number(receipt.amount || 0);
    const amountMin = filters.amountMin !== '' ? Number(filters.amountMin) : null;
    const amountMax = filters.amountMax !== '' ? Number(filters.amountMax) : null;

    const matchesReceiptNumber = !filters.receiptNumber.trim() || receiptNumber.includes(filters.receiptNumber.trim().toLowerCase());
    const matchesInvoiceNumber = !filters.invoiceNumber.trim() || invoiceNumber.includes(filters.invoiceNumber.trim().toLowerCase());
    const matchesClient = !filters.client.trim() || clientName.includes(filters.client.trim().toLowerCase());
    const matchesCurrency = filters.currency === 'all' || receipt.currency === filters.currency;
    const matchesDateFrom = !filters.dateFrom || (issueDate && issueDate >= filters.dateFrom);
    const matchesDateTo = !filters.dateTo || (issueDate && issueDate <= filters.dateTo);
    const matchesAmountMin = amountMin === null || (!Number.isNaN(amountMin) && amount >= amountMin);
    const matchesAmountMax = amountMax === null || (!Number.isNaN(amountMax) && amount <= amountMax);

    return (
      matchesReceiptNumber &&
      matchesInvoiceNumber &&
      matchesClient &&
      matchesCurrency &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesAmountMin &&
      matchesAmountMax
    );
  }

  function getFilteredReceipts() {
    return receipts.filter(matchesFilters);
  }

  function getSelectedCount() {
    return selectedReceiptIds.size;
  }

  function getSelectedReceipts() {
    return receipts.filter((receipt) => selectedReceiptIds.has(receipt.id));
  }

  function getSelectedInFilteredCount(filteredReceipts) {
    return filteredReceipts.reduce((count, receipt) => count + (selectedReceiptIds.has(receipt.id) ? 1 : 0), 0);
  }

  function clearSelection() {
    selectedReceiptIds.clear();
  }

  function selectAllFiltered(filteredReceipts) {
    filteredReceipts.forEach((receipt) => selectedReceiptIds.add(receipt.id));
  }

  function clearFilteredSelection(filteredReceipts) {
    filteredReceipts.forEach((receipt) => selectedReceiptIds.delete(receipt.id));
  }

  function toggleReceiptSelection(receiptId, checked) {
    if (checked) {
      selectedReceiptIds.add(receiptId);
      return;
    }

    selectedReceiptIds.delete(receiptId);
  }

  function syncSelection() {
    const availableIds = new Set(receipts.map((receipt) => receipt.id));
    for (const id of Array.from(selectedReceiptIds)) {
      if (!availableIds.has(id)) selectedReceiptIds.delete(id);
    }
  }

  function renderHeaderActions(filteredReceipts) {
    if (!headerActions) return;

    const selectedCount = getSelectedCount();
    const selectedInFilteredCount = getSelectedInFilteredCount(filteredReceipts);
    const allFilteredSelected = filteredReceipts.length > 0 && selectedInFilteredCount === filteredReceipts.length;

    headerActions.innerHTML = `
      ${selectedCount > 0 ? `
        <div class="bulk-actions-bar">
          <span class="bulk-actions-count">${t('receipts.selectedCount', { count: selectedCount })}</span>
          ${filteredReceipts.length > 0 ? `
            <button class="btn btn-text btn-sm" id="toggleSelectAllReceiptsBtn" type="button">
              ${allFilteredSelected ? t('receipts.clearSelectionInView') : t('receipts.selectAllInView')}
            </button>
          ` : ''}
          ${hasActiveFilters() && filteredReceipts.length > 0 && !allFilteredSelected ? `
            <button class="btn btn-text btn-sm" id="selectAllFilteredReceiptsBtn" type="button">
              ${t('receipts.selectAllFiltered', { count: filteredReceipts.length })}
            </button>
          ` : ''}
          <button class="btn btn-tonal btn-sm" id="downloadSelectedReceiptsBtn" type="button" ${isBulkDownloadRunning ? 'disabled' : ''}>
            ${icons.download}
            ${t('receipts.downloadZip')}
          </button>
          <button class="btn btn-danger btn-sm" id="deleteSelectedReceiptsBtn" type="button" ${isBulkDeleteRunning ? 'disabled' : ''}>
            ${icons.trash}
            ${t('receipts.deleteSelected')}
          </button>
          <button class="btn btn-text btn-sm" id="clearReceiptsSelectionBtn" type="button">
            ${t('invoices.clearSelection')}
          </button>
        </div>
      ` : ''}
    `;

    if (selectedCount > 0) {
      const toggleSelectAllBtn = document.getElementById('toggleSelectAllReceiptsBtn');
      const selectAllFilteredBtn = document.getElementById('selectAllFilteredReceiptsBtn');
      const downloadSelectedBtn = document.getElementById('downloadSelectedReceiptsBtn');
      const deleteSelectedBtn = document.getElementById('deleteSelectedReceiptsBtn');
      const clearSelectionBtn = document.getElementById('clearReceiptsSelectionBtn');

      toggleSelectAllBtn?.addEventListener('click', () => {
        if (allFilteredSelected) {
          clearFilteredSelection(filteredReceipts);
        } else {
          selectAllFiltered(filteredReceipts);
        }
        renderReceiptsList(getFilteredReceipts());
      });

      selectAllFilteredBtn?.addEventListener('click', () => {
        selectAllFiltered(filteredReceipts);
        renderReceiptsList(getFilteredReceipts());
      });

      downloadSelectedBtn?.addEventListener('click', async () => {
        await handleBulkDownload();
      });

      deleteSelectedBtn?.addEventListener('click', () => {
        handleBulkDelete();
      });

      clearSelectionBtn?.addEventListener('click', () => {
        clearSelection();
        renderReceiptsList(getFilteredReceipts());
      });
    }
  }

  function getCurrencyOptions() {
    const currencies = [...new Set(receipts.map((receipt) => receipt.currency).filter(Boolean))].sort();
    return currencies;
  }

  function renderReceiptsList(filteredReceipts) {
    if (currencyFilterCustomSelect) {
      currencyFilterCustomSelect.destroy();
      currencyFilterCustomSelect = null;
    }

    renderHeaderActions(filteredReceipts);

    if (receipts.length === 0) {
      container.innerHTML = `
        <div class="card card-elevated">
          <div class="empty-state" style="padding: 60px; text-align: center;">
            ${icons.file}
            <h3 style="margin-top: 20px;">${t('receipts.emptyTitle')}</h3>
            <p style="color: var(--md-on-surface-variant);">${t('receipts.emptyDescription')}</p>
          </div>
        </div>
      `;
      return;
    }

    const selectedInFilteredCount = getSelectedInFilteredCount(filteredReceipts);
    const allFilteredSelected = filteredReceipts.length > 0 && selectedInFilteredCount === filteredReceipts.length;
    const currencies = getCurrencyOptions();

    container.innerHTML = `
      <div class="invoices-filters-card card card-elevated">
        <div class="invoices-filters-bar">
          <div class="invoices-filter-group">
            <label class="invoices-filter-label" for="receiptNumberFilterInput">${t('receipts.receiptNumber')}</label>
            <input
              id="receiptNumberFilterInput"
              class="invoices-filter-input"
              type="text"
              placeholder="${t('receipts.filterByReceiptNumber')}"
              value="${escapeHtml(filters.receiptNumber)}"
            >
          </div>
          <div class="invoices-filter-group">
            <label class="invoices-filter-label" for="receiptInvoiceNumberFilterInput">${t('receipts.invoiceNumber')}</label>
            <input
              id="receiptInvoiceNumberFilterInput"
              class="invoices-filter-input"
              type="text"
              placeholder="${t('receipts.filterByInvoiceNumber')}"
              value="${escapeHtml(filters.invoiceNumber)}"
            >
          </div>
          <div class="invoices-filter-group">
            <label class="invoices-filter-label" for="receiptClientFilterInput">${t('receipts.client')}</label>
            <input
              id="receiptClientFilterInput"
              class="invoices-filter-input"
              type="text"
              placeholder="${t('receipts.filterByClient')}"
              value="${escapeHtml(filters.client)}"
            >
          </div>
          <div class="invoices-filter-group invoices-filter-status-group">
            <label class="invoices-filter-label" for="receiptCurrencyFilter">${t('invoices.currency')}</label>
            <select id="receiptCurrencyFilter" class="invoices-filter-input">
              <option value="all" ${filters.currency === 'all' ? 'selected' : ''}>${t('receipts.filterCurrencyAll')}</option>
              ${currencies.map((currency) => `<option value="${currency}" ${filters.currency === currency ? 'selected' : ''}>${currency}</option>`).join('')}
            </select>
          </div>
          <div class="invoices-filter-group">
            <label class="invoices-filter-label" for="receiptAmountMinFilter">${t('receipts.amountMin')}</label>
            <input
              id="receiptAmountMinFilter"
              class="invoices-filter-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value="${escapeHtml(filters.amountMin)}"
            >
          </div>
          <div class="invoices-filter-group">
            <label class="invoices-filter-label" for="receiptAmountMaxFilter">${t('receipts.amountMax')}</label>
            <input
              id="receiptAmountMaxFilter"
              class="invoices-filter-input"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value="${escapeHtml(filters.amountMax)}"
            >
          </div>
          <div class="invoices-filter-group">
            <label class="invoices-filter-label" for="receiptDateFromFilter">${t('receipts.dateFrom')}</label>
            <input
              id="receiptDateFromFilter"
              class="invoices-filter-input"
              type="date"
              value="${filters.dateFrom}"
            >
          </div>
          <div class="invoices-filter-group">
            <label class="invoices-filter-label" for="receiptDateToFilter">${t('receipts.dateTo')}</label>
            <input
              id="receiptDateToFilter"
              class="invoices-filter-input"
              type="date"
              value="${filters.dateTo}"
            >
          </div>
          ${hasActiveFilters() ? `
            <button class="btn btn-text btn-sm invoices-clear-filters" id="clearReceiptFiltersBtn" type="button">
              ${t('receipts.clearFilters')}
            </button>
          ` : ''}
        </div>
      </div>

      ${filteredReceipts.length > 0 ? `
        <div class="table-container card-elevated">
          <table class="table">
            <thead>
              <tr>
                <th class="bulk-select-column">
                  <input type="checkbox" class="bulk-select-checkbox" id="selectAllReceipts" aria-label="${t('receipts.selectAllInView')}">
                </th>
                <th>${t('receipts.receiptNumber')}</th>
                <th>${t('receipts.invoiceNumber')}</th>
                <th>${t('receipts.client')}</th>
                <th>${t('receipts.issueDate')}</th>
                <th>${t('receipts.amount')}</th>
                <th class="text-right">${t('actions.view')} / ${t('actions.delete')}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredReceipts.map((receipt) => {
      const invoice = invoicesById[receipt.invoice_id] || {};
      const checked = selectedReceiptIds.has(receipt.id) ? 'checked' : '';

      return `
                <tr>
                  <td class="bulk-select-column">
                    <input type="checkbox" class="bulk-select-checkbox select-receipt-checkbox" data-id="${receipt.id}" ${checked} aria-label="${t('receipts.selectReceipt', { number: receipt.receipt_number })}">
                  </td>
                  <td><span class="receipt-number-badge">${receipt.receipt_number}</span></td>
                  <td>
                    <a href="#/invoices/${receipt.invoice_id}/preview" class="link">
                      ${invoice.invoice_number || '-'}
                    </a>
                  </td>
                  <td>${invoice.client_name || '-'}</td>
                  <td>${new Date(receipt.issue_date).toLocaleDateString()}</td>
                  <td><span class="amount">${Number(receipt.amount).toFixed(2)} ${receipt.currency}</span></td>
                  <td class="text-right">
                    <div class="table-actions" style="justify-content: flex-end; align-items: center;">
                      <button class="btn btn-tonal btn-sm view-receipt-btn" data-receipt-id="${receipt.id}">
                        ${icons.eye}
                        ${t('receipts.viewReceipt')}
                      </button>
                      <button class="btn btn-tonal btn-sm delete-receipt-btn" data-receipt-id="${receipt.id}" title="${t('actions.delete')}" aria-label="${t('actions.delete')}" style="padding: 0 var(--space-3);">
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
            <p>${t('receipts.noFilteredResults')}</p>
            <button class="btn btn-text" id="clearReceiptFiltersBtn" type="button">${t('receipts.clearFilters')}</button>
          </div>
        </div>
      `}
    `;

    attachEventListeners(filteredReceipts, allFilteredSelected);
  }

  async function buildReceiptPdfBlob(receipt) {
    const invoice = invoicesById[receipt.invoice_id] || {};
    const tempDocument = document.createElement('div');
    tempDocument.innerHTML = renderReceiptTemplate(receipt, invoice, settings);
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
    const selected = getSelectedReceipts();
    if (selected.length === 0 || isBulkDownloadRunning) return;

    isBulkDownloadRunning = true;
    renderHeaderActions(getFilteredReceipts());

    try {
      const files = [];
      for (const receipt of selected) {
        const pdfBlob = await buildReceiptPdfBlob(receipt);
        const pdfBytes = new Uint8Array(await pdfBlob.arrayBuffer());
        files.push({ name: `${receipt.receipt_number}.pdf`, data: pdfBytes });
      }

      const zipBlob = createZipBlob(files);
      const zipName = `receipts-${new Date().toISOString().split('T')[0]}.zip`;
      triggerBlobDownload(zipBlob, zipName);

      toast.success(t('receipts.bulkDownloadSuccess', { count: files.length }));
    } catch (error) {
      console.error('Failed to download selected receipts as zip:', error);
      toast.error(t('receipts.bulkDownloadFailed'));
    } finally {
      isBulkDownloadRunning = false;
      renderHeaderActions(getFilteredReceipts());
    }
  }

  function handleBulkDelete() {
    const selected = getSelectedReceipts();
    if (selected.length === 0 || isBulkDeleteRunning) return;

    confirm({
      title: t('actions.delete'),
      message: t('receipts.deleteSelectedConfirm', { count: selected.length }),
      confirmText: t('actions.delete'),
      cancelText: t('actions.cancel'),
      onConfirm: async () => {
        isBulkDeleteRunning = true;
        renderHeaderActions(getFilteredReceipts());

        try {
          const results = await Promise.allSettled(
            selected.map((receipt) => fetch(`/api/receipts/${receipt.id}`, {
              method: 'DELETE',
              headers: authService.getAuthHeader(),
            }))
          );

          const deletedCount = results.filter((result) => result.status === 'fulfilled' && result.value.ok).length;
          if (deletedCount > 0) {
            const selectedIds = new Set(selected.map((item) => item.id));
            receipts = receipts.filter((receipt) => !selectedIds.has(receipt.id));
            selected.forEach((receipt) => selectedReceiptIds.delete(receipt.id));
            toast.success(t('receipts.deleteSelectedSuccess', { count: deletedCount }));
            renderReceiptsList(getFilteredReceipts());
          }

          if (deletedCount !== selected.length) {
            toast.error(t('receipts.deleteSelectedPartial', { count: selected.length - deletedCount }));
          }
        } catch (error) {
          console.error('Failed to delete selected receipts:', error);
          toast.error(t('receipts.bulkDeleteFailed'));
        } finally {
          isBulkDeleteRunning = false;
          renderHeaderActions(getFilteredReceipts());
        }
      },
    });
  }

  function attachEventListeners(filteredReceipts, allFilteredSelected) {
    const receiptNumberFilterInput = container.querySelector('#receiptNumberFilterInput');
    const receiptInvoiceNumberFilterInput = container.querySelector('#receiptInvoiceNumberFilterInput');
    const receiptClientFilterInput = container.querySelector('#receiptClientFilterInput');
    const currencyFilter = container.querySelector('#receiptCurrencyFilter');
    const amountMinFilter = container.querySelector('#receiptAmountMinFilter');
    const amountMaxFilter = container.querySelector('#receiptAmountMaxFilter');
    const dateFromFilter = container.querySelector('#receiptDateFromFilter');
    const dateToFilter = container.querySelector('#receiptDateToFilter');
    const clearFiltersBtn = container.querySelector('#clearReceiptFiltersBtn');

    if (currencyFilter) {
      currencyFilterCustomSelect = new CustomSelect(currencyFilter);
    }

    receiptNumberFilterInput?.addEventListener('input', () => {
      filters.receiptNumber = receiptNumberFilterInput.value;
      renderReceiptsList(getFilteredReceipts());
    });

    receiptInvoiceNumberFilterInput?.addEventListener('input', () => {
      filters.invoiceNumber = receiptInvoiceNumberFilterInput.value;
      renderReceiptsList(getFilteredReceipts());
    });

    receiptClientFilterInput?.addEventListener('input', () => {
      filters.client = receiptClientFilterInput.value;
      renderReceiptsList(getFilteredReceipts());
    });

    currencyFilter?.addEventListener('change', () => {
      filters.currency = currencyFilter.value;
      renderReceiptsList(getFilteredReceipts());
    });

    amountMinFilter?.addEventListener('input', () => {
      filters.amountMin = amountMinFilter.value;
      renderReceiptsList(getFilteredReceipts());
    });

    amountMaxFilter?.addEventListener('input', () => {
      filters.amountMax = amountMaxFilter.value;
      renderReceiptsList(getFilteredReceipts());
    });

    dateFromFilter?.addEventListener('change', () => {
      filters.dateFrom = dateFromFilter.value;
      renderReceiptsList(getFilteredReceipts());
    });

    dateToFilter?.addEventListener('change', () => {
      filters.dateTo = dateToFilter.value;
      renderReceiptsList(getFilteredReceipts());
    });

    clearFiltersBtn?.addEventListener('click', () => {
      filters.receiptNumber = '';
      filters.invoiceNumber = '';
      filters.client = '';
      filters.currency = 'all';
      filters.dateFrom = '';
      filters.dateTo = '';
      filters.amountMin = '';
      filters.amountMax = '';
      renderReceiptsList(getFilteredReceipts());
    });

    const selectAllCheckbox = container.querySelector('#selectAllReceipts');

    if (selectAllCheckbox) {
      const selectedInFilteredCount = getSelectedInFilteredCount(filteredReceipts);
      selectAllCheckbox.checked = allFilteredSelected;
      selectAllCheckbox.indeterminate = selectedInFilteredCount > 0 && !allFilteredSelected;

      selectAllCheckbox.addEventListener('change', () => {
        if (selectAllCheckbox.checked) {
          selectAllFiltered(filteredReceipts);
        } else {
          clearFilteredSelection(filteredReceipts);
        }

        renderReceiptsList(getFilteredReceipts());
      });
    }

    container.querySelectorAll('.select-receipt-checkbox').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        toggleReceiptSelection(parseInt(checkbox.dataset.id, 10), checkbox.checked);
        renderReceiptsList(getFilteredReceipts());
      });
    });

    container.querySelectorAll('.view-receipt-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const receiptId = parseInt(btn.dataset.receiptId, 10);
        const receipt = receipts.find((item) => item.id === receiptId);
        if (receipt) viewReceipt(receipt, invoicesById, settings);
      });
    });

    container.querySelectorAll('.delete-receipt-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const receiptId = parseInt(btn.dataset.receiptId, 10);
        if (!receiptId) return;

        confirm({
          title: t('actions.delete'),
          message: t('receipts.deleteConfirm'),
          confirmText: t('actions.delete'),
          cancelText: t('actions.cancel'),
          onConfirm: async () => {
            try {
              const res = await fetch(`/api/receipts/${receiptId}`, {
                method: 'DELETE',
                headers: authService.getAuthHeader(),
              });
              if (!res.ok) throw new Error(t('receipts.deleteFailed'));

              receipts = receipts.filter((receipt) => receipt.id !== receiptId);
              selectedReceiptIds.delete(receiptId);
              renderReceiptsList(getFilteredReceipts());
              toast.success(t('receipts.deleteSuccess'));
            } catch (error) {
              console.error('Failed to delete receipt:', error);
              toast.error(t('receipts.bulkDeleteFailed'));
            }
          },
        });
      });
    });
  }

  async function loadReceipts() {
    try {
      const [receiptsRes, settingsData] = await Promise.all([
        fetch('/api/receipts', { headers: authService.getAuthHeader() }),
        settingsService.get(),
      ]);

      if (!receiptsRes.ok) throw new Error(t('receipts.fetchFailed'));
      receipts = await receiptsRes.json();
      settings = settingsData;

      const invoiceIds = [...new Set(receipts.map((receipt) => receipt.invoice_id))];
      const invoicePromises = invoiceIds.map((id) => invoiceService.getById(id));
      const invoiceResults = await Promise.all(invoicePromises);

      invoicesById = {};
      invoiceResults.forEach((invoice) => {
        if (invoice) invoicesById[invoice.id] = invoice;
      });

      syncSelection();
      renderReceiptsList(getFilteredReceipts());
    } catch (error) {
      console.error('Failed to load receipts:', error);
      container.innerHTML = `
        <div class="card card-elevated">
          <div class="empty-state" style="padding: 40px;">
            <h3>${t('general.error')}</h3>
            <p>${error.message}</p>
          </div>
        </div>
      `;
    }
  }

  await loadReceipts();
}

function viewReceipt(receipt, invoicesById, settings) {
  const invoice = invoicesById[receipt.invoice_id] || {};
  const receiptHtml = renderReceiptTemplate(receipt, invoice, settings);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    toast.error(t('general.popupBlocked'));
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${t('receipts.title')} ${receipt.receipt_number}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet">
      <style>
        @page { size: A6 landscape; margin: 4mm; }
        body {
          margin: 0;
          padding: 20px;
          font-family: 'Inter', sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #f5f5f5;
          box-sizing: border-box;
        }
        .receipt-wrapper {
          background: white;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        .print-actions {
          position: fixed;
          top: 20px;
          right: 20px;
          display: flex;
          gap: 10px;
          z-index: 1000;
        }
        .print-actions button {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-family: inherit;
          font-weight: 500;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .print-actions button svg {
          width: 16px;
          height: 16px;
        }
        .print-btn {
          background: linear-gradient(135deg, #1E3A5F 0%, #2A4F7C 100%);
          color: white;
        }
        .print-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(30, 58, 95, 0.3);
        }
        .close-btn {
          background: #e0e0e0;
          color: #333;
        }
        .close-btn:hover {
          background: #d0d0d0;
        }
        @media print {
          body {
            background: white;
            display: block;
            min-height: auto;
            padding: 0;
          }
          .receipt-wrapper {
            box-shadow: none;
          }
          .print-actions {
            display: none;
          }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="print-actions">
        <button class="print-btn" onclick="window.print()">${icons.print} ${t('receipts.printSavePdf')}</button>
        <button class="close-btn" onclick="window.close()">${icons.close} ${t('actions.close')}</button>
      </div>
      <div class="receipt-wrapper">
        ${receiptHtml}
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
