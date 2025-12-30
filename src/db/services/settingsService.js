// Settings Service
import { db } from '../database.js';

export const settingsService = {
    // Get all settings
    get() {
        return db.queryOne('SELECT * FROM settings WHERE id = 1');
    },

    // Update settings
    update(settings) {
        return db.run(`
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
            settings.language || 'en',
        ]);
    },

    // Update single setting
    updateOne(key, value) {
        return db.run(`UPDATE settings SET ${key} = ? WHERE id = 1`, [value]);
    },

    // Increment invoice number
    incrementInvoiceNumber() {
        return db.run('UPDATE settings SET next_invoice_number = next_invoice_number + 1 WHERE id = 1');
    },
};

export default settingsService;
