import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

// Wrapper class to provide async-like API for compatibility with existing code
class DbWrapper {
  constructor(db) {
    this.db = db;
  }

  async run(sql, params = []) {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...(Array.isArray(params) ? params : [params]));
    return { lastID: result.lastInsertRowid, changes: result.changes };
  }

  async get(sql, params = []) {
    const stmt = this.db.prepare(sql);
    return stmt.get(...(Array.isArray(params) ? params : [params]));
  }

  async all(sql, params = []) {
    const stmt = this.db.prepare(sql);
    return stmt.all(...(Array.isArray(params) ? params : [params]));
  }

  async exec(sql) {
    this.db.exec(sql);
  }
}

export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const dataDir = path.join(__dirname, 'data');
  const dbPath = path.join(dataDir, 'invoices.db');

  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  dbInstance = new DbWrapper(db);

  await initDb(dbInstance);

  return dbInstance;
}

async function initDb(db) {
  // Company/Business Settings
  await db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      company_name TEXT,
      company_cif TEXT,
      company_reg_no TEXT,
      company_address TEXT,
      company_city TEXT,
      company_country TEXT,
      company_email TEXT,
      company_phone TEXT,
      company_bank_account TEXT,
      company_swift TEXT,
      company_bank_name TEXT,
      default_currency TEXT DEFAULT 'EUR',
      secondary_currency TEXT DEFAULT 'RON',
      default_payment_terms INTEGER DEFAULT 30,
      invoice_series TEXT DEFAULT 'INV',
      next_invoice_number INTEGER DEFAULT 1,
      document_series_templates TEXT,
      language TEXT DEFAULT 'en'
    );
  `);

  // Clients
  await db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      cif TEXT,
      reg_no TEXT,
      address TEXT,
      city TEXT,
      email TEXT,
      phone TEXT,
      country TEXT,
      bank_account TEXT,
      bank_name TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Products & Services catalog
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      producer TEXT,
      category TEXT,
      product_code TEXT,
      unit TEXT DEFAULT 'pcs',
      unit_price REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      stock_quantity REAL DEFAULT 0,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Invoices
  await db.exec(`
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT NOT NULL UNIQUE,
      series TEXT NOT NULL,
      client_id INTEGER NOT NULL,
      issue_date DATE NOT NULL,
      due_date DATE NOT NULL,
      currency TEXT DEFAULT 'EUR',
      exchange_rate REAL DEFAULT 1.0,
      subtotal REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      total_secondary REAL DEFAULT 0,
      secondary_currency TEXT DEFAULT 'RON',
      payment_method TEXT,
      notes TEXT,
      document_type TEXT DEFAULT 'invoice',
      status TEXT DEFAULT 'draft',
      template TEXT DEFAULT 'modern',
      language TEXT DEFAULT 'en',
      secondary_language TEXT DEFAULT 'ro',
      language_mode TEXT DEFAULT 'single',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );
  `);

  // Invoice Items
  await db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      unit TEXT DEFAULT 'hrs',
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      total REAL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
  `);

  // Invoice <-> Delivery Note relations
  await db.exec(`
    CREATE TABLE IF NOT EXISTS invoice_delivery_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      delivery_note_id INTEGER NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (delivery_note_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
  `);

  // Users table for authentication
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      is_active INTEGER DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Audit logs (admin-only visibility)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username_snapshot TEXT,
      action TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      status_code INTEGER,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Indexes
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(issue_date);
    CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
    CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_invoice_delivery_notes_invoice ON invoice_delivery_notes(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  // Receipts
  await db.exec(`
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      receipt_number TEXT NOT NULL UNIQUE,
      series TEXT NOT NULL,
      number INTEGER NOT NULL,
      issue_date DATE NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'RON',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );
  `);

  // Add columns to settings if they don't exist (migration)
  try {
    await db.exec("ALTER TABLE settings ADD COLUMN receipt_series TEXT DEFAULT 'RC'");
  } catch (e) { }
  try {
    await db.exec("ALTER TABLE settings ADD COLUMN next_receipt_number INTEGER DEFAULT 1");
  } catch (e) { }
  try {
    await db.exec("ALTER TABLE settings ADD COLUMN document_series_templates TEXT");
  } catch (e) { }
  try {
    await db.exec("ALTER TABLE invoices ADD COLUMN document_type TEXT DEFAULT 'invoice'");
  } catch (e) { }

  // Default Settings (after migrations so receipt_series column exists)
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

    await db.run(`
      INSERT INTO settings (id, company_name, invoice_series, receipt_series, document_series_templates)
      VALUES (1, '', 'INV', 'RC', ?)
    `, [defaultSeriesTemplates]);
  }

  // Default Admin User
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await db.get('SELECT id FROM users WHERE username = ?', [adminUsername]);
  if (!existingAdmin) {
    const defaultPasswordHash = await bcrypt.hash(adminPassword, 10);
    await db.run(`
      INSERT INTO users (username, email, password_hash, full_name, role) 
      VALUES (?, ?, ?, 'Administrator', 'admin')
    `, [adminUsername, adminEmail, defaultPasswordHash]);
    console.log(`Default admin user created (username: ${adminUsername})`);
  }
}
