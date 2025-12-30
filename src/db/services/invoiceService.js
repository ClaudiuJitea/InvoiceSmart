// Invoice Service - CRUD operations for invoices
import { db } from '../database.js';

export const invoiceService = {
  // Get all invoices with client info
  getAll() {
    return db.query(`
      SELECT 
        i.*,
        c.name as client_name,
        c.cif as client_cif
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.issue_date DESC, i.id DESC
    `);
  },

  // Get invoice by ID with client info
  getById(id) {
    const invoice = db.queryOne(`
      SELECT 
        i.*,
        c.name as client_name,
        c.cif as client_cif,
        c.reg_no as client_reg_no,
        c.address as client_address,
        c.city as client_city,
        c.email as client_email,
        c.phone as client_phone,
        c.country as client_country,
        c.bank_account as client_bank_account,
        c.bank_name as client_bank_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      WHERE i.id = ?
    `, [id]);

    if (invoice) {
      invoice.items = this.getItems(id);
    }

    return invoice;
  },

  // Get invoice items
  getItems(invoiceId) {
    return db.query(`
      SELECT * FROM invoice_items 
      WHERE invoice_id = ?
      ORDER BY sort_order ASC
    `, [invoiceId]);
  },

  // Create new invoice
  create(invoice, items = []) {
    // Calculate totals
    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      item.total = (item.quantity || 0) * (item.unit_price || 0);
      subtotal += item.total;
      taxAmount += item.total * ((item.tax_rate || 0) / 100);
    });

    const total = subtotal + taxAmount;
    const totalSecondary = total * (invoice.exchange_rate || 1);

    db.run(`
      INSERT INTO invoices (
        invoice_number, series, client_id, issue_date, due_date,
        currency, exchange_rate, subtotal, tax_rate, tax_amount,
        total, total_secondary, secondary_currency, payment_method,
        notes, status, template,
        language, secondary_language, language_mode
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoice.invoice_number,
      invoice.series,
      invoice.client_id,
      invoice.issue_date,
      invoice.due_date,
      invoice.currency || 'EUR',
      invoice.exchange_rate || 1,
      subtotal,
      invoice.tax_rate || 0,
      taxAmount,
      total,
      totalSecondary,
      invoice.secondary_currency || 'RON',
      invoice.payment_method || null,
      invoice.notes || null,
      invoice.status || 'draft',
      invoice.template || 'modern',
      invoice.language || 'en',
      invoice.secondary_language || 'ro',
      invoice.language_mode || 'single',
    ]);

    const invoiceId = db.getLastInsertId();

    // Insert items
    items.forEach((item, index) => {
      db.run(`
        INSERT INTO invoice_items (invoice_id, description, unit, quantity, unit_price, total, tax_rate, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        invoiceId,
        item.description,
        item.unit || 'hrs',
        item.quantity || 1,
        item.unit_price || 0,
        item.total || 0,
        item.tax_rate || 0,
        index,
      ]);
    });

    return invoiceId;
  },

  // Update invoice
  update(id, invoice, items = []) {
    // Calculate totals
    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    items.forEach(item => {
      item.total = (item.quantity || 0) * (item.unit_price || 0);
      subtotal += item.total;
      taxAmount += item.total * ((item.tax_rate || 0) / 100);
    });

    const total = subtotal + taxAmount;
    const totalSecondary = total * (invoice.exchange_rate || 1);

    db.run(`
      UPDATE invoices SET
        invoice_number = ?,
        series = ?,
        client_id = ?,
        issue_date = ?,
        due_date = ?,
        currency = ?,
        exchange_rate = ?,
        subtotal = ?,
        tax_rate = ?,
        tax_amount = ?,
        total = ?,
        total_secondary = ?,
        secondary_currency = ?,
        payment_method = ?,
        notes = ?,
        status = ?,
        template = ?,
        language = ?,
        secondary_language = ?,
        language_mode = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      invoice.invoice_number,
      invoice.series,
      invoice.client_id,
      invoice.issue_date,
      invoice.due_date,
      invoice.currency || 'EUR',
      invoice.exchange_rate || 1,
      subtotal,
      invoice.tax_rate || 0,
      taxAmount,
      total,
      totalSecondary,
      invoice.secondary_currency || 'RON',
      invoice.payment_method || null,
      invoice.notes || null,
      invoice.status || 'draft',
      invoice.template || 'modern',
      invoice.language || 'en',
      invoice.secondary_language || 'ro',
      invoice.language_mode || 'single',
      id,
    ]);

    // Delete existing items and re-insert
    db.run('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);

    items.forEach((item, index) => {
      db.run(`
        INSERT INTO invoice_items (invoice_id, description, unit, quantity, unit_price, total, tax_rate, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        item.description,
        item.unit || 'hrs',
        item.quantity || 1,
        item.unit_price || 0,
        item.total || 0,
        item.tax_rate || 0,
        index,
      ]);
    });

    return id;
  },

  // Delete invoice
  delete(id) {
    db.run('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);
    return db.run('DELETE FROM invoices WHERE id = ?', [id]);
  },

  // Update status
  updateStatus(id, status) {
    return db.run('UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, id]);
  },

  // Duplicate invoice
  duplicate(id) {
    const original = this.getById(id);
    if (!original) return null;

    const settings = db.queryOne('SELECT * FROM settings WHERE id = 1');
    const nextNumber = settings.next_invoice_number;

    const newInvoice = {
      ...original,
      invoice_number: `${settings.invoice_series}-${String(nextNumber).padStart(4, '0')}`,
      series: settings.invoice_series,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + settings.default_payment_terms * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
    };

    // Increment invoice number
    db.run('UPDATE settings SET next_invoice_number = next_invoice_number + 1 WHERE id = 1');

    return this.create(newInvoice, original.items);
  },

  // Get invoice count
  getCount() {
    const result = db.queryOne('SELECT COUNT(*) as count FROM invoices');
    return result ? result.count : 0;
  },

  // Get total revenue
  getTotalRevenue(currency = 'EUR') {
    const result = db.queryOne(`
      SELECT SUM(total) as total 
      FROM invoices 
      WHERE status = 'paid' AND currency = ?
    `, [currency]);
    return result ? result.total || 0 : 0;
  },

  // Get pending invoices count
  getPendingCount() {
    const result = db.queryOne(`
      SELECT COUNT(*) as count 
      FROM invoices 
      WHERE status IN ('draft', 'sent')
    `);
    return result ? result.count : 0;
  },

  // Get recent invoices
  getRecent(limit = 5) {
    return db.query(`
      SELECT 
        i.*,
        c.name as client_name
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ORDER BY i.created_at DESC
      LIMIT ?
    `, [limit]);
  },

  // Generate next invoice number
  getNextInvoiceNumber() {
    const settings = db.queryOne('SELECT * FROM settings WHERE id = 1');
    return {
      series: settings.invoice_series,
      number: settings.next_invoice_number,
      formatted: `${settings.invoice_series}-${String(settings.next_invoice_number).padStart(4, '0')}`,
    };
  },
};

export default invoiceService;
