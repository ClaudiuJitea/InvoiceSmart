// Client Form Page (Create/Edit)
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { clientService } from '../db/services/clientService.js';
import { toast } from '../components/common/Toast.js';
import { router } from '../router.js';

export function renderClientForm(params = {}) {
  return `
    <div class="page-container" style="max-width: 800px;" id="clientFormContainer">
      <div class="card card-elevated" style="padding: 40px; text-align: center;">
        <div class="loading-spinner"></div>
        <p style="margin-top: 10px; color: var(--md-on-surface-variant);">Loading...</p>
      </div>
    </div>
  `;
}

export async function initClientForm(params = {}) {
  const container = document.getElementById('clientFormContainer');
  if (!container) return;

  const isEdit = params.id && params.id !== 'new';
  let client = null;

  try {
    if (isEdit) {
      client = await clientService.getById(parseInt(params.id));
    }

    const title = isEdit ? t('clients.editClient') : t('clients.newClient');

    container.innerHTML = `
      <div class="page-header-row">
        <div class="page-header-left">
          <a href="#/clients" class="btn btn-text" style="margin-left: -12px; margin-bottom: var(--space-2);">
            ${icons.arrowLeft} ${t('actions.back')}
          </a>
          <h1 class="page-title">${title}</h1>
        </div>
      </div>

      <form id="clientForm" class="card card-elevated">
        <div class="form-section">
          <h3 class="form-section-title">${t('clients.companyName')}</h3>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">${t('clients.name')} *</label>
              <input type="text" class="input" name="name" value="${client?.name || ''}" required>
            </div>
          </div>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">${t('clients.cif')}</label>
              <input type="text" class="input" name="cif" value="${client?.cif || ''}" placeholder="e.g., RO12345678">
            </div>
            <div class="input-group">
              <label class="input-label">${t('clients.regNo')}</label>
              <input type="text" class="input" name="reg_no" value="${client?.reg_no || ''}" placeholder="e.g., J40/123/2020">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">${t('clients.address')}</h3>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">${t('clients.address')}</label>
              <textarea class="input textarea" name="address" rows="3">${client?.address || ''}</textarea>
            </div>
          </div>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">${t('clients.city')}</label>
              <input type="text" class="input" name="city" value="${client?.city || ''}">
            </div>
            <div class="input-group">
              <label class="input-label">${t('clients.country')}</label>
              <input type="text" class="input" name="country" value="${client?.country || ''}">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">${t('clients.email')} / ${t('clients.phone')}</h3>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">${t('clients.email')}</label>
              <input type="email" class="input" name="email" value="${client?.email || ''}">
            </div>
            <div class="input-group">
              <label class="input-label">${t('clients.phone')}</label>
              <input type="tel" class="input" name="phone" value="${client?.phone || ''}">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">${t('settings.bankDetails')}</h3>
          <div class="form-row">
            <div class="input-group">
              <label class="input-label">${t('settings.bankAccount')}</label>
              <input type="text" class="input" name="bank_account" value="${client?.bank_account || ''}" placeholder="IBAN">
            </div>
            <div class="input-group">
              <label class="input-label">${t('settings.bankName')}</label>
              <input type="text" class="input" name="bank_name" value="${client?.bank_name || ''}">
            </div>
          </div>
        </div>

        <div class="form-section">
          <h3 class="form-section-title">${t('clients.notes')}</h3>
          <div class="input-group">
            <textarea class="input textarea" name="notes" rows="4" placeholder="${t('clients.notes')}...">${client?.notes || ''}</textarea>
          </div>
        </div>

        <div class="form-actions">
          <a href="#/clients" class="btn btn-text">${t('actions.cancel')}</a>
          <button type="submit" class="btn btn-filled">${t('actions.save')}</button>
        </div>
      </form>
    `;

    const form = document.getElementById('clientForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        try {
          const formData = new FormData(form);
          const data = {
            name: formData.get('name'),
            cif: formData.get('cif'),
            reg_no: formData.get('reg_no'),
            address: formData.get('address'),
            city: formData.get('city'),
            country: formData.get('country'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            bank_account: formData.get('bank_account'),
            bank_name: formData.get('bank_name'),
            notes: formData.get('notes'),
          };

          if (isEdit) {
            await clientService.update(parseInt(params.id), data);
          } else {
            await clientService.create(data);
          }

          toast.success(t('clients.saveSuccess'));
          router.navigate('/clients');
        } catch (error) {
          console.error('Failed to save client:', error);
          toast.error(error.message || 'Failed to save client');
        }
      });
    }

  } catch (error) {
    console.error('Error loading client form:', error);
    toast.error('Failed to load client data');
    router.navigate('/clients');
  }
}
