import bcrypt from 'bcryptjs';
import { createAdapterFromConfig } from './dbAdapters.js';
import {
  loadDatabaseConfig,
  normalizeDatabaseConfig,
  saveDatabaseConfig,
  SUPPORTED_PROVIDERS,
} from './databaseConfig.js';
import {
  getSchemaStatements,
  getIndexStatements,
  getMigrationStatements,
} from './schema.js';

let dbInstance = null;
let activeConfig = null;

async function initializeSchema(db, provider) {
  const statements = getSchemaStatements(provider);
  for (const sql of statements) {
    await db.exec(sql);
  }

  for (const sql of getIndexStatements(provider)) {
    try {
      await db.exec(sql);
    } catch {
      // Ignore duplicate index errors on engines without IF NOT EXISTS support.
    }
  }

  for (const sql of getMigrationStatements(provider)) {
    try {
      await db.exec(sql);
    } catch {
      // Ignore migration errors when columns already exist.
    }
  }
}

async function ensureDefaults(db) {
  const existingSettings = await db.get('SELECT id FROM settings WHERE id = 1');
  if (!existingSettings) {
    const defaultSeriesTemplates = JSON.stringify([
      {
        id: 'default-invoice',
        document_type: 'invoice',
        prefix: 'INV',
        separator: '-',
        next_number: 1,
        number_padding: 4,
        is_default: true,
      },
    ]);

    await db.run(
      `INSERT INTO settings (id, company_name, invoice_series, receipt_series, document_series_templates)
       VALUES (1, '', 'INV', 'RC', ?)`,
      [defaultSeriesTemplates]
    );
  }

  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await db.get('SELECT id FROM users WHERE username = ?', [adminUsername]);
  if (!existingAdmin) {
    const defaultPasswordHash = await bcrypt.hash(adminPassword, 10);
    await db.run(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES (?, ?, ?, 'Administrator', 'admin')`,
      [adminUsername, adminEmail, defaultPasswordHash]
    );
    console.log(`Default admin user created (username: ${adminUsername})`);
  }
}

export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const config = loadDatabaseConfig();
  const provider = config.provider;

  dbInstance = await createAdapterFromConfig(config);
  await initializeSchema(dbInstance, provider);
  await ensureDefaults(dbInstance);

  activeConfig = config;
  return dbInstance;
}

export function getActiveDatabaseConfig() {
  if (activeConfig) return normalizeDatabaseConfig(activeConfig);
  return loadDatabaseConfig();
}

export async function closeDb() {
  if (dbInstance && typeof dbInstance.close === 'function') {
    await dbInstance.close();
  }
  dbInstance = null;
  activeConfig = null;
}

export async function reloadDatabase(configPatch) {
  if (configPatch) {
    saveDatabaseConfig(configPatch);
  }

  await closeDb();
  return getDb();
}

export async function testDatabaseConnection(config) {
  const normalized = normalizeDatabaseConfig(config);
  validateDatabaseConnectionConfig(normalized);
  const testAdapter = await createAdapterFromConfig(normalized);
  try {
    await testAdapter.get('SELECT 1 AS ok');
  } finally {
    await testAdapter.close();
  }
}

function validateDatabaseConnectionConfig(config) {
  const provider = config.provider;
  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    throw new Error(`Unsupported database provider: ${provider}`);
  }

  if (provider === 'sqlite') {
    const filePath = String(config.sqlite?.filePath || '').trim();
    if (!filePath) {
      throw new Error('SQLite file path is required');
    }
    return;
  }

  const providerConfig = config[provider] || {};
  const missingFields = [];

  if (!String(providerConfig.host || '').trim()) missingFields.push('host');
  if (!String(providerConfig.database || '').trim()) missingFields.push('database');
  if (!String(providerConfig.user || '').trim()) missingFields.push('user');
  if (!Number.isFinite(Number(providerConfig.port)) || Number(providerConfig.port) <= 0) missingFields.push('port');

  if (missingFields.length > 0) {
    throw new Error(
      `Missing or invalid ${provider} fields: ${missingFields.join(', ')}`
    );
  }
}
