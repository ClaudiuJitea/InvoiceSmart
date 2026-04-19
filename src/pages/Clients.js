// Clients Page
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { clientService } from '../db/services/clientService.js';
import { toast } from '../components/common/Toast.js';
import { confirm } from '../components/common/Modal.js';
import { router } from '../router.js';
import {
  downloadCsv,
  downloadWorkbook,
  readStructuredFile,
  resolveFirstValue,
  toNullableString,
  toTrimmedString,
} from '../utils/importExport.js';

let searchQuery = '';

const CLIENT_EXPORT_COLUMNS = [
  { key: 'name', label: 'name' },
  { key: 'cif', label: 'cif' },
  { key: 'reg_no', label: 'reg_no' },
  { key: 'address', label: 'address' },
  { key: 'city', label: 'city' },
  { key: 'country', label: 'country' },
  { key: 'email', label: 'email' },
  { key: 'phone', label: 'phone' },
  { key: 'bank_account', label: 'bank_account' },
  { key: 'bank_name', label: 'bank_name' },
  { key: 'notes', label: 'notes' },
];

function buildClientImportPayload(row) {
  return {
    name: toTrimmedString(resolveFirstValue(row, ['name', 'client_name', 'company_name'])),
    cif: toNullableString(resolveFirstValue(row, ['cif', 'vat', 'vat_id', 'tax_id', 'client_cif'])),
    reg_no: toNullableString(resolveFirstValue(row, ['reg_no', 'registration_number', 'client_reg_no'])),
    address: toNullableString(resolveFirstValue(row, ['address', 'street_address'])),
    city: toNullableString(resolveFirstValue(row, ['city'])),
    country: toNullableString(resolveFirstValue(row, ['country'])),
    email: toNullableString(resolveFirstValue(row, ['email'])),
    phone: toNullableString(resolveFirstValue(row, ['phone', 'telephone'])),
    bank_account: toNullableString(resolveFirstValue(row, ['bank_account', 'iban'])),
    bank_name: toNullableString(resolveFirstValue(row, ['bank_name'])),
    notes: toNullableString(resolveFirstValue(row, ['notes'])),
  };
}

function formatImportSummary(created, updated, skipped) {
  return t('dataExchange.importCompleted', { created, updated, skipped });
}

export function renderClients() {
  return `
    <div class="page-container">
      <div class="page-header-row">
        <div class="page-header-left">
          <h1 class="page-title">${t('clients.title')}</h1>
          <p class="page-subtitle">${t('clients.subtitle')}</p>
        </div>
        <div class="page-header-actions clients-header-actions">
          <div class="search-container clients-search-container" id="clientSearchContainer">
            <span class="search-icon">${icons.search}</span>
            <input type="text" 
                   class="search-input" 
                   id="clientSearch"
                   placeholder="${t('actions.search')}..."
                   value="${searchQuery}">
          </div>
          <div class="clients-header-tools" id="clientsHeaderActions"></div>
          <input type="file" id="clientsImportInput" accept=".csv,.xlsx,.xls" style="display:none;">
        </div>
      </div>

      <div id="clientsListContainer">
        <div class="card card-elevated" style="padding: 40px; text-align: center;">
            <div class="loading-spinner"></div>
            <p style="margin-top: 10px; color: var(--md-on-surface-variant);">${t('general.loading')}</p>
        </div>
      </div>
    </div>
  `;
}

