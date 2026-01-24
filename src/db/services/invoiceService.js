// Invoice Service - API version
import { settingsService } from './settingsService.js';

export const invoiceService = {
  // Get all invoices with client info
  async getAll() {
    const response = await fetch('/api/invoices?limit=1000'); // Higher limit for "all"
    if (!response.ok) throw new Error('Failed to fetch invoices');
    return response.json();
  },

  // Get invoice by ID with client info
  async getById(id) {
    const response = await fetch(`/api/invoices/${id}`);
    if (!response.ok) return null;
    return response.json();
  },

  // Get invoice items (Included in getById now, but keeping for compatibility if used elsewhere)
  async getItems(invoiceId) {
    const invoice = await this.getById(invoiceId);
    return invoice ? invoice.items : [];
  },

  // Create new invoice
  async create(invoice, items = []) {
    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice, items }),
    });
    if (!response.ok) throw new Error('Failed to create invoice');
    const result = await response.json();
    return result.id;
  },

  // Update invoice
  async update(id, invoice, items = []) {
    const response = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice, items }),
    });
    if (!response.ok) throw new Error('Failed to update invoice');
    return response.json();
  },

  // Delete invoice
  async delete(id) {
    const response = await fetch(`/api/invoices/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete invoice');
    return response.json();
  },

  // Update status
  async updateStatus(id, status) {
    const response = await fetch(`/api/invoices/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update status');
    return response.json();
  },

  // Duplicate invoice
  async duplicate(id) {
    const original = await this.getById(id);
    if (!original) return null;

    const settings = await settingsService.get();
    const nextNumber = settings.next_invoice_number;

    const newInvoice = {
      ...original,
      invoice_number: `${settings.invoice_series}-${String(nextNumber).padStart(4, '0')}`,
      series: settings.invoice_series,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + settings.default_payment_terms * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
    };

    // Increment on server
    await settingsService.incrementInvoiceNumber();

    return this.create(newInvoice, original.items);
  },

  // Get invoice count
  async getCount() {
    const invoices = await this.getAll();
    return invoices.length;
  },

  // Get total revenue - Better to use stats API
  async getTotalRevenue(currency = 'EUR') {
    const stats = await this.getOverview({ currency });
    return stats.totalRevenue;
  },

  // Get pending invoices count - Better to use stats API
  async getPendingCount() {
    const stats = await this.getOverview();
    return stats.pendingCount; // Return actual count of pending invoices
  },


  // Use stats endpoint for overview
  async getOverview(filters) {
    const q = new URLSearchParams(filters).toString();
    const response = await fetch(`/api/stats/overview?${q}`);
    return response.json();
  },

  // Get revenue converted to a target currency
  async getRevenueByCurrency(currency = 'EUR') {
    const response = await fetch(`/api/stats/revenue-by-currency?currency=${currency}`);
    if (!response.ok) throw new Error('Failed to fetch revenue by currency');
    return response.json();
  },


  // Get recent invoices
  async getRecent(limit = 5) {
    const response = await fetch(`/api/invoices?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch recent invoices');
    return response.json();
  },

  // Generate next invoice number
  async getNextInvoiceNumber() {
    const settings = await settingsService.get();
    return {
      series: settings.invoice_series,
      number: settings.next_invoice_number,
      formatted: `${settings.invoice_series}-${String(settings.next_invoice_number).padStart(4, '0')}`,
    };
  },
};

export default invoiceService;
