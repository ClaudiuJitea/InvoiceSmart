// Invoice Service - API version
import { authService } from './authService.js';
import { settingsService } from './settingsService.js';
import { formatSeriesNumber, getDefaultSeriesTemplate } from '../../utils/seriesTemplates.js';

export const invoiceService = {
  getAuthHeader() {
    return authService.getAuthHeader();
  },

  // Get all invoices with client info
  async getAll(filters = {}) {
    const params = new URLSearchParams({ limit: '1000' });
    if (filters.document_type) params.set('document_type', filters.document_type);
    const response = await fetch(`/api/invoices?${params.toString()}`, {
      headers: this.getAuthHeader(),
    }); // Higher limit for "all"
    if (!response.ok) throw new Error('Failed to fetch invoices');
    return response.json();
  },

  // Get invoice by ID with client info
  async getById(id) {
    const response = await fetch(`/api/invoices/${id}`, {
      headers: this.getAuthHeader(),
    });
    if (!response.ok) return null;
    return response.json();
  },

  // Get invoice items (Included in getById now, but keeping for compatibility if used elsewhere)
  async getItems(invoiceId) {
    const invoice = await this.getById(invoiceId);
    return invoice ? invoice.items : [];
  },

  // Create new invoice
  async create(invoice, items = [], options = {}) {
    const payload = { invoice, items };
    if (Array.isArray(options.related_delivery_note_ids)) {
      payload.related_delivery_note_ids = options.related_delivery_note_ids;
    }

    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to create invoice');
    }
    const result = await response.json();
    return result.id;
  },

  // Update invoice
  async update(id, invoice, items = [], options = {}) {
    const payload = { invoice, items };
    if (Array.isArray(options.related_delivery_note_ids)) {
      payload.related_delivery_note_ids = options.related_delivery_note_ids;
    }

    const response = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to update invoice');
    }
    return response.json();
  },

  async buildDraftFromDeliveryNotes(deliveryNoteIds = []) {
    const response = await fetch('/api/invoices/delivery-notes/draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ delivery_note_ids: deliveryNoteIds }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to create invoice draft from delivery notes');
    }

    return response.json();
  },

  // Delete invoice
  async delete(id) {
    const response = await fetch(`/api/invoices/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
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
        ...this.getAuthHeader(),
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

    const documentType = original.document_type || 'invoice';
    const nextSeriesData = await this.getNextInvoiceNumber(documentType);

    const newInvoice = {
      ...original,
      invoice_number: nextSeriesData.formatted,
      series: nextSeriesData.series,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + nextSeriesData.defaultPaymentTerms * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      document_type: documentType,
    };

    const newId = await this.create(newInvoice, original.items);
    await settingsService.consumeSeriesTemplateNumber(nextSeriesData.templateId);
    return newId;
  },

  // Get invoice count
  async getCount(filters = {}) {
    const invoices = await this.getAll(filters);
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
    const mergedFilters = { document_type: 'invoice', ...(filters || {}) };
    const q = new URLSearchParams(mergedFilters).toString();
    const response = await fetch(`/api/stats/overview?${q}`);
    return response.json();
  },

  // Get revenue converted to a target currency
  async getRevenueByCurrency(currency = 'EUR') {
    const response = await fetch(`/api/stats/revenue-by-currency?currency=${currency}&document_type=invoice`);
    if (!response.ok) throw new Error('Failed to fetch revenue by currency');
    return response.json();
  },


  // Get recent invoices
  async getRecent(limit = 5, filters = {}) {
    const params = new URLSearchParams({ limit: String(limit) });
    if (filters.document_type) params.set('document_type', filters.document_type);
    const response = await fetch(`/api/invoices?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch recent invoices');
    return response.json();
  },

  // Generate next invoice number
  async getNextInvoiceNumber(documentType = 'invoice') {
    const settings = await settingsService.get();
    const defaultTemplate = getDefaultSeriesTemplate(settings.document_series_templates, documentType);

    if (!defaultTemplate) {
      return {
        templateId: null,
        series: settings.invoice_series,
        number: settings.next_invoice_number,
        formatted: `${settings.invoice_series}-${String(settings.next_invoice_number).padStart(4, '0')}`,
        defaultPaymentTerms: settings.default_payment_terms || 30,
        documentType,
      };
    }

    return {
      templateId: defaultTemplate.id,
      series: defaultTemplate.prefix,
      number: defaultTemplate.next_number,
      formatted: formatSeriesNumber(defaultTemplate),
      defaultPaymentTerms: settings.default_payment_terms || 30,
      documentType,
    };
  },
};

export default invoiceService;
