import { authService } from './authService.js';

export const productService = {
  getAuthHeader() {
    return authService.getAuthHeader();
  },

  async getAll(options = {}) {
    const params = new URLSearchParams();
    if (options.query) params.set('q', options.query);
    if (options.activeOnly) params.set('active', '1');

    const response = await fetch(`/api/products?${params.toString()}`, {
      headers: this.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  async getById(id) {
    const response = await fetch(`/api/products/${id}`, {
      headers: this.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },

  async create(product) {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(product),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Failed to create product');
    return data.id;
  },

  async update(id, product) {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(product),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Failed to update product');
    return data;
  },

  async delete(id) {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Failed to delete product');
    return data;
  },
};

export default productService;
