import express from 'express';
import { getDb, reloadDatabase, testDatabaseConnection } from '../database.js';
import {
  applySecretPreservation,
  getPublicDatabaseConfig,
  loadDatabaseConfig,
  saveDatabaseConfig,
} from '../databaseConfig.js';
import {
  exportSqliteToSnapshot,
  importSnapshotToTarget,
  migrateSqliteToTarget,
  buildTargetConfigPatch,
} from '../dataMigration.js';

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

    await db.run(
      `UPDATE settings SET
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
      WHERE id = 1`,
      [
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
        settings.language || 'en',
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

router.get('/database', async (req, res) => {
  try {
    const config = loadDatabaseConfig();
    res.json(getPublicDatabaseConfig(config));
  } catch (error) {
    console.error('Error fetching database config:', error);
    res.status(500).json({ error: 'Failed to fetch database configuration' });
  }
});

router.post('/database/test', async (req, res) => {
  try {
    const currentConfig = loadDatabaseConfig();
    const candidateConfig = applySecretPreservation(currentConfig, req.body || {});

    await testDatabaseConnection(candidateConfig);

    res.json({ success: true, message: 'Database connection successful' });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to connect to database',
    });
  }
});

router.put('/database', async (req, res) => {
  try {
    const currentConfig = loadDatabaseConfig();
    const nextConfig = applySecretPreservation(currentConfig, req.body || {});

    await testDatabaseConnection(nextConfig);
    const savedConfig = saveDatabaseConfig(nextConfig);

    await reloadDatabase(savedConfig);

    res.json({
      success: true,
      config: getPublicDatabaseConfig(savedConfig),
      message: 'Database configuration updated',
    });
  } catch (error) {
    console.error('Error updating database config:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update database configuration',
    });
  }
});

router.post('/database/export', async (req, res) => {
  try {
    const snapshot = await exportSqliteToSnapshot({
      source: {
        sqliteFilePath: req.body?.source?.sqliteFilePath,
      },
    });

    res.json({
      success: true,
      snapshot,
    });
  } catch (error) {
    console.error('Error exporting database snapshot:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to export SQLite snapshot',
    });
  }
});

router.post('/database/import', async (req, res) => {
  try {
    const currentConfig = loadDatabaseConfig();
    const provider = String(req.body?.provider || currentConfig.provider || 'sqlite');
    const providerPatch = {
      [provider]: req.body?.providerConfig || {},
    };
    const patched = applySecretPreservation(currentConfig, providerPatch);
    const targetConfig = buildTargetConfigPatch(patched, provider, patched[provider]);

    const result = await importSnapshotToTarget({
      targetConfig,
      snapshot: req.body?.snapshot,
      mode: req.body?.mode || 'replace',
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error importing database snapshot:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to import snapshot',
    });
  }
});

router.post('/database/migrate', async (req, res) => {
  try {
    const currentConfig = loadDatabaseConfig();
    const provider = String(req.body?.provider || currentConfig.provider || 'postgres');
    const providerPatch = {
      [provider]: req.body?.providerConfig || {},
    };
    const patched = applySecretPreservation(currentConfig, providerPatch);
    const targetConfig = buildTargetConfigPatch(patched, provider, patched[provider]);

    const result = await migrateSqliteToTarget({
      source: {
        sqliteFilePath: req.body?.source?.sqliteFilePath,
      },
      targetConfig,
      mode: req.body?.mode || 'replace',
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error migrating SQLite data:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to migrate SQLite data',
    });
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
