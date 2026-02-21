function idColumn(provider) {
  if (provider === 'postgres' || provider === 'supabase') return 'BIGSERIAL PRIMARY KEY';
  if (provider === 'mysql' || provider === 'mariadb') return 'BIGINT PRIMARY KEY AUTO_INCREMENT';
  return 'INTEGER PRIMARY KEY AUTOINCREMENT';
}

function textType(provider) {
  if (provider === 'mysql' || provider === 'mariadb') return 'VARCHAR(255)';
  return 'TEXT';
}

function booleanType(provider) {
  if (provider === 'postgres' || provider === 'supabase') return 'BOOLEAN';
  return 'INTEGER';
}

function truthy(provider) {
  if (provider === 'postgres' || provider === 'supabase') return 'TRUE';
  return '1';
}

export function getSchemaStatements(provider) {
  const id = idColumn(provider);
  const text = textType(provider);
  const bool = booleanType(provider);
  const boolTrue = truthy(provider);

  return [
    `CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY,
      company_name ${text},
      company_cif ${text},
      company_reg_no ${text},
      company_address TEXT,
      company_city ${text},
      company_country ${text},
      company_email ${text},
      company_phone ${text},
      company_bank_account ${text},
      company_swift ${text},
      company_bank_name ${text},
      default_currency ${text} DEFAULT 'EUR',
      secondary_currency ${text} DEFAULT 'RON',
      default_payment_terms INTEGER DEFAULT 30,
      invoice_series ${text} DEFAULT 'INV',
      next_invoice_number INTEGER DEFAULT 1,
      document_series_templates TEXT,
      language ${text} DEFAULT 'en',
      receipt_series ${text} DEFAULT 'RC',
      next_receipt_number INTEGER DEFAULT 1
    )`,

    `CREATE TABLE IF NOT EXISTS clients (
      id ${id},
      name ${text} NOT NULL,
      cif ${text},
      reg_no ${text},
      address TEXT,
      city ${text},
      email ${text},
      phone ${text},
      country ${text},
      bank_account ${text},
      bank_name ${text},
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS products (
      id ${id},
      name ${text} NOT NULL,
      producer ${text},
      category ${text},
      product_code ${text},
      unit ${text} DEFAULT 'pcs',
      unit_price DOUBLE PRECISION DEFAULT 0,
      tax_rate DOUBLE PRECISION DEFAULT 0,
      stock_quantity DOUBLE PRECISION DEFAULT 0,
      notes TEXT,
      is_active ${bool} DEFAULT ${boolTrue},
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS invoices (
      id ${id},
      invoice_number ${text} NOT NULL UNIQUE,
      series ${text} NOT NULL,
      client_id BIGINT NOT NULL,
      issue_date DATE NOT NULL,
      due_date DATE NOT NULL,
      currency ${text} DEFAULT 'EUR',
      exchange_rate DOUBLE PRECISION DEFAULT 1.0,
      subtotal DOUBLE PRECISION DEFAULT 0,
      tax_rate DOUBLE PRECISION DEFAULT 0,
      tax_amount DOUBLE PRECISION DEFAULT 0,
      total DOUBLE PRECISION DEFAULT 0,
      total_secondary DOUBLE PRECISION DEFAULT 0,
      secondary_currency ${text} DEFAULT 'RON',
      payment_method ${text},
      notes TEXT,
      document_type ${text} DEFAULT 'invoice',
      status ${text} DEFAULT 'draft',
      template ${text} DEFAULT 'modern',
      language ${text} DEFAULT 'en',
      secondary_language ${text} DEFAULT 'ro',
      language_mode ${text} DEFAULT 'single',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id)
    )`,

    `CREATE TABLE IF NOT EXISTS invoice_items (
      id ${id},
      invoice_id BIGINT NOT NULL,
      description TEXT NOT NULL,
      unit ${text} DEFAULT 'hrs',
      quantity DOUBLE PRECISION DEFAULT 1,
      unit_price DOUBLE PRECISION DEFAULT 0,
      total DOUBLE PRECISION DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      tax_rate DOUBLE PRECISION DEFAULT 0,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS invoice_delivery_notes (
      id ${id},
      invoice_id BIGINT NOT NULL,
      delivery_note_id BIGINT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
      FOREIGN KEY (delivery_note_id) REFERENCES invoices(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS users (
      id ${id},
      username ${text} NOT NULL UNIQUE,
      email ${text} NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name ${text},
      role ${text} DEFAULT 'user',
      is_active ${bool} DEFAULT ${boolTrue},
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id ${id},
      user_id BIGINT,
      username_snapshot ${text},
      action ${text} NOT NULL,
      method ${text} NOT NULL,
      path ${text} NOT NULL,
      status_code INTEGER,
      details TEXT,
      ip_address ${text},
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS receipts (
      id ${id},
      invoice_id BIGINT NOT NULL,
      receipt_number ${text} NOT NULL UNIQUE,
      series ${text} NOT NULL,
      number INTEGER NOT NULL,
      issue_date DATE NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      currency ${text} DEFAULT 'RON',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    )`,
  ];
}

