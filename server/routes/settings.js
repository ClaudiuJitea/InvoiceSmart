import express from 'express';
import { getDb } from '../database.js';

const router = express.Router();

// Get settings
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const settings = await db.get('SELECT * FROM settings WHERE id = 1');
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update settings
router.put('/', async (req, res) => {
    try {
        const db = await getDb();
        const settings = req.body;

        await db.run(`
      UPDATE settings SET
        company_name = ?,
        company_cif = ?,
        company_reg_no = ?,
        company_address = ?,
        company_city = ?,
        company_country = ?,
        company_email = ?,
        company_phone = ?,
        company_bank_account = ?,
        company_swift = ?,
        company_bank_name = ?,
        default_currency = ?,
        secondary_currency = ?,
        default_payment_terms = ?,
        invoice_series = ?,
        next_invoice_number = ?,
        document_series_templates = ?,
        language = ?
      WHERE id = 1
    `, [
            settings.company_name || '',
            settings.company_cif || '',
            settings.company_reg_no || '',
            settings.company_address || '',
            settings.company_city || '',
            settings.company_country || '',
            settings.company_email || '',
            settings.company_phone || '',
            settings.company_bank_account || '',
            settings.company_swift || '',
            settings.company_bank_name || '',
            settings.default_currency || 'EUR',
            settings.secondary_currency || 'RON',
            settings.default_payment_terms || 30,
            settings.invoice_series || 'INV',
            settings.next_invoice_number || 1,
            settings.document_series_templates || null,
            settings.language || 'en'
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

// Increment invoice number
router.post('/increment-invoice', async (req, res) => {
    try {
        const db = await getDb();
        await db.run('UPDATE settings SET next_invoice_number = next_invoice_number + 1 WHERE id = 1');

        res.json({ success: true });
    } catch (error) {
        console.error('Error incrementing invoice number:', error);
        res.status(500).json({ error: 'Failed to increment invoice number' });
    }
});

export default router;
