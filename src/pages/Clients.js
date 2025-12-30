// Clients Page
import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { clientService } from '../db/services/clientService.js';
import { toast } from '../components/common/Toast.js';
import { confirm } from '../components/common/Modal.js';
import { router } from '../router.js';

let searchQuery = '';

export function renderClients() {
    const clients = searchQuery
        ? clientService.search(searchQuery)
        : clientService.getAll();

    return `
    <div class="page-container">
      <div class="page-header-row">
        <div class="page-header-left">
          <h1 class="page-title">${t('clients.title')}</h1>
          <p class="page-subtitle">${t('clients.subtitle')}</p>
        </div>
        <div class="page-header-actions">
          <div class="search-container">
            <span class="search-icon">${icons.search}</span>
            <input type="text" 
                   class="search-input" 
                   id="clientSearch"
                   placeholder="${t('actions.search')}..."
                   value="${searchQuery}">
          </div>
          <a href="#/clients/new" class="btn btn-filled">
            ${icons.plus}
            ${t('clients.newClient')}
          </a>
        </div>
      </div>

      ${clients.length > 0 ? `
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
      ` : `
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
      `}
    </div>
  `;
}

export function initClients() {
    // Search functionality
    const searchInput = document.getElementById('clientSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            // Debounce search
            clearTimeout(window.clientSearchTimeout);
            window.clientSearchTimeout = setTimeout(() => {
                window.dispatchEvent(new CustomEvent('app:refresh'));
            }, 300);
        });
    }

    // Edit buttons
    document.querySelectorAll('.edit-client-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            router.navigate(`/clients/${btn.dataset.id}`);
        });
    });

    // Delete buttons
    document.querySelectorAll('.delete-client-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            confirm({
                title: t('actions.delete'),
                message: t('clients.deleteConfirm'),
                confirmText: t('actions.delete'),
                cancelText: t('actions.cancel'),
                onConfirm: () => {
                    clientService.delete(parseInt(btn.dataset.id));
                    toast.success(t('clients.deleteSuccess'));
                    window.dispatchEvent(new CustomEvent('app:refresh'));
                },
            });
        });
    });
}