export function getIndexStatements(provider) {
  const supportsIfNotExists = provider === 'sqlite' || provider === 'postgres' || provider === 'supabase';
  const ifNotExists = supportsIfNotExists ? ' IF NOT EXISTS' : '';

  return [
    `CREATE INDEX${ifNotExists} idx_invoices_client ON invoices(client_id)`,
    `CREATE INDEX${ifNotExists} idx_invoices_date ON invoices(issue_date)`,
    `CREATE INDEX${ifNotExists} idx_products_name ON products(name)`,
    `CREATE INDEX${ifNotExists} idx_products_code ON products(product_code)`,
    `CREATE INDEX${ifNotExists} idx_products_category ON products(category)`,
    `CREATE INDEX${ifNotExists} idx_invoice_items_invoice ON invoice_items(invoice_id)`,
    `CREATE INDEX${ifNotExists} idx_invoice_delivery_notes_invoice ON invoice_delivery_notes(invoice_id)`,
    `CREATE INDEX${ifNotExists} idx_audit_logs_user ON audit_logs(user_id)`,
    `CREATE INDEX${ifNotExists} idx_audit_logs_created_at ON audit_logs(created_at)`,
    `CREATE INDEX${ifNotExists} idx_users_email ON users(email)`,
    `CREATE INDEX${ifNotExists} idx_users_username ON users(username)`,
  ];
}

export function getMigrationStatements(provider) {
  if (provider === 'sqlite') {
    return [
      "ALTER TABLE settings ADD COLUMN receipt_series TEXT DEFAULT 'RC'",
      'ALTER TABLE settings ADD COLUMN next_receipt_number INTEGER DEFAULT 1',
      'ALTER TABLE settings ADD COLUMN document_series_templates TEXT',
      "ALTER TABLE invoices ADD COLUMN document_type TEXT DEFAULT 'invoice'",
    ];
  }

  if (provider === 'postgres' || provider === 'supabase') {
    return [
      "ALTER TABLE settings ADD COLUMN IF NOT EXISTS receipt_series TEXT DEFAULT 'RC'",
      'ALTER TABLE settings ADD COLUMN IF NOT EXISTS next_receipt_number INTEGER DEFAULT 1',
      'ALTER TABLE settings ADD COLUMN IF NOT EXISTS document_series_templates TEXT',
      "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'invoice'",
    ];
  }

  return [
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS receipt_series VARCHAR(255) DEFAULT 'RC'",
    'ALTER TABLE settings ADD COLUMN IF NOT EXISTS next_receipt_number INTEGER DEFAULT 1',
    'ALTER TABLE settings ADD COLUMN IF NOT EXISTS document_series_templates TEXT',
    "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_type VARCHAR(255) DEFAULT 'invoice'",
  ];
}
