// Clients Page
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { clientService } from '../db/services/clientService.js';
import { toast } from '../components/common/Toast.js';
import { confirm } from '../components/common/Modal.js';
import { router } from '../router.js';

let searchQuery = '';

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
          <div id="clientsHeaderActions"></div>
        </div>
      </div>

      <div id="clientsListContainer">
        <div class="card card-elevated" style="padding: 40px; text-align: center;">
            <div class="loading-spinner"></div>
            <p style="margin-top: 10px; color: var(--md-on-surface-variant);">Loading...</p>
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

  async function loadClients() {
    if (!container) return;

    try {
      const clients = searchQuery
        ? await clientService.search(searchQuery)
        : await clientService.getAll();

      renderClientsList(clients);
    } catch (error) {
      console.error('Failed to load clients:', error);
      container.innerHTML = `<div class="p-4 text-center text-error">Failed to load clients</div>`;
    }
  }

  function renderClientsList(clients) {
    const showHeaderTools = clients.length > 0 || Boolean(searchQuery);

    if (searchContainer) {
      searchContainer.style.display = showHeaderTools ? '' : 'none';
    }

    if (headerActions) {
      headerActions.innerHTML = showHeaderTools ? `
        <a href="#/clients/new" class="btn btn-filled clients-add-btn">
          ${icons.plus}
          ${t('clients.newClient')}
        </a>
      ` : '';
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
              toast.error('Failed to delete client');
            }
          },
        });
      });
    });
  }

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
