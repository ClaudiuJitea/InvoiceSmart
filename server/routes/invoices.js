import express from 'express';
import { getDb } from '../database.js';

const router = express.Router();

function toPlaceholders(count) {
    return Array.from({ length: count }, () => '?').join(', ');
}

function createHttpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

function sanitizeDeliveryNoteIds(rawIds) {
    if (!Array.isArray(rawIds)) return [];

    const parsed = rawIds
        .map((id) => parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0);

    return [...new Set(parsed)];
}

async function validateDeliveryNotesForInvoice(db, deliveryNoteIds, currentInvoiceId = null) {
    if (deliveryNoteIds.length === 0) return [];

    const placeholders = toPlaceholders(deliveryNoteIds.length);
    const deliveryNotes = await db.all(`
      SELECT i.*, c.name AS client_name
      FROM invoices i
      LEFT JOIN clients c ON c.id = i.client_id
      WHERE i.id IN (${placeholders}) AND i.document_type = 'delivery_note'
    `, deliveryNoteIds);

    if (deliveryNotes.length !== deliveryNoteIds.length) {
        throw createHttpError(400, 'One or more selected delivery notes were not found.');
    }

    const deliveryNotesById = new Map(deliveryNotes.map((note) => [note.id, note]));
    const orderedDeliveryNotes = deliveryNoteIds.map((id) => deliveryNotesById.get(id));

    const firstNote = orderedDeliveryNotes[0];
    const sameClient = orderedDeliveryNotes.every((note) => note.client_id === firstNote.client_id);
    if (!sameClient) {
        throw createHttpError(400, 'Selected delivery notes must belong to the same client.');
    }

    const sameCurrency = orderedDeliveryNotes.every((note) => note.currency === firstNote.currency);
    if (!sameCurrency) {
        throw createHttpError(400, 'Selected delivery notes must use the same currency.');
    }

    const linkedParams = [...deliveryNoteIds];
    let linkedSql = `
      SELECT
        rel.delivery_note_id,
        dn.invoice_number AS delivery_note_number,
        inv.invoice_number AS invoice_number
      FROM invoice_delivery_notes rel
      JOIN invoices dn ON dn.id = rel.delivery_note_id
      JOIN invoices inv ON inv.id = rel.invoice_id
      WHERE rel.delivery_note_id IN (${placeholders})
    `;

    if (currentInvoiceId !== null) {
        linkedSql += ' AND rel.invoice_id <> ?';
        linkedParams.push(currentInvoiceId);
    }

    const linkedRows = await db.all(linkedSql, linkedParams);
    if (linkedRows.length > 0) {
        const linkedPairs = linkedRows.map((row) => `${row.delivery_note_number} -> ${row.invoice_number}`);
        throw createHttpError(409, `Some delivery notes are already linked to invoices: ${linkedPairs.join(', ')}`);
    }

    return orderedDeliveryNotes;
}

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
        c.cif as client_cif,
        CASE
          WHEN i.document_type = 'delivery_note' AND EXISTS (
            SELECT 1
            FROM invoice_delivery_notes rel
            WHERE rel.delivery_note_id = i.id
          ) THEN 1
          ELSE 0
        END as is_invoiced,
        (
          SELECT GROUP_CONCAT(inv.invoice_number, ', ')
          FROM invoice_delivery_notes rel
          JOIN invoices inv ON inv.id = rel.invoice_id
          WHERE rel.delivery_note_id = i.id
        ) as linked_invoice_numbers
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

