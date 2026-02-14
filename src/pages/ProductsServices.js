import { t } from '../i18n/index.js';
import { icons } from '../components/icons.js';
import { productService } from '../db/services/productService.js';
import { toast } from '../components/common/Toast.js';
import { confirm } from '../components/common/Modal.js';
import { CustomSelect } from '../components/common/CustomSelect.js';

let searchQuery = '';

export function renderProductsServices() {
  return `
    <div class="page-container">
      <div class="page-header-row">
        <div class="page-header-left">
          <h1 class="page-title">${t('productsServices.title')}</h1>
          <p class="page-subtitle">${t('productsServices.subtitle')}</p>
        </div>
        <div class="page-header-actions products-header-actions">
          <div class="search-container products-search-container" id="productSearchContainer">
            <span class="search-icon">${icons.search}</span>
            <input type="text"
                   class="search-input"
                   id="productSearch"
                   placeholder="${t('productsServices.searchPlaceholder')}"
                   value="${searchQuery}">
          </div>
          <button class="btn btn-filled products-add-btn" id="addProductBtn">
            ${icons.plus}
            ${t('productsServices.addProduct')}
          </button>
        </div>
      </div>

      <div id="productsListContainer">
        <div class="card card-elevated" style="padding: 40px; text-align: center;">
          <div class="loading-spinner"></div>
          <p style="margin-top: 10px; color: var(--md-on-surface-variant);">${t('general.loading')}</p>
        </div>
      </div>

      <div class="modal-overlay" id="productModal">
        <div class="modal">
          <div class="modal-header">
            <h3 class="modal-title" id="productModalTitle">${t('productsServices.addProduct')}</h3>
            <button class="modal-close" id="closeProductModalBtn">${icons.close}</button>
          </div>
          <form id="productForm" class="modal-content">
            <input type="hidden" id="productId" value="">
            <div class="modal-form-grid">
              <div class="form-group">
                <label class="input-label" for="productName">${t('productsServices.name')} *</label>
                <input type="text" id="productName" class="input" required>
              </div>
              <div class="form-group">
                <label class="input-label" for="productCode">${t('productsServices.code')}</label>
                <input type="text" id="productCode" class="input">
              </div>
              <div class="form-group">
                <label class="input-label" for="productProducer">${t('productsServices.producer')}</label>
                <input type="text" id="productProducer" class="input">
              </div>
              <div class="form-group">
                <label class="input-label" for="productCategory">${t('productsServices.category')}</label>
                <input type="text" id="productCategory" class="input">
              </div>
              <div class="form-group">
                <label class="input-label" for="productUnit">${t('productsServices.unit')}</label>
                <select id="productUnit" class="input select">
                  <option value="pcs">${t('invoices.unitPiece')}</option>
                  <option value="hrs">${t('invoices.unitHours')}</option>
                  <option value="srv">${t('invoices.unitService')}</option>
                  <option value="day">${t('invoices.unitDay')}</option>
                </select>
              </div>
              <div class="form-group">
                <label class="input-label" for="productStock">${t('productsServices.quantity')}</label>
                <input type="number" id="productStock" class="input" step="0.01" min="0" value="0">
              </div>
              <div class="form-group">
                <label class="input-label" for="productPrice">${t('productsServices.unitPrice')}</label>
                <input type="number" id="productPrice" class="input" step="0.01" min="0" value="0">
              </div>
              <div class="form-group">
                <label class="input-label" for="productTaxRate">${t('productsServices.taxRate')}</label>
                <input type="number" id="productTaxRate" class="input" step="0.1" min="0" value="0">
              </div>
              <div class="form-group modal-form-full">
                <label class="toggle-switch">
                  <input type="checkbox" id="productActive" checked>
                  <span class="toggle-label">${t('productsServices.active')}</span>
                </label>
              </div>
            </div>
          </form>
          <div class="modal-actions">
            <button type="button" class="btn btn-outlined" id="cancelProductBtn">${t('actions.cancel')}</button>
            <button type="submit" form="productForm" class="btn btn-filled">${t('actions.save')}</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function initProductsServices() {
  const container = document.getElementById('productsListContainer');
  const searchInput = document.getElementById('productSearch');
  const addProductBtn = document.getElementById('addProductBtn');

  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');
  const closeModalBtn = document.getElementById('closeProductModalBtn');
  const cancelModalBtn = document.getElementById('cancelProductBtn');
  const modalTitle = document.getElementById('productModalTitle');

  let products = [];

  function closeModal() {
    modal?.classList.remove('open');
  }

  function openModal(product = null) {
    if (!form || !modal || !modalTitle) return;
    form.reset();
    document.getElementById('productId').value = '';
    document.getElementById('productStock').value = '0';
    document.getElementById('productPrice').value = '0';
    document.getElementById('productTaxRate').value = '0';
    document.getElementById('productActive').checked = true;
    document.getElementById('productUnit').value = 'pcs';

    if (product) {
      modalTitle.textContent = t('productsServices.editProduct');
      document.getElementById('productId').value = String(product.id);
      document.getElementById('productName').value = product.name || '';
      document.getElementById('productCode').value = product.product_code || '';
      document.getElementById('productProducer').value = product.producer || '';
      document.getElementById('productCategory').value = product.category || '';
      document.getElementById('productUnit').value = product.unit || 'pcs';
      document.getElementById('productStock').value = String(product.stock_quantity ?? 0);
      document.getElementById('productPrice').value = String(product.unit_price ?? 0);
      document.getElementById('productTaxRate').value = String(product.tax_rate ?? 0);
      document.getElementById('productActive').checked = Number(product.is_active) === 1;
    } else {
      modalTitle.textContent = t('productsServices.addProduct');
    }

    modal.classList.add('open');
  }

  async function loadProducts() {
    if (!container) return;
    try {
      products = await productService.getAll({ query: searchQuery });
      renderList();
    } catch (error) {
      console.error('Failed to load products:', error);
      container.innerHTML = `<div class="p-4 text-center text-error">${t('productsServices.loadError')}</div>`;
    }
  }

  function renderList() {
    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = `
        <div class="card card-elevated">
          <div class="empty-state">
            <div class="empty-state-icon">${icons.box}</div>
            <h3 class="empty-state-title">${t('productsServices.emptyTitle')}</h3>
            <p class="empty-state-description">${t('productsServices.emptyDescription')}</p>
            <button class="btn btn-filled" id="addFirstProductBtn">
              ${icons.plus}
              ${t('productsServices.addProduct')}
            </button>
          </div>
        </div>
      `;

      document.getElementById('addFirstProductBtn')?.addEventListener('click', () => openModal());
      return;
    }

    container.innerHTML = `
      <div class="table-container card-elevated">
        <table class="table">
          <thead>
            <tr>
              <th>${t('productsServices.name')}</th>
              <th>${t('productsServices.producer')}</th>
              <th>${t('productsServices.category')}</th>
              <th>${t('productsServices.code')}</th>
              <th>${t('productsServices.quantity')}</th>
              <th>${t('productsServices.unitPrice')}</th>
              <th class="text-right">${t('actions.edit')}</th>
            </tr>
          </thead>
          <tbody>
            ${products.map((product) => `
              <tr>
                <td class="font-medium">${escapeHtml(product.name)}</td>
                <td>${escapeHtml(product.producer || '-')}</td>
                <td>${escapeHtml(product.category || '-')}</td>
                <td>${escapeHtml(product.product_code || '-')}</td>
                <td>${Number(product.stock_quantity || 0).toFixed(2)} ${escapeHtml(product.unit || '')}</td>
                <td>${Number(product.unit_price || 0).toFixed(2)}</td>
                <td>
                  <div class="table-actions">
                    <button class="btn btn-icon edit-product-btn" data-id="${product.id}" title="${t('actions.edit')}">
                      ${icons.edit}
                    </button>
                    <button class="btn btn-icon delete-product-btn" data-id="${product.id}" title="${t('actions.delete')}">
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

    container.querySelectorAll('.edit-product-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const product = products.find((p) => p.id === parseInt(btn.dataset.id, 10));
        if (product) openModal(product);
      });
    });

    container.querySelectorAll('.delete-product-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id, 10);
        confirm({
          title: t('actions.delete'),
          message: t('productsServices.deleteConfirm'),
          confirmText: t('actions.delete'),
          cancelText: t('actions.cancel'),
          onConfirm: async () => {
            try {
              await productService.delete(id);
              toast.success(t('productsServices.deleteSuccess'));
              await loadProducts();
            } catch (error) {
              toast.error(error.message || t('productsServices.saveError'));
            }
          },
        });
      });
    });
  }

  addProductBtn?.addEventListener('click', () => openModal());
  closeModalBtn?.addEventListener('click', closeModal);
  cancelModalBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const id = parseInt(document.getElementById('productId').value, 10);
      const payload = {
        name: document.getElementById('productName').value.trim(),
        producer: document.getElementById('productProducer').value.trim(),
        category: document.getElementById('productCategory').value.trim(),
        product_code: document.getElementById('productCode').value.trim(),
        unit: document.getElementById('productUnit').value,
        stock_quantity: parseFloat(document.getElementById('productStock').value) || 0,
        unit_price: parseFloat(document.getElementById('productPrice').value) || 0,
        tax_rate: parseFloat(document.getElementById('productTaxRate').value) || 0,
        is_active: document.getElementById('productActive').checked,
      };

      if (!payload.name) {
        toast.error(t('validation.required'));
        return;
      }

      if (Number.isInteger(id)) {
        await productService.update(id, payload);
      } else {
        await productService.create(payload);
      }

      toast.success(t('productsServices.saveSuccess'));
      closeModal();
      await loadProducts();
    } catch (error) {
      toast.error(error.message || t('productsServices.saveError'));
    }
  });

  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    clearTimeout(window.productSearchTimeout);
    window.productSearchTimeout = setTimeout(() => {
      loadProducts();
    }, 250);
  });

  const productUnitSelect = document.getElementById('productUnit');
  if (productUnitSelect) {
    new CustomSelect(productUnitSelect);
  }

  await loadProducts();
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
