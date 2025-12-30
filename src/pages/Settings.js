// Settings Page
import { t, i18n } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { settingsService } from '../db/services/settingsService.js';
import { toast } from '../components/common/Toast.js';

export function renderSettings() {
  const settings = settingsService.get() || {};
  const locales = i18n.getLocales();

  return `
    <div class="page-container" style="max-width: 900px;">
      <div class="page-header-row">
        <div class="page-header-left">
          <h1 class="page-title">${t('settings.title')}</h1>
          <p class="page-subtitle">${t('settings.subtitle')}</p>
        </div>
      </div>

      <form id="settingsForm" class="card card-elevated">
        <!-- Company Details -->
        <div class="form-section">
          <h3 class="form-section-title">${t('settings.companyDetails')}</h3>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">${t('settings.companyName')}</label>
              <input type="text" class="input" name="company_name" value="${settings.company_name || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">${t('settings.companyCif')}</label>
              <input type="text" class="input" name="company_cif" value="${settings.company_cif || ''}" placeholder="e.g., RO12345678">
            </div>
            <div class="input-group">
              <label class="input-label">${t('settings.companyRegNo')}</label>
              <input type="text" class="input" name="company_reg_no" value="${settings.company_reg_no || ''}" placeholder="e.g., J40/123/2020">
            </div>
          </div>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">${t('settings.companyAddress')}</label>
              <textarea class="input textarea" name="company_address" rows="3">${settings.company_address || ''}</textarea>
            </div>
          </div>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">${t('settings.companyCity')}</label>
              <input type="text" class="input" name="company_city" value="${settings.company_city || ''}">
            </div>
            <div class="input-group">
              <label class="input-label">${t('settings.companyCountry')}</label>
              <input type="text" class="input" name="company_country" value="${settings.company_country || ''}">
            </div>
          </div>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">${t('settings.companyEmail')}</label>
              <input type="email" class="input" name="company_email" value="${settings.company_email || ''}">
            </div>
            <div class="input-group">
              <label class="input-label">${t('settings.companyPhone')}</label>
              <input type="tel" class="input" name="company_phone" value="${settings.company_phone || ''}">
            </div>
          </div>
        </div>

        <!-- Bank Details -->
        <div class="form-section">
          <h3 class="form-section-title">${t('settings.bankDetails')}</h3>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">${t('settings.bankAccount')}</label>
              <input type="text" class="input" name="company_bank_account" value="${settings.company_bank_account || ''}" placeholder="IBAN">
            </div>
          </div>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">${t('settings.bankSwift')}</label>
              <input type="text" class="input" name="company_swift" value="${settings.company_swift || ''}">
            </div>
            <div class="input-group">
              <label class="input-label">${t('settings.bankName')}</label>
              <input type="text" class="input" name="company_bank_name" value="${settings.company_bank_name || ''}">
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
          </div>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">${t('settings.invoiceSeries')}</label>
              <input type="text" class="input" name="invoice_series" value="${settings.invoice_series || 'INV'}">
            </div>
            <div class="input-group">
              <label class="input-label">${t('settings.nextInvoiceNumber')}</label>
              <input type="number" class="input" name="next_invoice_number" value="${settings.next_invoice_number || 1}" min="1">
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

        <div class="form-actions">
          <button type="submit" class="btn btn-filled">${t('actions.save')}</button>
        </div>
      </form>
    </div>
  `;
}

export function initSettings() {
  const form = document.getElementById('settingsForm');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = {
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
        default_payment_terms: parseInt(formData.get('default_payment_terms')) || 30,
        invoice_series: formData.get('invoice_series'),
        next_invoice_number: parseInt(formData.get('next_invoice_number')) || 1,
        language: formData.get('language'),
      };

      settingsService.update(data);

      // Update language if changed
      if (data.language !== i18n.locale) {
        i18n.locale = data.language;
      }

      toast.success(t('settings.saveSuccess'));
      window.dispatchEvent(new CustomEvent('app:refresh'));
    });
  }
}
