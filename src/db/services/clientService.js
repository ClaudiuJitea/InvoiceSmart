// Client Service - API version

export const clientService = {
  // Get all clients
  async getAll() {
    const response = await fetch('/api/clients');
    if (!response.ok) throw new Error('Failed to fetch clients');
    return response.json();
  },

  // Get client by ID
  async getById(id) {
    const response = await fetch(`/api/clients/${id}`);
    if (!response.ok) throw new Error('Failed to fetch client');
    return response.json();
  },

  // Search clients by name
  async search(query) {
    const response = await fetch(`/api/clients?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search clients');
    return response.json();
  },

  // Create new client
  async create(client) {
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
