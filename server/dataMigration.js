import {
  applySecretPreservation,
  loadDatabaseConfig,
  mergeDatabaseConfig,
  normalizeDatabaseConfig,
} from './databaseConfig.js';
import { createAdapterFromConfig } from './dbAdapters.js';
import { getIndexStatements, getMigrationStatements, getSchemaStatements } from './schema.js';

const EXPORT_TABLE_ORDER = [
  'settings',
  'users',
  'clients',
  'products',
  'invoices',
  'invoice_items',
  'invoice_delivery_notes',
  'receipts',
  'audit_logs',
];

const IMPORT_TABLE_ORDER = [...EXPORT_TABLE_ORDER];
const CLEAR_TABLE_ORDER = [...IMPORT_TABLE_ORDER].reverse();

async function initializeSchema(db, provider) {
  for (const sql of getSchemaStatements(provider)) {
    await db.exec(sql);
  }

  for (const sql of getIndexStatements(provider)) {
    try {
      await db.exec(sql);
    } catch {
      // Ignore duplicate index creation errors on engines that don't support IF NOT EXISTS.
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

async function withTransaction(db, fn) {
  await db.exec('BEGIN TRANSACTION');
  try {
    const result = await fn();
    await db.exec('COMMIT');
    return result;
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

function normalizeRowValue(value) {
  if (value === undefined) return null;
  return value;
}

function normalizeTargetConfig(targetInput = {}) {
  const currentConfig = loadDatabaseConfig();
  const merged = applySecretPreservation(currentConfig, targetInput);
  return normalizeDatabaseConfig(merged);
}

async function readTableRows(db, tableName) {
  try {
    const rows = await db.all(`SELECT * FROM ${tableName}`);
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function prepareSourceSqliteConfig(source = {}) {
  const currentConfig = loadDatabaseConfig();
  const currentPath = currentConfig.sqlite?.filePath || 'invoices.db';

  const sourcePath = String(source.sqliteFilePath || currentPath).trim();
  if (!sourcePath) {
    throw new Error('SQLite source file path is required');
  }

  return normalizeDatabaseConfig({
    provider: 'sqlite',
    sqlite: {
      filePath: sourcePath,
    },
  });
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSnapshot(snapshot) {
  if (!isObject(snapshot) || !isObject(snapshot.tables)) {
    throw new Error('Invalid snapshot format');
  }

  const normalizedTables = {};
  for (const tableName of EXPORT_TABLE_ORDER) {
    const rows = snapshot.tables[tableName];
    normalizedTables[tableName] = Array.isArray(rows) ? rows : [];
  }

  return {
    version: snapshot.version || 1,
    exportedAt: snapshot.exportedAt || new Date().toISOString(),
    source: snapshot.source || 'unknown',
    tables: normalizedTables,
  };
}

async function resetIdentityIfNeeded(targetDb, provider, tableName) {
  if (provider === 'postgres' || provider === 'supabase') {
    await targetDb.exec(
      `SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), COALESCE((SELECT MAX(id) FROM ${tableName}), 1), true)`
    );
    return;
  }

  if (provider === 'mysql' || provider === 'mariadb') {
    const row = await targetDb.get(`SELECT COALESCE(MAX(id), 0) AS max_id FROM ${tableName}`);
    const nextId = Number(row?.max_id || 0) + 1;
    await targetDb.exec(`ALTER TABLE ${tableName} AUTO_INCREMENT = ${nextId}`);
  }
}

async function importIntoTarget(targetDb, targetProvider, snapshot, mode = 'replace') {
  const normalizedSnapshot = normalizeSnapshot(snapshot);
  const effectiveMode = mode === 'append' ? 'append' : 'replace';
  const counts = {};

  await initializeSchema(targetDb, targetProvider);

  await withTransaction(targetDb, async () => {
    if (effectiveMode === 'replace') {
      for (const tableName of CLEAR_TABLE_ORDER) {
        await targetDb.run(`DELETE FROM ${tableName}`);
      }
    }

    for (const tableName of IMPORT_TABLE_ORDER) {
      const rows = normalizedSnapshot.tables[tableName] || [];
      let inserted = 0;

      for (const row of rows) {
        const entries = Object.entries(row || {});
        if (entries.length === 0) continue;

        const columns = entries.map(([key]) => key);
        const values = entries.map(([, value]) => normalizeRowValue(value));
        const placeholders = columns.map(() => '?').join(', ');

        await targetDb.run(
          `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
          values
        );

        inserted += 1;
      }

      counts[tableName] = inserted;
    }

    if (effectiveMode === 'replace') {
      for (const tableName of IMPORT_TABLE_ORDER) {
        await resetIdentityIfNeeded(targetDb, targetProvider, tableName);
      }
    }
  });

  return counts;
}

export async function exportSqliteToSnapshot({ source }) {
  const sourceConfig = prepareSourceSqliteConfig(source);
  const sourceDb = await createAdapterFromConfig(sourceConfig);

  try {
    const tables = {};
    for (const tableName of EXPORT_TABLE_ORDER) {
      tables[tableName] = await readTableRows(sourceDb, tableName);
    }

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      source: `sqlite:${sourceConfig.sqlite.filePath}`,
      tables,
    };
  } finally {
    await sourceDb.close();
  }
}

export async function importSnapshotToTarget({ targetConfig, snapshot, mode = 'replace' }) {
  const normalizedTargetConfig = normalizeTargetConfig(targetConfig || {});
  const targetDb = await createAdapterFromConfig(normalizedTargetConfig);

  try {
    const counts = await importIntoTarget(
      targetDb,
      normalizedTargetConfig.provider,
      snapshot,
      mode
    );

    return {
      provider: normalizedTargetConfig.provider,
      counts,
    };
  } finally {
    await targetDb.close();
  }
}

export async function migrateSqliteToTarget({ source, targetConfig, mode = 'replace' }) {
  const snapshot = await exportSqliteToSnapshot({ source });
  const result = await importSnapshotToTarget({ targetConfig, snapshot, mode });

  return {
    ...result,
    exportedAt: snapshot.exportedAt,
    source: snapshot.source,
  };
}

export function buildTargetConfigPatch(baseConfig, provider, providerConfig) {
  return mergeDatabaseConfig(baseConfig, {
    provider,
    [provider]: providerConfig,
  });
}
