// Client Service - API version
import { authService } from './authService.js';

export const clientService = {
  getAuthHeader() {
    return authService.getAuthHeader();
  },

  // Get all clients
  async getAll() {
    const response = await fetch('/api/clients', {
      headers: this.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch clients');
    return response.json();
  },

  // Get client by ID
  async getById(id) {
    const response = await fetch(`/api/clients/${id}`, {
      headers: this.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to fetch client');
    return response.json();
  },

  // Search clients by name
  async search(query) {
    const response = await fetch(`/api/clients?q=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to search clients');
    return response.json();
  },

  // Create new client
  async create(client) {
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error('Failed to create client');
    const result = await response.json();
    return result.id;
  },

  // Update client
  async update(id, client) {
    const response = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(client),
    });
    if (!response.ok) throw new Error('Failed to update client');
    return response.json();
  },

  // Delete client
  async delete(id) {
    const response = await fetch(`/api/clients/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    });
    if (!response.ok) throw new Error('Failed to delete client');
    return response.json();
  },

  // Get client count (derived from getAll for now, or add specific endpoint if needed)
  async getCount() {
    const clients = await this.getAll();
    return clients.length;
  },
};

export default clientService;
