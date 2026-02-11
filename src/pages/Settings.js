// Settings Page
import { t, i18n } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { settingsService } from '../db/services/settingsService.js';
import { toast } from '../components/common/Toast.js';
import { CustomSelect } from '../components/common/CustomSelect.js';
import { modal, confirm } from '../components/common/Modal.js';
import {
  createSeriesTemplate,
  formatSeriesNumber,
  getSeriesTemplatesForDocument,
  normalizeSeriesTemplates,
} from '../utils/seriesTemplates.js';

const DOCUMENT_TYPES = ['invoice', 'quote', 'receipt', 'delivery_note'];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getDocumentTypeLabel(type) {
  const keyMap = {
    invoice: 'settings.documentTypeInvoice',
    proforma: 'settings.documentTypeQuote',
    quote: 'settings.documentTypeQuote',
    receipt: 'settings.documentTypeReceipt',
    delivery_note: 'settings.documentTypeDeliveryNote',
  };

  return t(keyMap[type] || keyMap.invoice);
}

function renderSettingsForm(settings, locales) {
  const templates = normalizeSeriesTemplates(settings || {});

  return `
    <form id="settingsForm" class="card card-elevated">
      <!-- Company Details -->
      <div class="form-section">
        <h3 class="form-section-title">${t('settings.companyDetails')}</h3>
        <div class="form-row">
          <div class="input-group">
            <label class="input-label">${t('settings.companyName')}</label>
            <input type="text" class="input" name="company_name" value="${escapeHtml(settings.company_name || '')}">
          </div>
        </div>
        <div class="form-row">
          <div class="input-group">
            <label class="input-label">${t('settings.companyCif')}</label>
            <input type="text" class="input" name="company_cif" value="${escapeHtml(settings.company_cif || '')}" placeholder="e.g., RO12345678">
          </div>
          <div class="input-group">
            <label class="input-label">${t('settings.companyRegNo')}</label>
            <input type="text" class="input" name="company_reg_no" value="${escapeHtml(settings.company_reg_no || '')}" placeholder="e.g., J40/123/2020">
          </div>
        </div>
        <div class="form-row">
          <div class="input-group">
            <label class="input-label">${t('settings.companyAddress')}</label>
            <textarea class="input textarea" name="company_address" rows="3">${escapeHtml(settings.company_address || '')}</textarea>
          </div>
        </div>
        <div class="form-row">
          <div class="input-group">
            <label class="input-label">${t('settings.companyCity')}</label>
            <input type="text" class="input" name="company_city" value="${escapeHtml(settings.company_city || '')}">
          </div>
          <div class="input-group">
            <label class="input-label">${t('settings.companyCountry')}</label>
            <input type="text" class="input" name="company_country" value="${escapeHtml(settings.company_country || '')}">
          </div>
        </div>
        <div class="form-row">
          <div class="input-group">
            <label class="input-label">${t('settings.companyEmail')}</label>
            <input type="email" class="input" name="company_email" value="${escapeHtml(settings.company_email || '')}">
          </div>
          <div class="input-group">
            <label class="input-label">${t('settings.companyPhone')}</label>
            <input type="tel" class="input" name="company_phone" value="${escapeHtml(settings.company_phone || '')}">
          </div>
        </div>
      </div>

      <!-- Bank Details -->
      <div class="form-section">
        <h3 class="form-section-title">${t('settings.bankDetails')}</h3>
        <div class="form-row">
          <div class="input-group">
            <label class="input-label">${t('settings.bankAccount')}</label>
            <input type="text" class="input" name="company_bank_account" value="${escapeHtml(settings.company_bank_account || '')}" placeholder="IBAN">
          </div>
        </div>
        <div class="form-row">
          <div class="input-group">
            <label class="input-label">${t('settings.bankSwift')}</label>
            <input type="text" class="input" name="company_swift" value="${escapeHtml(settings.company_swift || '')}">
          </div>
          <div class="input-group">
            <label class="input-label">${t('settings.bankName')}</label>
            <input type="text" class="input" name="company_bank_name" value="${escapeHtml(settings.company_bank_name || '')}">
          </div>
        </div>
      </div>

      <!-- Invoice Settings -->
      <div class="form-section">
        <h3 class="form-section-title">${t('settings.invoiceSettings')}</h3>
        <div class="form-row">
          <div class="input-group">
            <label class="input-label">${t('settings.defaultCurrency')}</label>
            <select class="input select" name="default_currency">
              <option value="EUR" ${settings.default_currency === 'EUR' ? 'selected' : ''}>EUR</option>
              <option value="RON" ${settings.default_currency === 'RON' ? 'selected' : ''}>RON</option>
              <option value="USD" ${settings.default_currency === 'USD' ? 'selected' : ''}>USD</option>
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">${t('settings.secondaryCurrency')}</label>
            <select class="input select" name="secondary_currency">
              <option value="RON" ${settings.secondary_currency === 'RON' ? 'selected' : ''}>RON</option>
              <option value="EUR" ${settings.secondary_currency === 'EUR' ? 'selected' : ''}>EUR</option>
              <option value="USD" ${settings.secondary_currency === 'USD' ? 'selected' : ''}>USD</option>
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">${t('settings.defaultPaymentTerms')}</label>
            <input type="number" class="input" name="default_payment_terms" value="${settings.default_payment_terms || 30}" min="0">
          </div>
        </div>
      </div>

      <!-- App Settings -->
      <div class="form-section">
        <h3 class="form-section-title">${t('settings.appSettings')}</h3>
        <div class="form-row">
          <div class="input-group">
            <label class="input-label">${t('settings.language')}</label>
            <select class="input select" name="language">
              ${locales.map(locale => `
                <option value="${locale.code}" ${settings.language === locale.code ? 'selected' : ''}>
                  ${locale.flag} ${locale.name}
                </option>
              `).join('')}
            </select>
          </div>
        </div>
      </div>

      <!-- Document Series Templates -->
      <div class="form-section">
        <div class="document-series-header">
          <div>
            <h3 class="form-section-title">${t('settings.documentSeriesTemplates')}</h3>
            <p class="document-series-subtitle">${t('settings.manageDocumentSeries')}</p>
          </div>
          <button type="button" class="btn btn-tonal" id="addSeriesTemplateBtn">
            ${icons.plus}
            ${t('settings.addSeriesTemplate')}
          </button>
        </div>

        <div id="seriesTemplatesList" class="series-templates-list">
          ${templates.length === 0 ? `
            <div class="document-series-empty">${t('settings.noSeriesTemplates')}</div>
          ` : `
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>${t('settings.documentType')}</th>
                    <th>${t('settings.prefix')}</th>
                    <th>${t('settings.separator')}</th>
                    <th>${t('settings.nextNumber')}</th>
                    <th>${t('settings.example')}</th>
                    <th>${t('settings.isDefault')}</th>
                    <th class="text-right">${t('actions.edit')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${templates.map((template) => `
                    <tr>
                      <td>${getDocumentTypeLabel(template.document_type)}</td>
                      <td><strong>${escapeHtml(template.prefix)}</strong></td>
                      <td>${escapeHtml(template.separator || '')}</td>
                      <td>${template.next_number}</td>
                      <td>${escapeHtml(formatSeriesNumber(template))}</td>
                      <td>${template.is_default ? t('settings.yes') : t('settings.no')}</td>
                      <td class="text-right">
                        <div class="document-series-actions">
                          <button type="button" class="btn btn-icon edit-series-btn" data-id="${template.id}" title="${t('actions.edit')}">
                            ${icons.edit}
                          </button>
                          <button type="button" class="btn btn-icon delete-series-btn" data-id="${template.id}" title="${t('actions.delete')}">
                            ${icons.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-filled">${t('actions.save')}</button>
      </div>
    </form>
  `;
}

function openSeriesTemplateModal({ templates, onSave, template = null }) {
  const isEdit = Boolean(template);

  const form = document.createElement('form');
  form.id = 'seriesTemplateForm';
  form.innerHTML = `
    <div class="form-row series-template-grid-top">
      <div class="input-group">
        <label class="input-label">${t('settings.documentType')}</label>
        <select class="input select" name="document_type" required ${isEdit ? 'disabled' : ''}>
          ${DOCUMENT_TYPES.map((docType) => `
            <option value="${docType}" ${(template?.document_type || 'invoice') === docType ? 'selected' : ''}>
              ${getDocumentTypeLabel(docType)}
            </option>
          `).join('')}
        </select>
      </div>
    </div>

    <div class="form-row series-template-grid-main">
      <div class="input-group">
        <label class="input-label">${t('settings.prefix')}</label>
        <input type="text" class="input" name="prefix" value="${escapeHtml(template?.prefix || '')}" maxlength="15" required>
      </div>
      <div class="input-group">
        <label class="input-label">${isEdit ? t('settings.nextNumber') : t('settings.startNumber')}</label>
        <input type="number" class="input" name="next_number" value="${template?.next_number || 1}" min="1" required>
      </div>
    </div>

    <div class="form-row series-template-grid-bottom">
      <div class="input-group">
        <label class="input-label">${t('settings.separator')}</label>
        <input type="text" class="input" name="separator" value="${escapeHtml(template?.separator ?? '-')}" maxlength="3">
      </div>
      <div class="input-group">
        <label class="input-label">${t('settings.isDefault')}</label>
        <label class="series-default-toggle" for="isDefaultSeriesTemplate">
          <span class="toggle-switch">
            <input id="isDefaultSeriesTemplate" type="checkbox" name="is_default" ${template?.is_default ? 'checked' : ''}>
          </span>
          <span>${t('settings.makeDefault')}</span>
        </label>
      </div>
    </div>

    <div class="modal-actions">
      <button type="button" class="btn btn-text" id="cancelSeriesTemplateBtn">${t('actions.cancel')}</button>
      <button type="submit" class="btn btn-filled">${t('actions.save')}</button>
    </div>
  `;

  modal.show({
    title: isEdit ? t('settings.editSeriesTemplate') : t('settings.addSeriesTemplate'),
    content: form,
  });

  form.querySelector('#cancelSeriesTemplateBtn')?.addEventListener('click', () => {
    modal.close();
  });

  const selectEl = form.querySelector('select.select');
  if (selectEl) {
    new CustomSelect(selectEl);
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const prefix = String(formData.get('prefix') || '').trim().toUpperCase();
    if (!prefix) {
      toast.error(t('validation.required'));
      return;
    }

    const documentType = isEdit ? template.document_type : String(formData.get('document_type') || 'invoice');
    const nextNumber = Math.max(1, parseInt(formData.get('next_number'), 10) || 1);
    const separator = String(formData.get('separator') ?? '-');
    const isDefault = formData.get('is_default') === 'on';

    const updatedTemplates = templates.map((item) => ({ ...item }));

    if (isEdit) {
      const targetIndex = updatedTemplates.findIndex((item) => item.id === template.id);
      if (targetIndex === -1) return;

      updatedTemplates[targetIndex] = {
        ...updatedTemplates[targetIndex],
        prefix,
        separator,
        next_number: nextNumber,
        is_default: isDefault,
      };
    } else {
      const sameTypeTemplates = getSeriesTemplatesForDocument(updatedTemplates, documentType);
      const newTemplate = createSeriesTemplate({
        documentType,
        prefix,
        separator,
        startNumber: nextNumber,
        isDefault: isDefault || sameTypeTemplates.length === 0,
      });
      updatedTemplates.push(newTemplate);
    }

    if (isDefault) {
      updatedTemplates.forEach((item) => {
        if (item.document_type === documentType) {
          item.is_default = item.id === (template?.id || updatedTemplates[updatedTemplates.length - 1].id);
        }
      });
    }

    const sameTypeTemplates = getSeriesTemplatesForDocument(updatedTemplates, documentType);
    if (!sameTypeTemplates.some((item) => item.is_default)) {
      const firstIndex = updatedTemplates.findIndex((item) => item.document_type === documentType);
      if (firstIndex >= 0) updatedTemplates[firstIndex].is_default = true;
    }

    onSave(updatedTemplates);
    modal.close();
  });
}

export function renderSettings() {
  return `
    <div class="page-container" style="max-width: 1000px;">
      <div class="page-header-row">
        <div class="page-header-left">
          <h1 class="page-title">${t('settings.title')}</h1>
          <p class="page-subtitle">${t('settings.subtitle')}</p>
        </div>
      </div>

      <div id="settingsFormContainer" class="card card-elevated" style="padding: 40px; text-align: center;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 10px; color: var(--md-on-surface-variant);">Loading...</p>
      </div>
    </div>
  `;
}

export async function initSettings() {
  const container = document.getElementById('settingsFormContainer');
  if (!container) return;

  try {
    const [settings, locales] = await Promise.all([
      settingsService.get(),
      Promise.resolve(i18n.getLocales()),
    ]);

    let draftSettings = { ...settings };
    let templatesState = normalizeSeriesTemplates(settings || {});

    const collectCurrentFormState = (form) => {
      if (!form) return;
      const formData = new FormData(form);
      draftSettings = {
        ...draftSettings,
        company_name: formData.get('company_name'),
        company_cif: formData.get('company_cif'),
        company_reg_no: formData.get('company_reg_no'),
        company_address: formData.get('company_address'),
        company_city: formData.get('company_city'),
        company_country: formData.get('company_country'),
        company_email: formData.get('company_email'),
        company_phone: formData.get('company_phone'),
        company_bank_account: formData.get('company_bank_account'),
        company_swift: formData.get('company_swift'),
        company_bank_name: formData.get('company_bank_name'),
        default_currency: formData.get('default_currency'),
        secondary_currency: formData.get('secondary_currency'),
        default_payment_terms: parseInt(formData.get('default_payment_terms'), 10) || 30,
        language: formData.get('language'),
      };
    };

    const renderForm = () => {
      container.classList.remove('card', 'card-elevated');
      container.style.padding = '0';
      container.style.textAlign = 'left';
      container.innerHTML = renderSettingsForm({
        ...draftSettings,
        document_series_templates: templatesState,
      }, locales);

      const form = document.getElementById('settingsForm');
      if (!form) return;

      form.querySelectorAll('.select').forEach((el) => {
        new CustomSelect(el);
      });

      document.getElementById('addSeriesTemplateBtn')?.addEventListener('click', () => {
        collectCurrentFormState(form);
        openSeriesTemplateModal({
          templates: templatesState,
          onSave: (updatedTemplates) => {
            templatesState = normalizeSeriesTemplates({ document_series_templates: updatedTemplates });
            renderForm();
          },
        });
      });

      form.querySelectorAll('.edit-series-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          collectCurrentFormState(form);
          const template = templatesState.find((item) => item.id === btn.dataset.id);
          if (!template) return;

          openSeriesTemplateModal({
            templates: templatesState,
            template,
            onSave: (updatedTemplates) => {
              templatesState = normalizeSeriesTemplates({ document_series_templates: updatedTemplates });
              renderForm();
            },
          });
        });
      });

      form.querySelectorAll('.delete-series-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          collectCurrentFormState(form);
          const template = templatesState.find((item) => item.id === btn.dataset.id);
          if (!template) return;

          const sameTypeTemplates = templatesState.filter((item) => item.document_type === template.document_type);
          if (sameTypeTemplates.length === 1) {
            toast.error(t('settings.cannotDeleteLastSeries'));
            return;
          }

          confirm({
            title: t('settings.deleteSeriesTemplate'),
            message: t('settings.confirmDeleteSeries'),
            confirmText: t('actions.delete'),
            cancelText: t('actions.cancel'),
            onConfirm: () => {
              const remaining = templatesState.filter((item) => item.id !== template.id);
              const sameTypeRemaining = remaining.filter((item) => item.document_type === template.document_type);
              if (!sameTypeRemaining.some((item) => item.is_default) && sameTypeRemaining.length > 0) {
                const firstRemaining = remaining.find((item) => item.document_type === template.document_type);
                if (firstRemaining) firstRemaining.is_default = true;
              }

              templatesState = normalizeSeriesTemplates({ document_series_templates: remaining });
              toast.success(t('settings.seriesDeleted'));
              renderForm();
            },
          });
        });
      });

      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = {
          ...draftSettings,
          company_name: formData.get('company_name'),
          company_cif: formData.get('company_cif'),
          company_reg_no: formData.get('company_reg_no'),
          company_address: formData.get('company_address'),
          company_city: formData.get('company_city'),
          company_country: formData.get('company_country'),
          company_email: formData.get('company_email'),
          company_phone: formData.get('company_phone'),
          company_bank_account: formData.get('company_bank_account'),
          company_swift: formData.get('company_swift'),
          company_bank_name: formData.get('company_bank_name'),
          default_currency: formData.get('default_currency'),
          secondary_currency: formData.get('secondary_currency'),
          default_payment_terms: parseInt(formData.get('default_payment_terms'), 10) || 30,
          language: formData.get('language'),
          document_series_templates: templatesState,
        };

        await settingsService.update(data);
        draftSettings = { ...data };

        if (data.language !== i18n.locale) {
          i18n.locale = data.language;
        }

        toast.success(t('settings.saveSuccess'));
        window.dispatchEvent(new CustomEvent('app:refresh'));
      });
    };

    renderForm();
  } catch (error) {
    console.error('Failed to load settings:', error);
    container.innerHTML = '<p style="color: var(--md-error);">Failed to load settings.</p>';
  }
}
