// Invoice Form Page (Create/Edit)
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { invoiceService } from '../db/services/invoiceService.js';
import { clientService } from '../db/services/clientService.js';
import { productService } from '../db/services/productService.js';
import { settingsService } from '../db/services/settingsService.js';
import { bnrService } from '../services/bnrService.js';
import { toast } from '../components/common/Toast.js';
import { CustomSelect } from '../components/common/CustomSelect.js';
import { router } from '../router.js';
import {
  formatSeriesNumber,
  getDefaultSeriesTemplate,
  getSeriesTemplatesForDocument,
} from '../utils/seriesTemplates.js';

let invoiceItems = [];
let catalogProducts = [];
let relatedDeliveryNoteIds = [];
let relatedDeliveryNoteNumbers = [];

function getDocumentFormConfig(params = {}) {
  const isDeliveryNote = params?.document_type === 'delivery_note';
  return {
    isDeliveryNote,
    documentType: isDeliveryNote ? 'delivery_note' : 'invoice',
    basePath: isDeliveryNote ? '/delivery-notes' : '/invoices',
    newTitle: isDeliveryNote ? t('deliveryNotes.newDeliveryNote') : t('invoices.newInvoice'),
    editTitle: isDeliveryNote ? t('deliveryNotes.editDeliveryNote') : t('invoices.editInvoice'),
    saveSuccess: isDeliveryNote ? t('deliveryNotes.saveSuccess') : t('invoices.saveSuccess'),
  };
}

export function renderInvoiceForm(params = {}) {
  const section = getDocumentFormConfig(params);
  return `
    <div class="page-container">
      <div class="page-header-row">
        <div class="page-header-left">
          <a href="#${section.basePath}" class="btn btn-text" style="margin-left: -12px; margin-bottom: var(--space-2);">
            ${icons.arrowLeft} ${t('actions.back')}
          </a>
          <h1 class="page-title" id="formPageTitle">${section.newTitle}</h1>
        </div>
        <div class="page-header-actions" id="formPageActions">
          <!-- Preview button will be injected here -->
        </div>
      </div>

      <div id="invoiceFormContainer">
          <div class="card card-elevated" style="padding: 40px; text-align: center;">
            <div class="loading-spinner"></div>
            <p style="margin-top: 10px; color: var(--md-on-surface-variant);">Loading...</p>
          </div>
      </div>
    </div>
  `;
}

