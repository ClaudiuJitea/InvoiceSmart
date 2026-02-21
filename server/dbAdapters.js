import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function normalizeParams(params = []) {
  if (Array.isArray(params)) return params;
  if (params === undefined || params === null) return [];
  return [params];
}

function isInsertSql(sql) {
  return /^\s*INSERT\s+/i.test(sql);
}

function hasReturningClause(sql) {
  return /\bRETURNING\b/i.test(sql);
}

function toPostgresPlaceholders(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => {
    index += 1;
    return `$${index}`;
  });
}

export class SqliteAdapter {
  constructor(db) {
    this.db = db;
  }

  async run(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...normalizeParams(params));
    return { lastID: Number(result.lastInsertRowid || 0), changes: result.changes || 0 };
  }

  async get(sql, params = []) {
    const stmt = this.db.prepare(sql);
    return stmt.get(...normalizeParams(params));
  }

  async all(sql, params = []) {
    const stmt = this.db.prepare(sql);
    return stmt.all(...normalizeParams(params));
  }

  async exec(sql) {
    this.db.exec(sql);
  }

  async close() {
    this.db.close();
  }
}

export class PostgresAdapter {
  constructor(client) {
    this.client = client;
  }

  async run(sql, params = []) {
    const normalizedParams = normalizeParams(params);
    let preparedSql = toPostgresPlaceholders(sql);

    if (isInsertSql(preparedSql) && !hasReturningClause(preparedSql)) {
      preparedSql = `${preparedSql} RETURNING id`;
    }

    const result = await this.client.query(preparedSql, normalizedParams);
    const insertedId = result.rows?.[0]?.id ?? null;

    return {
      lastID: insertedId,
      changes: result.rowCount || 0,
    };
  }

  async get(sql, params = []) {
    const result = await this.client.query(toPostgresPlaceholders(sql), normalizeParams(params));
    return result.rows[0] || null;
  }

  async all(sql, params = []) {
    const result = await this.client.query(toPostgresPlaceholders(sql), normalizeParams(params));
    return result.rows;
  }

  async exec(sql) {
    await this.client.query(sql);
  }

  async close() {
    await this.client.end();
  }
}

export class MysqlAdapter {
  constructor(connection) {
    this.connection = connection;
  }

  async run(sql, params = []) {
    const [result] = await this.connection.query(sql, normalizeParams(params));
    return {
      lastID: result.insertId || null,
      changes: result.affectedRows || 0,
    };
  }

  async get(sql, params = []) {
    const [rows] = await this.connection.query(sql, normalizeParams(params));
    return rows[0] || null;
  }

  async all(sql, params = []) {
    const [rows] = await this.connection.query(sql, normalizeParams(params));
    return rows;
  }

  async exec(sql) {
    const normalized = String(sql || '').trim().toUpperCase();

    if (normalized === 'BEGIN TRANSACTION' || normalized === 'BEGIN') {
      await this.connection.query('START TRANSACTION');
      return;
    }

    if (normalized === 'COMMIT') {
      await this.connection.query('COMMIT');
      return;
    }

    if (normalized === 'ROLLBACK') {
      await this.connection.query('ROLLBACK');
      return;
    }

    await this.connection.query(sql);
  }

  async close() {
    await this.connection.end();
  }
}

export async function createAdapterFromConfig(config) {
  const provider = config.provider;

  if (provider === 'sqlite') {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const sqliteFilePath = config.sqlite?.filePath || 'invoices.db';
    const dbPath = path.isAbsolute(sqliteFilePath)
      ? sqliteFilePath
      : path.join(dataDir, sqliteFilePath);

    const db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    return new SqliteAdapter(db);
  }

  if (provider === 'postgres' || provider === 'supabase') {
    const pgModule = await import('pg');
    const { Client } = pgModule.default || pgModule;
    const settings = config[provider] || {};

    const client = new Client({
      host: settings.host,
      port: settings.port,
      database: settings.database,
      user: settings.user,
      password: settings.password,
      ssl: settings.ssl ? { rejectUnauthorized: false } : false,
    });

    await client.connect();
    return new PostgresAdapter(client);
  }

  if (provider === 'mysql' || provider === 'mariadb') {
    const mysql2 = await import('mysql2/promise');
    const settings = config[provider] || {};

    const connection = await mysql2.createConnection({
      host: settings.host,
      port: settings.port,
      database: settings.database,
      user: settings.user,
      password: settings.password,
      ssl: settings.ssl ? {} : undefined,
      multipleStatements: true,
    });

    return new MysqlAdapter(connection);
  }

  throw new Error(`Unsupported database provider: ${provider}`);
}
