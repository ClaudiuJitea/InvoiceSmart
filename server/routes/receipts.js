
import express from 'express';
import { getDb } from '../database.js';

const router = express.Router();

// Get all receipts
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const receipts = await db.all(
            'SELECT * FROM receipts ORDER BY created_at DESC'
        );
        res.json(receipts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get receipts for an invoice
router.get('/invoice/:invoiceId', async (req, res) => {
    try {
        const db = await getDb();
        const receipts = await db.all(
            'SELECT * FROM receipts WHERE invoice_id = ? ORDER BY created_at DESC',
            [req.params.invoiceId]
        );
        res.json(receipts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new receipt
router.post('/', async (req, res) => {
    const { invoice_id, issue_date, notes } = req.body;

    if (!invoice_id) {
        return res.status(400).json({ error: 'Invoice ID is required' });
    }

    try {
        const db = await getDb();

        // Start a transaction
        await db.exec('BEGIN TRANSACTION');

        try {
            // 1. Get the invoice to verify it exists and get the amount
            const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', [invoice_id]);
            if (!invoice) {
                throw new Error('Invoice not found');
            }

            // 2. Get settings for receipt numbering
            const settings = await db.get('SELECT receipt_series, next_receipt_number FROM settings WHERE id = 1');
            const series = settings.receipt_series || 'RC';
            const number = settings.next_receipt_number || 1;
            const receipt_number = `${series}${String(number).padStart(4, '0')}`;

            // 3. Create the receipt
            const result = await db.run(
                `INSERT INTO receipts (
          invoice_id, 
          receipt_number, 
          series, 
          number, 
          issue_date, 
          amount, 
          currency, 
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    invoice_id,
                    receipt_number,
                    series,
                    number,
                    issue_date || new Date().toISOString().split('T')[0],
                    invoice.total, // Utilizing the invoice total amount
                    invoice.currency,
                    notes || ''
                ]
            );

            // 4. Update the next receipt number
            await db.run('UPDATE settings SET next_receipt_number = ? WHERE id = 1', [number + 1]);

            // 5. Mark invoice as paid
            await db.run("UPDATE invoices SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [invoice_id]);

            await db.exec('COMMIT');

            // Return the new receipt
            const newReceipt = await db.get('SELECT * FROM receipts WHERE id = ?', [result.lastID]);
            res.status(201).json(newReceipt);

        } catch (error) {
            await db.exec('ROLLBACK');
            throw error;
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
