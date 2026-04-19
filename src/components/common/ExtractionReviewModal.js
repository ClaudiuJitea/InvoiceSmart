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

export function openExtractionReviewModal({
  title,
  fieldLabels = {},
  currentValues = {},
  review = {},
  warnings = [],
  onApply,
}) {
  const entries = Object.entries(review).filter(([, item]) => String(item?.value || '').trim());

  if (entries.length === 0) {
    throw new Error(t('ai.noFieldsExtracted'));
  }

  const wrapper = document.createElement('div');
  wrapper.innerHTML = `
    <form id="extractionReviewForm" class="extraction-review">
      <p class="document-series-subtitle">${t('ai.reviewHint')}</p>

      ${warnings.length > 0 ? `
        <div class="extraction-review-warnings">
          <strong>${t('ai.warningsTitle')}</strong>
          <ul>
            ${warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join('')}
          </ul>
        </div>
      ` : ''}

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
            ${entries.map(([key, item]) => `
              <tr>
                <td class="text-center">
                  <input type="checkbox" class="bulk-select-checkbox" name="apply_${escapeHtml(key)}" checked>
                </td>
                <td>
                  <div class="extraction-review-label">${escapeHtml(fieldLabels[key] || key)}</div>
                </td>
                <td>
                  <div class="extraction-review-current">${escapeHtml(currentValues[key] || '-')}</div>
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

      <div class="modal-actions">
        <button type="button" class="btn btn-text" id="cancelExtractionReviewBtn">${t('actions.cancel')}</button>
        <button type="submit" class="btn btn-filled">${t('ai.applySelected')}</button>
      </div>
    </form>
  `;

  const form = wrapper.querySelector('#extractionReviewForm');
  form.querySelector('#cancelExtractionReviewBtn')?.addEventListener('click', () => {
    modal.close();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const selected = {};
    entries.forEach(([key, item]) => {
      if (form.elements.namedItem(`apply_${key}`)?.checked) {
        selected[key] = item.value;
      }
    });

    modal.close();
    if (typeof onApply === 'function') {
      onApply(selected);
    }
  });

  modal.show({
    title,
    content: wrapper,
    size: 'lg',
  });
}

export default openExtractionReviewModal;
