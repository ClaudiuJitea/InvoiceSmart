import { modal } from './Modal.js';
import { t } from '../../i18n/index.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getConfidenceChipClass(confidence) {
  if (confidence === 'high') return 'chip-success';
  if (confidence === 'medium') return 'chip-warning';
  return 'chip-error';
}

function formatOptionalValue(value) {
  const normalized = String(value || '').trim();
  return normalized ? escapeHtml(normalized) : '-';
}

export function openInvoiceImportReviewModal({
  title,
  fieldLabels = {},
  currentValues = {},
  review = {},
  warnings = [],
  clientMatch = {},
  items = [],
  currentItemCount = 0,
  onApply,
}) {
  const fieldEntries = Object.entries(review).filter(([, item]) => String(item?.value || '').trim());
  const extractedItems = Array.isArray(items) ? items : [];
  const matchedClient = clientMatch?.matchedClient || null;
  const extractedClient = clientMatch?.extractedClient || {};
  const hasClientSection = matchedClient || String(extractedClient.name || extractedClient.cif || '').trim();

  if (fieldEntries.length === 0 && extractedItems.length === 0 && !hasClientSection) {
    throw new Error(t('ai.noFieldsExtracted'));
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <form id="invoiceImportReviewForm" class="extraction-review invoice-import-review">
      <div class="invoice-import-review-body">
        <p class="document-series-subtitle">${t('ai.invoiceImportHint')}</p>

        ${warnings.length > 0 ? `
          <div class="extraction-review-warnings">
            <strong>${t('ai.warningsTitle')}</strong>
            <ul>
              ${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${fieldEntries.length > 0 ? `
          <div class="table-container extraction-review-table-wrap">
            <table class="table extraction-review-table">
              <thead>
                <tr>
                  <th>${t('ai.applyColumn')}</th>
                  <th>${t('ai.fieldColumn')}</th>
                  <th>${t('ai.currentValueColumn')}</th>
                  <th>${t('ai.extractedValueColumn')}</th>
                  <th>${t('ai.confidenceColumn')}</th>
                </tr>
              </thead>
              <tbody>
                ${fieldEntries.map(([key, item]) => `
                  <tr>
                    <td class="text-center">
                      <input type="checkbox" name="apply_${escapeHtml(key)}" checked>
                    </td>
                    <td>
                      <div class="extraction-review-label">${escapeHtml(fieldLabels[key] || key)}</div>
                    </td>
                    <td>
                      <div class="extraction-review-current">${formatOptionalValue(currentValues[key])}</div>
                    </td>
                    <td>
                      <div class="extraction-review-extracted">${escapeHtml(item.value)}</div>
                      ${item.note ? `<div class="extraction-review-note">${escapeHtml(item.note)}</div>` : ''}
                    </td>
                    <td>
                      <span class="chip ${getConfidenceChipClass(item.confidence)}">${escapeHtml(t(`ai.confidence.${item.confidence}`))}</span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${hasClientSection ? `
          <section class="invoice-import-section">
            <div class="invoice-import-section-header">
              <div>
                <h3 class="form-section-title">${t('ai.detectedClient')}</h3>
                <p class="document-series-subtitle">${matchedClient ? t('ai.detectedClientMatchHint') : t('ai.manualClientSelectionHint')}</p>
              </div>
            </div>

            <div class="invoice-import-client-card">
              <div class="invoice-import-client-head">
                <div>
                  <div class="invoice-import-client-name">${formatOptionalValue(extractedClient.name)}</div>
                  <div class="invoice-import-client-meta">
                    ${t('clients.cif')}: ${formatOptionalValue(extractedClient.cif)}
                  </div>
                </div>
                ${matchedClient ? `<span class="chip chip-success">${escapeHtml(t(clientMatch.matchReasonKey || 'ai.matchedByName'))}</span>` : ''}
              </div>

              ${matchedClient ? `
                <div class="invoice-import-client-match">
                  <label class="invoice-import-checkbox">
                    <input type="checkbox" name="apply_matched_client" checked>
                    <span>${t('ai.applyMatchedClient')}: ${escapeHtml(matchedClient.name)}${matchedClient.cif ? ` (${escapeHtml(matchedClient.cif)})` : ''}</span>
                  </label>
                </div>
              ` : `
                <p class="invoice-import-helper">${t('ai.clientMatchMissing')}</p>
              `}
            </div>
          </section>
        ` : ''}

        <section class="invoice-import-section">
          <div class="invoice-import-section-header">
            <div>
              <h3 class="form-section-title">${t('ai.detectedItems')}</h3>
              <p class="document-series-subtitle">${t('ai.replaceItemsHint')}</p>
            </div>
            <div class="invoice-import-meta">
              <span>${t('ai.currentItemsCount', { count: currentItemCount })}</span>
              <span>${t('ai.extractedItemsCount', { count: extractedItems.length })}</span>
            </div>
          </div>

          ${extractedItems.length > 0 ? `
            <label class="invoice-import-checkbox">
              <input type="checkbox" name="apply_items" checked>
              <span>${t('ai.replaceItems')}</span>
            </label>

            <div class="table-container extraction-review-table-wrap">
              <table class="table extraction-review-table">
                <thead>
                  <tr>
                    <th>${t('invoices.itemDescription')}</th>
                    <th>${t('invoices.itemUnit')}</th>
                    <th>${t('invoices.itemQuantity')}</th>
                    <th>${t('invoices.itemPrice')}</th>
                    <th>${t('productsServices.taxRate')}</th>
                    <th>${t('ai.confidenceColumn')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${extractedItems.map((item) => `
                    <tr>
                      <td>
                        <div class="extraction-review-extracted">${escapeHtml(item.description)}</div>
                        ${item.note ? `<div class="extraction-review-note">${escapeHtml(item.note)}</div>` : ''}
                      </td>
                      <td>${escapeHtml(item.unit || 'pcs')}</td>
                      <td>${escapeHtml(String(item.quantity ?? ''))}</td>
                      <td>${escapeHtml(String(item.unit_price ?? ''))}</td>
                      <td>${escapeHtml(String(item.tax_rate ?? ''))}</td>
                      <td>
                        <span class="chip ${getConfidenceChipClass(item.confidence)}">${escapeHtml(t(`ai.confidence.${item.confidence}`))}</span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <p class="invoice-import-helper">${t('ai.noItemsExtracted')}</p>
          `}
        </section>
      </div>

      <div class="modal-actions invoice-import-review-actions">
        <button type="button" class="btn btn-text" id="cancelInvoiceImportReviewBtn">${t('actions.cancel')}</button>
        <button type="submit" class="btn btn-filled">${t('ai.importSelected')}</button>
      </div>
    </form>
  `;

  const form = wrapper.querySelector('#invoiceImportReviewForm');
  form.querySelector('#cancelInvoiceImportReviewBtn')?.addEventListener('click', () => {
    modal.close();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const selectedFields = {};
    fieldEntries.forEach(([key, item]) => {
      if (form.elements.namedItem(`apply_${key}`)?.checked) {
        selectedFields[key] = item.value;
      }
    });

    modal.close();
    if (typeof onApply === 'function') {
      onApply({
        selectedFields,
        applyItems: Boolean(form.elements.namedItem('apply_items')?.checked),
        applyClient: Boolean(form.elements.namedItem('apply_matched_client')?.checked),
      });
    }
  });

  modal.show({
    title,
    content: wrapper,
    size: 'xl',
  });
}

export default openInvoiceImportReviewModal;