// Build an invoice draft from delivery notes
router.post('/delivery-notes/draft', async (req, res) => {
    try {
        const db = await getDb();
        const deliveryNoteIds = sanitizeDeliveryNoteIds(req.body?.delivery_note_ids);

        if (deliveryNoteIds.length === 0) {
            throw createHttpError(400, 'Please select at least one delivery note.');
        }

        const deliveryNotes = await validateDeliveryNotesForInvoice(db, deliveryNoteIds);
        const placeholders = toPlaceholders(deliveryNoteIds.length);

        const deliveryNoteItems = await db.all(`
          SELECT invoice_id, description, unit, quantity, unit_price, total, tax_rate, sort_order
          FROM invoice_items
          WHERE invoice_id IN (${placeholders})
          ORDER BY invoice_id ASC, sort_order ASC, id ASC
        `, deliveryNoteIds);

        const itemsByDeliveryNote = new Map();
        deliveryNoteItems.forEach((item) => {
            if (!itemsByDeliveryNote.has(item.invoice_id)) {
                itemsByDeliveryNote.set(item.invoice_id, []);
            }

            itemsByDeliveryNote.get(item.invoice_id).push({
                description: item.description,
                unit: item.unit || 'hrs',
                quantity: Number(item.quantity || 0),
                unit_price: Number(item.unit_price || 0),
                tax_rate: Number(item.tax_rate || 0),
                total: Number(item.total || (item.quantity || 0) * (item.unit_price || 0)),
            });
        });

        const mergedItems = [];
        deliveryNoteIds.forEach((deliveryNoteId) => {
            const sourceItems = itemsByDeliveryNote.get(deliveryNoteId) || [];
            sourceItems.forEach((item) => mergedItems.push(item));
        });

        const firstNote = deliveryNotes[0];
        const sourceNumbers = deliveryNotes.map((note) => note.invoice_number);
        const notes = [`Generated from delivery notes: ${sourceNumbers.join(', ')}`];
        const additionalNotes = deliveryNotes
            .map((note) => String(note.notes || '').trim())
            .filter(Boolean);

        if (additionalNotes.length > 0) {
            notes.push(...additionalNotes);
        }

        res.json({
            source_delivery_note_ids: deliveryNoteIds,
            source_delivery_note_numbers: sourceNumbers,
            delivery_notes: deliveryNotes.map((note) => ({
                id: note.id,
                invoice_number: note.invoice_number,
                issue_date: note.issue_date,
                total: note.total,
                currency: note.currency,
            })),
            draft_invoice: {
                client_id: firstNote.client_id,
                currency: firstNote.currency || 'EUR',
                secondary_currency: firstNote.secondary_currency || 'RON',
                exchange_rate: Number(firstNote.exchange_rate || 1),
                tax_rate: Number(firstNote.tax_rate || 0),
                notes: notes.join('\n'),
            },
            items: mergedItems,
        });
    } catch (error) {
        const status = error.status || 500;
        console.error('Error building invoice draft from delivery notes:', error);
        res.status(status).json({ error: error.message || 'Failed to build invoice draft' });
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

        if (invoice.document_type === 'invoice') {
            const relatedDeliveryNotes = await db.all(`
              SELECT
                dn.id,
                dn.invoice_number,
                dn.issue_date,
                dn.total,
                dn.currency
              FROM invoice_delivery_notes rel
              JOIN invoices dn ON dn.id = rel.delivery_note_id
              WHERE rel.invoice_id = ?
              ORDER BY dn.issue_date ASC, dn.id ASC
            `, req.params.id);

            invoice.related_delivery_notes = relatedDeliveryNotes;
            invoice.related_delivery_note_ids = relatedDeliveryNotes.map((note) => note.id);
        } else if (invoice.document_type === 'delivery_note') {
            const linkedInvoices = await db.all(`
              SELECT
                inv.id,
                inv.invoice_number,
                inv.issue_date
              FROM invoice_delivery_notes rel
              JOIN invoices inv ON inv.id = rel.invoice_id
              WHERE rel.delivery_note_id = ?
              ORDER BY inv.issue_date DESC, inv.id DESC
            `, req.params.id);

            invoice.linked_invoices = linkedInvoices;
            invoice.linked_invoice_ids = linkedInvoices.map((linkedInvoice) => linkedInvoice.id);
        }

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

        const { invoice, items, related_delivery_note_ids: relatedDeliveryNoteIdsRaw } = req.body;

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

        if ((invoice.document_type || 'invoice') === 'invoice') {
            const relatedDeliveryNoteIds = sanitizeDeliveryNoteIds(relatedDeliveryNoteIdsRaw);

            if (relatedDeliveryNoteIds.length > 0) {
                await validateDeliveryNotesForInvoice(db, relatedDeliveryNoteIds);

                for (const deliveryNoteId of relatedDeliveryNoteIds) {
                    await db.run(`
                      INSERT INTO invoice_delivery_notes (invoice_id, delivery_note_id)
                      VALUES (?, ?)
                    `, [invoiceId, deliveryNoteId]);
                }
            }
        }

        await db.exec('COMMIT');
        res.status(201).json({ id: invoiceId });
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Error creating invoice:', error);
        res.status(error.status || 500).json({ error: error.message || 'Failed to create invoice' });
    }
});

// Update invoice
router.put('/:id', async (req, res) => {
    const db = await getDb();

    try {
        await db.exec('BEGIN TRANSACTION');

        const { invoice, items, related_delivery_note_ids: relatedDeliveryNoteIdsRaw } = req.body;
        const id = req.params.id;
        const hasRelatedDeliveryNotes = Object.prototype.hasOwnProperty.call(req.body, 'related_delivery_note_ids');

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

        if ((invoice.document_type || 'invoice') !== 'invoice') {
            await db.run('DELETE FROM invoice_delivery_notes WHERE invoice_id = ?', id);
        } else if (hasRelatedDeliveryNotes) {
            const relatedDeliveryNoteIds = sanitizeDeliveryNoteIds(relatedDeliveryNoteIdsRaw);
            if (relatedDeliveryNoteIds.length > 0) {
                await validateDeliveryNotesForInvoice(db, relatedDeliveryNoteIds, parseInt(id, 10));
            }

            await db.run('DELETE FROM invoice_delivery_notes WHERE invoice_id = ?', id);
            for (const deliveryNoteId of relatedDeliveryNoteIds) {
                await db.run(`
                  INSERT INTO invoice_delivery_notes (invoice_id, delivery_note_id)
                  VALUES (?, ?)
                `, [id, deliveryNoteId]);
            }
        }

        await db.exec('COMMIT');
        res.json({ success: true });
    } catch (error) {
        await db.exec('ROLLBACK');
        console.error('Error updating invoice:', error);
        res.status(error.status || 500).json({ error: error.message || 'Failed to update invoice' });
    }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
    const db = await getDb();
    try {
        await db.run('DELETE FROM invoice_delivery_notes WHERE invoice_id = ? OR delivery_note_id = ?', [req.params.id, req.params.id]);
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
