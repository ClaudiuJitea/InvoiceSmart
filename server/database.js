import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let dbInstance = null;

export async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = path.join(__dirname, 'data', 'invoices.db');

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

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

  // Indexes
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(issue_date);
    CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
  `);

  // Default Settings
  const existingSettings = await db.get('SELECT id FROM settings WHERE id = 1');
  if (!existingSettings) {
    await db.run(`
      INSERT INTO settings (id, company_name, invoice_series, receipt_series) 
      VALUES (1, '', 'INV', 'RC')
    `);
  }

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

  // Default Admin User (password: admin123)
  const existingAdmin = await db.get('SELECT id FROM users WHERE username = ?', ['admin']);
  if (!existingAdmin) {
    const defaultPasswordHash = await bcrypt.hash('admin123', 10);
    await db.run(`
      INSERT INTO users (username, email, password_hash, full_name, role) 
      VALUES ('admin', 'admin@example.com', ?, 'Administrator', 'admin')
    `, [defaultPasswordHash]);
    console.log('Default admin user created (username: admin, password: admin123)');
  }
}