export async function initClients() {
  const container = document.getElementById('clientsListContainer');
  const searchInput = document.getElementById('clientSearch');
  const searchContainer = document.getElementById('clientSearchContainer');
  const headerActions = document.getElementById('clientsHeaderActions');
  const importInput = document.getElementById('clientsImportInput');
  let currentClients = [];

  async function loadClients() {
    if (!container) return;

    try {
      const clients = searchQuery
        ? await clientService.search(searchQuery)
        : await clientService.getAll();

      currentClients = clients;
      renderClientsList(clients);
    } catch (error) {
      console.error('Failed to load clients:', error);
      container.innerHTML = `<div class="p-4 text-center text-error">${t('clients.loadError')}</div>`;
    }
  }

  function renderClientsList(clients) {
    const showHeaderTools = clients.length > 0 || Boolean(searchQuery);

    if (searchContainer) {
      searchContainer.style.display = showHeaderTools ? '' : 'none';
    }

    if (headerActions) {
      headerActions.innerHTML = `
        <button type="button" class="btn btn-tonal btn-sm" id="importClientsBtn">
          ${icons.upload}
          ${t('dataExchange.import')}
        </button>
        <details class="header-action-dropdown" ${clients.length === 0 ? 'data-disabled="true"' : ''}>
          <summary class="btn btn-tonal btn-sm ${clients.length === 0 ? 'is-disabled' : ''}">
            ${icons.download}
            ${t('dataExchange.exportAs')}
            ${icons.chevronDown}
          </summary>
          <div class="header-action-menu">
            <button type="button" class="header-action-menu-btn" id="exportClientsCsvBtn">
              CSV
            </button>
            <button type="button" class="header-action-menu-btn" id="exportClientsExcelBtn">
              Excel
            </button>
          </div>
        </details>
        <a href="#/clients/new" class="btn btn-filled clients-add-btn">
          ${icons.plus}
          ${t('clients.newClient')}
        </a>
      `;
    }

    if (clients.length > 0) {
      container.innerHTML = `
            <div class="table-container card-elevated">
              <table class="table">
                <thead>
                  <tr>
                    <th>${t('clients.name')}</th>
                    <th>${t('clients.cif')}</th>
                    <th>${t('clients.address')}</th>
                    <th>${t('clients.email')}</th>
                    <th>${t('clients.phone')}</th>
                    <th class="text-right">${t('actions.edit')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${clients.map(client => `
                    <tr data-client-id="${client.id}">
                      <td class="font-medium">${client.name}</td>
                      <td>${client.cif || '-'}</td>
                      <td>${client.address || '-'}</td>
                      <td>${client.email || '-'}</td>
                      <td>${client.phone || '-'}</td>
                      <td>
                        <div class="table-actions">
                          <button class="btn btn-icon edit-client-btn" data-id="${client.id}" title="${t('actions.edit')}">
                            ${icons.edit}
                          </button>
                          <button class="btn btn-icon delete-client-btn" data-id="${client.id}" title="${t('actions.delete')}">
                            ${icons.trash}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            `;
    } else {
      container.innerHTML = `
            <div class="card card-elevated">
              <div class="empty-state">
                <div class="empty-state-icon">${icons.emptyClients}</div>
                <h3 class="empty-state-title">${t('clients.emptyTitle')}</h3>
                <p class="empty-state-description">${t('clients.emptyDescription')}</p>
                <a href="#/clients/new" class="btn btn-filled">
                  ${icons.plus}
                  ${t('clients.newClient')}
                </a>
              </div>
            </div>
            `;
    }

    attachEventListeners();
  }

  function attachEventListeners() {
    document.getElementById('importClientsBtn')?.addEventListener('click', () => {
      importInput?.click();
    });

    document.getElementById('exportClientsCsvBtn')?.addEventListener('click', () => {
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(`clients-${date}.csv`, currentClients, CLIENT_EXPORT_COLUMNS);
      document.getElementById('exportClientsCsvBtn')?.closest('details')?.removeAttribute('open');
    });

    document.getElementById('exportClientsExcelBtn')?.addEventListener('click', async () => {
      try {
        const date = new Date().toISOString().slice(0, 10);
        await downloadWorkbook(`clients-${date}.xlsx`, currentClients, CLIENT_EXPORT_COLUMNS, 'Clients');
        document.getElementById('exportClientsExcelBtn')?.closest('details')?.removeAttribute('open');
      } catch (error) {
        toast.error(`${t('dataExchange.exportFailed')}: ${error.message}`);
      }
    });

    // Edit buttons
    container.querySelectorAll('.edit-client-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        router.navigate(`/clients/${btn.dataset.id}`);
      });
    });

    // Delete buttons
    container.querySelectorAll('.delete-client-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        confirm({
          title: t('actions.delete'),
          message: t('clients.deleteConfirm'),
          confirmText: t('actions.delete'),
          cancelText: t('actions.cancel'),
          onConfirm: async () => {
            try {
              await clientService.delete(parseInt(btn.dataset.id));
              toast.success(t('clients.deleteSuccess'));
              loadClients(); // Reload list instead of full app refresh
            } catch (error) {
              toast.error(t('clients.deleteError'));
            }
          },
        });
      });
    });
  }

  importInput?.addEventListener('change', async () => {
    const file = importInput.files?.[0];
    if (!file) return;

    try {
      const rows = await readStructuredFile(file);
      if (!rows.length) {
        toast.error(t('dataExchange.importNoRows'));
        return;
      }

      const existingClients = await clientService.getAll();
      const byCif = new Map();
      const byName = new Map();
      existingClients.forEach((client) => {
        if (client.cif) byCif.set(String(client.cif).trim().toLowerCase(), client);
        if (client.name) byName.set(String(client.name).trim().toLowerCase(), client);
      });

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const row of rows) {
        const payload = buildClientImportPayload(row);
        if (!payload.name) {
          skipped += 1;
          continue;
        }

        const match = (payload.cif && byCif.get(payload.cif.toLowerCase()))
          || byName.get(payload.name.toLowerCase());

        if (match) {
          await clientService.update(match.id, payload);
          updated += 1;
          byName.set(payload.name.toLowerCase(), { ...match, ...payload });
          if (payload.cif) byCif.set(payload.cif.toLowerCase(), { ...match, ...payload });
        } else {
          const id = await clientService.create(payload);
          created += 1;
          const createdClient = { id, ...payload };
          byName.set(payload.name.toLowerCase(), createdClient);
          if (payload.cif) byCif.set(payload.cif.toLowerCase(), createdClient);
        }
      }

      toast.success(formatImportSummary(created, updated, skipped));
      await loadClients();
    } catch (error) {
      console.error('Failed to import clients:', error);
      toast.error(`${t('dataExchange.importFailed')}: ${error.message}`);
    } finally {
      importInput.value = '';
    }
  });

  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      // Debounce search
      clearTimeout(window.clientSearchTimeout);
      window.clientSearchTimeout = setTimeout(() => {
        loadClients();
      }, 300);
    });

    // Focus search input if query exists to maintain state between re-renders
    if (searchQuery) {
      searchInput.focus();
    }
  }

  // Initial load
  await loadClients();
}
