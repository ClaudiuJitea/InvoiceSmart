import express from 'express';
import { getDb } from '../database.js';

const router = express.Router();

// Get recent invoices
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const documentType = req.query.document_type ? String(req.query.document_type) : null;

        const filters = [];
        const params = [];
        if (documentType) {
            filters.push('i.document_type = ?');
            params.push(documentType);
        }

        const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
        params.push(limit);

        const invoices = await db.all(`
      SELECT 
        i.*,
        c.name as client_name,
        c.cif as client_cif
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ${whereClause}
      ORDER BY i.issue_date DESC, i.id DESC
      LIMIT ?
    `, params);

        res.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const invoice = await db.get(`
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
    `, req.params.id);

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const items = await db.all(`
      SELECT * FROM invoice_items 
      WHERE invoice_id = ?
      ORDER BY sort_order ASC
    `, req.params.id);

        invoice.items = items;
        res.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});

// Create invoice
router.post('/', async (req, res) => {
    const db = await getDb();

    try {
        await db.exec('BEGIN TRANSACTION');

        const { invoice, items } = req.body;

        // Calculate totals on backend too for safety, but trust frontend for now
        let subtotal = 0;
        let taxAmount = 0;

        items.forEach(item => {
            subtotal += (item.total || 0);
            taxAmount += (item.total || 0) * ((item.tax_rate || 0) / 100);
        });

        const total = subtotal + taxAmount;
        const totalSecondary = total * (invoice.exchange_rate || 1);

        const result = await db.run(`
      INSERT INTO invoices (
        invoice_number, series, client_id, issue_date, due_date,
        currency, exchange_rate, subtotal, tax_rate, tax_amount,
        total, total_secondary, secondary_currency, payment_method,
        notes, document_type, status, template,
        language, secondary_language, language_mode
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            invoice.document_type || 'invoice',
            invoice.status || 'draft',
            invoice.template || 'modern',
            invoice.language || 'en',
            invoice.secondary_language || 'ro',
            invoice.language_mode || 'single',
        ]);

        const invoiceId = result.lastID;

        // Insert items
        for (const [index, item] of items.entries()) {
            await db.run(`
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
        }

        await db.exec('COMMIT');
        res.status(201).json({ id: invoiceId });
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Error creating invoice:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

// Update invoice
router.put('/:id', async (req, res) => {
    const db = await getDb();

    try {
        await db.exec('BEGIN TRANSACTION');

        const { invoice, items } = req.body;
        const id = req.params.id;

        // Recalculate totals
        let subtotal = 0;
        let taxAmount = 0;

        items.forEach(item => {
            subtotal += (item.total || 0);
            taxAmount += (item.total || 0) * ((item.tax_rate || 0) / 100);
        });

        const total = subtotal + taxAmount;
        const totalSecondary = total * (invoice.exchange_rate || 1);

        await db.run(`
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
        document_type = ?,
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
            invoice.document_type || 'invoice',
            invoice.status || 'draft',
            invoice.template || 'modern',
            invoice.language || 'en',
            invoice.secondary_language || 'ro',
            invoice.language_mode || 'single',
            id,
        ]);

        // Delete existing items
        await db.run('DELETE FROM invoice_items WHERE invoice_id = ?', id);

        // Insert new items
        for (const [index, item] of items.entries()) {
            await db.run(`
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
        }

        await db.exec('COMMIT');
        res.json({ success: true });
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Error updating invoice:', error);
        res.status(500).json({ error: 'Failed to update invoice' });
    }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
    const db = await getDb();
    try {
        await db.run('DELETE FROM invoice_items WHERE invoice_id = ?', req.params.id);
        await db.run('DELETE FROM invoices WHERE id = ?', req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ error: 'Failed to delete invoice' });
    }
});

// Update status
router.patch('/:id/status', async (req, res) => {
    try {
        const db = await getDb();
        const { status } = req.body;
        await db.run('UPDATE invoices SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

export default router;