export async function initInvoiceForm(params = {}) {
  try {
    const section = getDocumentFormConfig(params);
    const isEdit = params.id && params.id !== 'new';
    const container = document.getElementById('invoiceFormContainer');
    if (!container) return;

    const fromDeliveryNoteIds = (!isEdit && section.documentType === 'invoice')
      ? String(params.from_delivery_notes || '')
        .split(',')
        .map((id) => parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0)
      : [];

    // Fetch all required data in parallel
    const [clients, settings, invoice, nextNumber, draftFromDeliveryNotes, products] = await Promise.all([
      clientService.getAll(),
      settingsService.get(),
      isEdit ? invoiceService.getById(parseInt(params.id)) : Promise.resolve(null),
      !isEdit ? invoiceService.getNextInvoiceNumber(section.documentType) : Promise.resolve(null),
      fromDeliveryNoteIds.length > 0
        ? invoiceService.buildDraftFromDeliveryNotes(fromDeliveryNoteIds)
        : Promise.resolve(null),
      productService.getAll({ activeOnly: true }).catch(() => []),
    ]);

    if (isEdit && !invoice) {
      toast.error('Invoice not found');
      router.navigate(section.basePath);
      return;
    }

    // Initialize state
    const title = isEdit ? section.editTitle : section.newTitle;
    document.getElementById('formPageTitle').textContent = title;

    if (isEdit) {
      document.getElementById('formPageActions').innerHTML = `
            <a href="#${section.basePath}/${params.id}/preview" class="btn btn-tonal">
              ${icons.eye}
              ${section.isDeliveryNote ? t('deliveryNotes.preview') : t('invoices.preview')}
            </a>
          `;
    }

    relatedDeliveryNoteIds = [];
    relatedDeliveryNoteNumbers = [];

    if (isEdit && section.documentType === 'invoice') {
      relatedDeliveryNoteIds = Array.isArray(invoice?.related_delivery_note_ids)
        ? invoice.related_delivery_note_ids.map((id) => parseInt(id, 10)).filter((id) => Number.isInteger(id) && id > 0)
        : [];
      relatedDeliveryNoteNumbers = Array.isArray(invoice?.related_delivery_notes)
        ? invoice.related_delivery_notes.map((note) => note.invoice_number).filter(Boolean)
        : [];
    } else if (!isEdit && draftFromDeliveryNotes) {
      relatedDeliveryNoteIds = Array.isArray(draftFromDeliveryNotes.source_delivery_note_ids)
        ? draftFromDeliveryNotes.source_delivery_note_ids
        : [];
      relatedDeliveryNoteNumbers = Array.isArray(draftFromDeliveryNotes.source_delivery_note_numbers)
        ? draftFromDeliveryNotes.source_delivery_note_numbers
        : [];
    }

    const draftInvoice = draftFromDeliveryNotes?.draft_invoice || {};
    catalogProducts = Array.isArray(products) ? products : [];

    // Initialize items
    if (invoice && invoice.items) {
      invoiceItems = invoice.items.map(item => ({ ...item }));
    } else if (!isEdit && draftFromDeliveryNotes?.items?.length) {
      invoiceItems = draftFromDeliveryNotes.items.map((item) => ({ ...item }));
    } else if (!isEdit) {
      invoiceItems = [{ description: '', unit: 'hrs', quantity: 1, unit_price: 0, tax_rate: settings?.default_tax_rate || 0, total: 0 }];
    }

    // Prep values
    const invoiceSeriesTemplates = getSeriesTemplatesForDocument(settings?.document_series_templates, section.documentType);
    const defaultSeriesTemplate = getDefaultSeriesTemplate(settings?.document_series_templates, section.documentType);

    const selectedTemplateId = invoiceSeriesTemplates.some((template) => template.prefix === invoice?.series)
      ? invoiceSeriesTemplates.find((template) => template.prefix === invoice?.series)?.id
      : (defaultSeriesTemplate?.id || invoiceSeriesTemplates[0]?.id || '');

    const invoiceNumber = invoice?.invoice_number
      || nextNumber?.formatted
      || (defaultSeriesTemplate ? formatSeriesNumber(defaultSeriesTemplate) : '');
    const series = invoice?.series || defaultSeriesTemplate?.prefix || nextNumber?.series || 'INV';

    const today = new Date().toISOString().split('T')[0];
    const defaultTerms = settings?.default_payment_terms || 30;
    const initialIssueDate = invoice?.issue_date || draftInvoice.issue_date || today;
    let initialDueDate = invoice?.due_date;

    if (!initialDueDate) {
      const dateObj = new Date(initialIssueDate);
      dateObj.setDate(dateObj.getDate() + defaultTerms);
      initialDueDate = dateObj.toISOString().split('T')[0];
    }

    let selectedTerm = 'custom';
    if (initialIssueDate && initialDueDate) {
      const issue = new Date(initialIssueDate);
      const due = new Date(initialDueDate);
      const diffTime = due - issue;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if ([7, 14, 15, 30, 45, 60, 90].includes(diffDays)) {
        selectedTerm = diffDays.toString();
      } else if (diffDays === 0) {
        selectedTerm = 'custom';
      }
    }

    // Render Form HTML
    container.innerHTML = `
      <form id="invoiceForm" class="card card-elevated">
        ${relatedDeliveryNoteNumbers.length > 0 ? `
          <div class="form-section" style="padding-bottom: 0;">
            <div class="chip chip-primary">
              ${t('deliveryNotes.createdFrom')}: ${relatedDeliveryNoteNumbers.join(', ')}
            </div>
          </div>
        ` : ''}
        <!-- Header Info -->
        <div class="form-section">
          <div class="form-row" style="grid-template-columns: 1.35fr 1.65fr;">
            <div>
              <h3 class="form-section-title">${t('invoices.invoiceNumber')}</h3>
              <div class="form-row invoice-number-grid">
                <div class="input-group">
                  <label class="input-label">${t('settings.documentSeriesTemplates')}</label>
                  <select class="input select" name="series_template_id" id="seriesTemplateSelect" ${isEdit ? 'disabled' : ''} ${isEdit ? '' : 'required'}>
                    ${invoiceSeriesTemplates.map((template) => `
                      <option value="${template.id}" ${selectedTemplateId === template.id ? 'selected' : ''}>
                        ${template.prefix}${template.is_default ? ` (${t('settings.isDefault')})` : ''}
                      </option>
                    `).join('')}
                  </select>
                </div>
                <div class="input-group">
                  <label class="input-label">${t('invoices.series')}</label>
                  <input type="text" class="input" name="series" id="seriesInput" value="${series}" required readonly>
                </div>
                <div class="input-group">
                  <label class="input-label">${t('invoices.number')}</label>
                  <input type="text" class="input" name="invoice_number" id="invoiceNumberInput" value="${invoiceNumber}" required ${isEdit ? '' : 'readonly'}>
                </div>
              </div>
            </div>
            
            <div>
              <h3 class="form-section-title">${t('invoices.client')} *</h3>
              <div class="input-group">
                <label class="input-label">${t('invoices.selectClient')}</label>
                <select class="input select" name="client_id" required>
                  <option value="">${t('invoices.selectClient')}</option>
                  ${clients.map(c => `
                    <option value="${c.id}" ${(invoice?.client_id || draftInvoice.client_id) === c.id ? 'selected' : ''}>
                      ${c.name}${c.cif ? ` (${c.cif})` : ''}
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Dates & Currency -->
        <div class="form-section">
          <div class="form-row" style="grid-template-columns: repeat(4, 1fr); gap: 16px; row-gap: 20px;">
            <div class="input-group">
              <label class="input-label">${t('invoices.issueDate')}</label>
              <input type="date" class="input" name="issue_date" id="issueDateInput" value="${initialIssueDate}" required>
            </div>
            
            <div class="input-group">
              <label class="input-label">${t('invoices.paymentTerms')}</label>
              <select class="input select" id="paymentTermsSelect">
                <option value="custom" ${selectedTerm === 'custom' ? 'selected' : ''}>Custom</option>
                <option value="7" ${selectedTerm === '7' ? 'selected' : ''}>7 ${t('invoices.days')}</option>
                <option value="14" ${selectedTerm === '14' ? 'selected' : ''}>14 ${t('invoices.days')}</option>
                <option value="15" ${selectedTerm === '15' ? 'selected' : ''}>15 ${t('invoices.days')}</option>
                <option value="30" ${selectedTerm === '30' ? 'selected' : ''}>30 ${t('invoices.days')}</option>
                <option value="45" ${selectedTerm === '45' ? 'selected' : ''}>45 ${t('invoices.days')}</option>
                <option value="60" ${selectedTerm === '60' ? 'selected' : ''}>60 ${t('invoices.days')}</option>
                <option value="90" ${selectedTerm === '90' ? 'selected' : ''}>90 ${t('invoices.days')}</option>
              </select>
            </div>

            <div class="input-group">
              <label class="input-label">${t('invoices.dueDate')}</label>
              <input type="date" class="input" name="due_date" id="dueDateInput" value="${initialDueDate}" required>
            </div>

            <div class="input-group">
              <label class="input-label">${t('invoices.taxRate')} (Default %)</label>
              <input type="number" step="0.1" class="input" name="tax_rate" value="${invoice?.tax_rate ?? draftInvoice.tax_rate ?? 0}" min="0">
            </div>

            <!-- Row 2 -->
            <div class="input-group">
              <label class="input-label">${t('invoices.currency')}</label>
              <select class="input select" name="currency">
                <option value="EUR" ${(invoice?.currency || draftInvoice.currency || settings?.default_currency) === 'EUR' ? 'selected' : ''}>EUR</option>
                <option value="RON" ${(invoice?.currency || draftInvoice.currency || settings?.default_currency) === 'RON' ? 'selected' : ''}>RON</option>
                <option value="USD" ${(invoice?.currency || draftInvoice.currency) === 'USD' ? 'selected' : ''}>USD</option>
                <option value="GBP" ${(invoice?.currency || draftInvoice.currency) === 'GBP' ? 'selected' : ''}>GBP</option>
                <option value="CHF" ${(invoice?.currency || draftInvoice.currency) === 'CHF' ? 'selected' : ''}>CHF</option>
              </select>
            </div>

            <div class="input-group">
              <label class="input-label">Secondary Currency</label>
              <select class="input select" name="secondary_currency">
                <option value="RON" ${(invoice?.secondary_currency || draftInvoice.secondary_currency || 'RON') === 'RON' ? 'selected' : ''}>RON</option>
                <option value="EUR" ${(invoice?.secondary_currency || draftInvoice.secondary_currency) === 'EUR' ? 'selected' : ''}>EUR</option>
                <option value="USD" ${(invoice?.secondary_currency || draftInvoice.secondary_currency) === 'USD' ? 'selected' : ''}>USD</option>
                <option value="GBP" ${(invoice?.secondary_currency || draftInvoice.secondary_currency) === 'GBP' ? 'selected' : ''}>GBP</option>
                <option value="CHF" ${(invoice?.secondary_currency || draftInvoice.secondary_currency) === 'CHF' ? 'selected' : ''}>CHF</option>
              </select>
            </div>

            <div class="input-group" style="grid-column: span 2;">
              <label class="input-label" id="exchangeRateLabel">${t('invoices.exchangeRate')} (${invoice?.secondary_currency || draftInvoice.secondary_currency || 'RON'})</label>
              <div style="display: flex; gap: 8px;">
                <input type="number" step="0.0001" class="input" name="exchange_rate" id="exchangeRateInput" value="${invoice?.exchange_rate ?? draftInvoice.exchange_rate ?? 1.0}" min="0">
                <button type="button" class="btn btn-tonal" id="fetchBnrBtn" title="Fetch from BNR" style="padding: 0 24px; white-space: nowrap; height: 52px; border-radius: var(--radius-md);">Fetch Rate</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Invoice Items -->
        <div class="form-section">
          <h3 class="form-section-title">${t('invoices.items')}</h3>
          <div class="table-wrapper">
            <table class="invoice-items-table" id="itemsTable">
              <thead>
                <tr>
                  <th style="width: 50%">${t('invoices.itemDescription')}</th>
                  <th style="width: 80px">${t('invoices.itemUnit')}</th>
                  <th style="width: 100px" class="text-right">${t('invoices.itemQuantity')}</th>
                  <th style="width: 120px" class="text-right">${t('invoices.itemPrice')}</th>
                  <th style="width: 80px" class="text-right">VAT %</th>
                  <th style="width: 120px" class="text-right">${t('invoices.itemTotal')}</th>
                  <th style="width: 50px"></th>
                </tr>
              </thead>
              <tbody id="itemsBody">
                ${invoiceItems.map((item, index) => renderItemRow(item, index, catalogProducts)).join('')}
              </tbody>
            </table>
          </div>
          <button type="button" class="btn btn-tonal" id="addItemBtn" style="margin-top: var(--space-4);">
            ${icons.plus}
            ${t('invoices.addItem')}
          </button>
        </div>

        <!-- Totals -->
        <div class="invoice-totals">
          <table class="invoice-totals-table">
            <tr>
              <td class="label">${t('invoices.subtotal')}</td>
              <td class="value" id="subtotalDisplay">0.00 EUR</td>
            </tr>
            <tr>
              <td class="label">${t('invoices.tax')}</td>
              <td class="value" id="taxDisplay">0.00 EUR</td>
            </tr>
            <tr>
              <td class="label"><strong>${t('invoices.total')}</strong></td>
              <td class="value" id="totalDisplay" style="font-weight: 700; font-size: var(--text-title-lg);">0.00 EUR</td>
            </tr>
            <tr>
              <td class="label" id="totalSecondaryLabel">${t('invoices.total')} (${invoice?.secondary_currency || 'RON'})</td>
              <td class="value" id="totalSecondaryDisplay">0.00 RON</td>
            </tr>
          </table>
        </div>

        <!-- Status & Template -->
        <div class="form-section">
          <div class="form-row" style="grid-template-columns: repeat(3, 1fr);">
            <div class="input-group">
              <label class="input-label">${t('invoices.status')}</label>
              <select class="input select" name="status">
                <option value="draft" ${invoice?.status === 'draft' ? 'selected' : ''}>${t('invoices.statusDraft')}</option>
                <option value="sent" ${invoice?.status === 'sent' ? 'selected' : ''}>${t('invoices.statusSent')}</option>
                <option value="paid" ${invoice?.status === 'paid' ? 'selected' : ''}>${t('invoices.statusPaid')}</option>
                <option value="overdue" ${invoice?.status === 'overdue' ? 'selected' : ''}>${t('invoices.statusOverdue')}</option>
                <option value="cancelled" ${invoice?.status === 'cancelled' ? 'selected' : ''}>${t('invoices.statusCancelled')}</option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">${t('invoices.template')}</label>
              <select class="input select" name="template">
                <option value="modern" ${invoice?.template === 'modern' ? 'selected' : ''}>${t('templates.modern')}</option>
                <option value="classic" ${invoice?.template === 'classic' ? 'selected' : ''}>${t('templates.classic')}</option>
                <option value="classicBlue" ${invoice?.template === 'classicBlue' ? 'selected' : ''}>${t('templates.classicBlue')}</option>
                <option value="creative" ${invoice?.template === 'creative' ? 'selected' : ''}>${t('templates.creative')}</option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">${t('invoices.paymentMethod')}</label>
              <input type="text" class="input" name="payment_method" value="${invoice?.payment_method || ''}">
            </div>
          </div>
        </div>

        <!-- Language Settings -->
        <div class="form-section">
          <h3 class="form-section-title">${t('settings.language')}</h3>
          <div class="form-row" style="grid-template-columns: repeat(3, 1fr);">
            <div class="input-group">
              <label class="input-label">Mode</label>
              <select class="input select" name="language_mode" id="languageMode">
                <option value="single" ${invoice?.language_mode === 'single' ? 'selected' : ''}>Single Language</option>
                <option value="dual" ${invoice?.language_mode === 'dual' ? 'selected' : ''}>Dual Language</option>
              </select>
            </div>
            <div class="input-group">
              <label class="input-label">Primary Language</label>
              <select class="input select" name="language">
                <option value="en" ${(invoice?.language || 'en') === 'en' ? 'selected' : ''}>English</option>
                <option value="ro" ${(invoice?.language || 'en') === 'ro' ? 'selected' : ''}>Română</option>
              </select>
            </div>
            <div class="input-group" id="secondaryLanguageGroup" style="display: ${invoice?.language_mode === 'dual' ? 'block' : 'none'};">
              <label class="input-label">Secondary Language</label>
              <select class="input select" name="secondary_language">
                <option value="en" ${(invoice?.secondary_language || 'ro') === 'en' ? 'selected' : ''}>English</option>
                <option value="ro" ${(invoice?.secondary_language || 'ro') === 'ro' ? 'selected' : ''}>Română</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="form-section">
          <div class="input-group">
            <label class="input-label">${t('invoices.notes')}</label>
            <textarea class="input textarea" name="notes" rows="3">${invoice?.notes || draftInvoice.notes || ''}</textarea>
          </div>
        </div>

        <div class="form-actions">
          <a href="#${section.basePath}" class="btn btn-text">${t('actions.cancel')}</a>
          <button type="submit" class="btn btn-filled">${t('actions.save')}</button>
        </div>
      </form>
        `;

    // Initialize Logic
    const form = document.getElementById('invoiceForm');
    const itemsBody = document.getElementById('itemsBody');
    const addItemBtn = document.getElementById('addItemBtn');
    const issueDateInput = document.getElementById('issueDateInput');
    const dueDateInput = document.getElementById('dueDateInput');
    const paymentTermsSelect = document.getElementById('paymentTermsSelect');
    const seriesTemplateSelect = document.getElementById('seriesTemplateSelect');
    const seriesInput = document.getElementById('seriesInput');
    const invoiceNumberInput = document.getElementById('invoiceNumberInput');
    const itemCustomSelects = [];

    const destroyItemCustomSelects = () => {
      itemCustomSelects.forEach((instance) => instance.destroy());
      itemCustomSelects.length = 0;
    };

    const initItemCustomSelects = () => {
      itemsBody.querySelectorAll('.item-product-select, .item-unit').forEach((selectEl) => {
        itemCustomSelects.push(new CustomSelect(selectEl));
      });
    };

    const updateInvoiceNumberFromTemplate = () => {
      if (!seriesTemplateSelect || !seriesInput || !invoiceNumberInput) return;

      const selectedSeriesTemplate = invoiceSeriesTemplates.find((template) => template.id === seriesTemplateSelect.value);
      if (!selectedSeriesTemplate) return;

      seriesInput.value = selectedSeriesTemplate.prefix;
      if (!isEdit) {
        invoiceNumberInput.value = formatSeriesNumber(selectedSeriesTemplate);
      }
    };

    function calculateTotals() {
      let subtotal = 0;
      let totalTax = 0;

      invoiceItems.forEach((item, index) => {
        const quantity = item.quantity || 0;
        const price = item.unit_price || 0;
        const taxRate = item.tax_rate || 0;

        item.total = quantity * price;

        subtotal += item.total;
        totalTax += item.total * (taxRate / 100);

        const row = itemsBody.querySelector(`tr[data-index="${index}"]`);
        if (row) {
          row.querySelector('.item-total').value = item.total.toFixed(2);
        }
      });

      const currency = form.querySelector('[name="currency"]').value;
      const secondaryCurrency = form.querySelector('[name="secondary_currency"]').value;
      const exchangeRate = parseFloat(form.querySelector('[name="exchange_rate"]').value) || 1;

      const total = subtotal + totalTax;
      const totalSecondary = total * exchangeRate;

      if (document.getElementById('subtotalDisplay')) {
        document.getElementById('subtotalDisplay').textContent = `${subtotal.toFixed(2)} ${currency}`;
        document.getElementById('taxDisplay').textContent = `${totalTax.toFixed(2)} ${currency}`;
        document.getElementById('totalDisplay').textContent = `${total.toFixed(2)} ${currency}`;

        document.getElementById('totalSecondaryLabel').textContent = `${t('invoices.total')} (${secondaryCurrency})`;
        document.getElementById('totalSecondaryDisplay').textContent = `${totalSecondary.toFixed(2)} ${secondaryCurrency}`;
        document.getElementById('exchangeRateLabel').textContent = `${t('invoices.exchangeRate')} (${secondaryCurrency})`;
      }
    }

    function updateItemFromRow(index, row) {
      const productSelect = row.querySelector('.item-product-select');
      const productId = productSelect ? parseInt(productSelect.value, 10) : null;
      invoiceItems[index] = {
        product_id: Number.isInteger(productId) ? productId : null,
        description: row.querySelector('.item-description').value,
        unit: row.querySelector('.item-unit').value,
        quantity: parseFloat(row.querySelector('.item-quantity').value) || 0,
        unit_price: parseFloat(row.querySelector('.item-price').value) || 0,
        tax_rate: parseFloat(row.querySelector('.item-tax').value) || 0,
        total: 0,
      };
      calculateTotals();
    }

    function rebuildItemsTable() {
      destroyItemCustomSelects();
      itemsBody.innerHTML = invoiceItems.map((item, index) => renderItemRow(item, index, catalogProducts)).join('');
      attachItemListeners();
      calculateTotals();
    }

    function applyProductToRow(index, row) {
      const select = row.querySelector('.item-product-select');
      if (!select) return;

      const productId = parseInt(select.value, 10);
      if (!Number.isInteger(productId)) {
        updateItemFromRow(index, row);
        return;
      }

      const product = catalogProducts.find((p) => p.id === productId);
      if (!product) {
        updateItemFromRow(index, row);
        return;
      }

      const descriptionInput = row.querySelector('.item-description');
      const unitInput = row.querySelector('.item-unit');
      const quantityInput = row.querySelector('.item-quantity');
      const priceInput = row.querySelector('.item-price');
      const taxInput = row.querySelector('.item-tax');

      descriptionInput.value = product.name || '';
      unitInput.value = product.unit || 'pcs';

      const currentQty = parseFloat(quantityInput.value) || 0;
      quantityInput.value = currentQty > 0 ? String(currentQty) : '1';
      priceInput.value = String(Number(product.unit_price || 0));
      taxInput.value = String(Number(product.tax_rate || 0));

      updateItemFromRow(index, row);
    }

    function attachItemListeners() {
      initItemCustomSelects();
      itemsBody.querySelectorAll('tr').forEach((row, index) => {
        row.querySelectorAll('.item-description, .item-unit, .item-quantity, .item-price, .item-tax').forEach(input => {
          input.addEventListener('input', () => updateItemFromRow(index, row));
          input.addEventListener('change', () => updateItemFromRow(index, row));
        });

        row.querySelector('.item-product-select')?.addEventListener('change', () => {
          applyProductToRow(index, row);
        });

        row.querySelector('.item-delete-btn').addEventListener('click', () => {
          if (invoiceItems.length > 1) {
            invoiceItems.splice(index, 1);
            rebuildItemsTable();
          }
        });
      });
    }

    // Date Logic
    function updateDueDate() {
      const days = parseInt(paymentTermsSelect.value);
      if (isNaN(days)) return; // custom

      const issueDate = new Date(issueDateInput.value);
      if (isNaN(issueDate.getTime())) return;

      const dueDate = new Date(issueDate);
      dueDate.setDate(dueDate.getDate() + days);

      dueDateInput.value = dueDate.toISOString().split('T')[0];
    }

    function checkPaymentTerms() {
      const issueDate = new Date(issueDateInput.value);
      const dueDate = new Date(dueDateInput.value);

      if (isNaN(issueDate.getTime()) || isNaN(dueDate.getTime())) return;

      const diffTime = dueDate - issueDate;
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      const options = Array.from(paymentTermsSelect.options).map(o => o.value);
      if (options.includes(diffDays.toString())) {
        paymentTermsSelect.value = diffDays.toString();
      } else {
        paymentTermsSelect.value = 'custom';
      }
    }

    if (issueDateInput && paymentTermsSelect && dueDateInput) {
      issueDateInput.addEventListener('change', () => {
        if (paymentTermsSelect.value !== 'custom') {
          updateDueDate();
        }
      });

      paymentTermsSelect.addEventListener('change', updateDueDate);
      dueDateInput.addEventListener('change', checkPaymentTerms);
    }

    // BNR Fetch
    const fetchBnrBtn = document.getElementById('fetchBnrBtn');
    const exchangeRateInput = document.getElementById('exchangeRateInput');
    const currencyInput = form.querySelector('[name="currency"]');
    const secondaryCurrencyInput = form.querySelector('[name="secondary_currency"]');

    const fetchAndApplyExchangeRate = async (showToast = false) => {
      if (!fetchBnrBtn || !exchangeRateInput || !currencyInput || !secondaryCurrencyInput) return;

      try {
        const currency = currencyInput.value;
        const secondaryCurrency = secondaryCurrencyInput.value;

        if (currency === secondaryCurrency) {
          exchangeRateInput.value = 1;
          calculateTotals();
          if (showToast) {
            toast.info('Currencies are the same');
          }
          return;
        }

        fetchBnrBtn.textContent = '...';
        fetchBnrBtn.disabled = true;

        const date = issueDateInput ? issueDateInput.value : null;

        // Get rates needed for cross calculation (both relative to RON)
        const rateA = await bnrService.getExchangeRate(currency, date);
        const rateB = await bnrService.getExchangeRate(secondaryCurrency, date);

        // Cross rate = RateA / RateB
        const rate = rateA / rateB;

        exchangeRateInput.value = rate.toFixed(4);
        calculateTotals();
        if (showToast) {
          toast.success(`Updated rate: 1 ${currency} = ${rate.toFixed(4)} ${secondaryCurrency}`);
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to fetch BNR rate: ' + error.message);
      } finally {
        fetchBnrBtn.textContent = 'Fetch Rate';
        fetchBnrBtn.disabled = false;
      }
    };

    if (fetchBnrBtn && exchangeRateInput) {
      fetchBnrBtn.addEventListener('click', async () => {
        await fetchAndApplyExchangeRate(true);
      });
    }

    if (seriesTemplateSelect) {
      seriesTemplateSelect.addEventListener('change', updateInvoiceNumberFromTemplate);
      updateInvoiceNumberFromTemplate();
    }

    // Add item button
    addItemBtn.addEventListener('click', () => {
      const defaultTaxRate = parseFloat(form.querySelector('[name="tax_rate"]').value) || 0;
      invoiceItems.push({ product_id: null, description: '', unit: 'hrs', quantity: 1, unit_price: 0, tax_rate: defaultTaxRate, total: 0 });
      rebuildItemsTable();
    });

    // Recalculate on currency/rate change
    currencyInput.addEventListener('change', async () => {
      calculateTotals();
      await fetchAndApplyExchangeRate(false);
    });
    secondaryCurrencyInput.addEventListener('change', async () => {
      calculateTotals();
      await fetchAndApplyExchangeRate(false);
    });
    form.querySelector('[name="exchange_rate"]').addEventListener('input', calculateTotals);
    form.querySelector('[name="tax_rate"]').addEventListener('input', calculateTotals);

    // Language mode toggle
    const languageMode = document.getElementById('languageMode');
    const secondaryGroup = document.getElementById('secondaryLanguageGroup');
    if (languageMode && secondaryGroup) {
      languageMode.addEventListener('change', (e) => {
        secondaryGroup.style.display = e.target.value === 'dual' ? 'block' : 'none';
      });
    }

    // Initial setup
    attachItemListeners();
    calculateTotals();

    // Initialize Custom Selects
    document.querySelectorAll('.form-section .select').forEach(el => {
      new CustomSelect(el);
    });

    // Form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      try {
        const formData = new FormData(form);
        const data = {
          invoice_number: formData.get('invoice_number'),
          series: formData.get('series'),
          client_id: parseInt(formData.get('client_id')),
          issue_date: formData.get('issue_date'),
          due_date: formData.get('due_date'),
          currency: formData.get('currency'),
          exchange_rate: parseFloat(formData.get('exchange_rate')) || 1,
          tax_rate: parseFloat(formData.get('tax_rate')) || 0,
          payment_method: formData.get('payment_method'),
          notes: formData.get('notes'),
          status: formData.get('status'),
          template: formData.get('template'),
          language: formData.get('language'),
          secondary_language: formData.get('secondary_language'),
          language_mode: formData.get('language_mode'),
          secondary_currency: formData.get('secondary_currency') || 'RON',
          document_type: section.documentType,
        };

        if (isEdit) {
          await invoiceService.update(parseInt(params.id), data, invoiceItems, {
            related_delivery_note_ids: relatedDeliveryNoteIds,
          });
        } else {
          const selectedSeriesTemplateId = formData.get('series_template_id');
          await invoiceService.create(data, invoiceItems, {
            related_delivery_note_ids: relatedDeliveryNoteIds,
          });
          await settingsService.consumeSeriesTemplateNumber(selectedSeriesTemplateId);
        }

        toast.success(section.saveSuccess);
        router.navigate(section.basePath);
      } catch (error) {
        console.error('Save error:', error);
        toast.error(error.message || 'Failed to save invoice');
      }
    });

  } catch (error) {
    console.error('Failed to init invoice form:', error);
    toast.error(error.message || 'Failed to load invoice data');
    const fallbackPath = params.from_delivery_notes ? '/delivery-notes' : getDocumentFormConfig(params).basePath;
    router.navigate(fallbackPath);
  }
}

function renderItemRow(item, index, products = []) {
  const options = products.map((product) => `
    <option value="${product.id}" ${Number(item.product_id) === Number(product.id) ? 'selected' : ''}>
      ${escapeHtml(product.name)}${product.product_code ? ` (${escapeHtml(product.product_code)})` : ''}
    </option>
  `).join('');

  return `
    <tr data-index="${index}">
      <td>
        <div class="item-product-picker">
          <select class="input item-product-select" data-searchable="true" data-search-placeholder="${t('actions.search')}...">
            <option value="">${t('invoices.selectProductServicePlaceholder')}</option>
            ${options}
          </select>
        </div>
        <input type="text" class="input item-description" value="${item.description || ''}" placeholder="${t('invoices.itemDescription')}">
      </td>
      <td>
        <select class="input item-unit">
          <option value="hrs" ${item.unit === 'hrs' ? 'selected' : ''}>${t('invoices.unitHours')}</option>
          <option value="pcs" ${item.unit === 'pcs' ? 'selected' : ''}>${t('invoices.unitPiece')}</option>
          <option value="srv" ${item.unit === 'srv' ? 'selected' : ''}>${t('invoices.unitService')}</option>
          <option value="day" ${item.unit === 'day' ? 'selected' : ''}>${t('invoices.unitDay')}</option>
        </select>
      </td>
      <td>
        <input type="number" class="input input-number item-quantity" value="${item.quantity || 1}" min="0" step="0.01">
      </td>
      <td>
        <input type="number" class="input input-number item-price" value="${item.unit_price || 0}" min="0" step="0.01">
      </td>
      <td>
        <input type="number" class="input input-number item-tax" value="${item.tax_rate || 0}" min="0" step="0.1">
      </td>
      <td>
        <input type="text" class="input input-number item-total" value="${(item.total || 0).toFixed(2)}" readonly>
      </td>
      <td>
        <button type="button" class="btn btn-icon item-delete-btn" title="Remove Item">
          ${icons.trash}
        </button>
      </td>
    </tr>
  `;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
