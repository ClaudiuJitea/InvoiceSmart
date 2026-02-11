// SQLite Database initialization and management

// Load sql.js from CDN - this is the most reliable approach
async function loadSqlJs() {
    if (window.initSqlJs) {
        return window.initSqlJs;
    }

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.min.js';
        script.onload = () => resolve(window.initSqlJs);
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

class Database {
    constructor() {
        this.db = null;
        this.initialized = false;
        this.SQL = null;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Load sql.js from CDN
            const initSqlJs = await loadSqlJs();

            // Initialize SQL.js
            this.SQL = await initSqlJs({
                locateFile: () => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm'
            });

            // Try to load existing database from IndexedDB
            const savedData = await this.loadFromIndexedDB();

            if (savedData) {
                this.db = new this.SQL.Database(savedData);
            } else {
                this.db = new this.SQL.Database();
                this.createSchema();
                this.insertDefaultSettings();
            }

            this.initialized = true;
            this.runMigrations();

            // Auto-save on changes
            this.setupAutoSave();

            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    createSchema() {
        this.db.run(`
      -- Company/Business Settings
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

      -- Clients
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

      -- Invoices
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

      -- Invoice Items
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        unit TEXT DEFAULT 'hrs',
        quantity REAL DEFAULT 1,
        unit_price REAL DEFAULT 0,
        total REAL DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(issue_date);
      CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
    `);
    }

    insertDefaultSettings() {
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

        this.db.run(`
      INSERT INTO settings (id, company_name, invoice_series, document_series_templates) 
      VALUES (?, ?, ?, ?)
    `, [1, '', 'INV', defaultSeriesTemplates]);
    }

    runMigrations() {
        try {
            // Check if columns exist in settings
            const settingsInfo = this.query("PRAGMA table_info(settings)");
            const settingsColumns = settingsInfo.map(c => c.name);
            if (!settingsColumns.includes('company_city')) {
                console.log('Migrating: Adding company_city to settings');
                this.db.run("ALTER TABLE settings ADD COLUMN company_city TEXT");
            }
            if (!settingsColumns.includes('company_country')) {
                console.log('Migrating: Adding company_country to settings');
                this.db.run("ALTER TABLE settings ADD COLUMN company_country TEXT");
            }
            if (!settingsColumns.includes('document_series_templates')) {
                console.log('Migrating: Adding document_series_templates to settings');
                this.db.run("ALTER TABLE settings ADD COLUMN document_series_templates TEXT");
            }

            // Check if columns exist in clients
            const clientInfo = this.query("PRAGMA table_info(clients)");
            const clientColumns = clientInfo.map(c => c.name);
            if (!clientColumns.includes('city')) {
                console.log('Migrating: Adding city column to clients');
                this.db.run("ALTER TABLE clients ADD COLUMN city TEXT");
            }
            if (!clientColumns.includes('bank_account')) {
                console.log('Migrating: Adding bank_account column to clients');
                this.db.run("ALTER TABLE clients ADD COLUMN bank_account TEXT");
            }
            if (!clientColumns.includes('bank_name')) {
                console.log('Migrating: Adding bank_name column to clients');
                this.db.run("ALTER TABLE clients ADD COLUMN bank_name TEXT");
            }

            // Check if columns exist in invoices
            const tableInfo = this.query("PRAGMA table_info(invoices)");
            const columns = tableInfo.map(c => c.name);

            if (!columns.includes('language')) {
                console.log('Migrating: Adding language column to invoices');
                this.db.run("ALTER TABLE invoices ADD COLUMN language TEXT DEFAULT 'en'");
            }
            if (!columns.includes('secondary_language')) {
                console.log('Migrating: Adding secondary_language column to invoices');
                this.db.run("ALTER TABLE invoices ADD COLUMN secondary_language TEXT DEFAULT 'ro'");
            }
            if (!columns.includes('language_mode')) {
                console.log('Migrating: Adding language_mode column to invoices');
                this.db.run("ALTER TABLE invoices ADD COLUMN language_mode TEXT DEFAULT 'single'");
            }
            if (!columns.includes('document_type')) {
                console.log('Migrating: Adding document_type column to invoices');
                this.db.run("ALTER TABLE invoices ADD COLUMN document_type TEXT DEFAULT 'invoice'");
            }

            // Check invoice_items columns
            const itemTableInfo = this.query("PRAGMA table_info(invoice_items)");
            const itemColumns = itemTableInfo.map(c => c.name);

            if (!itemColumns.includes('tax_rate')) {
                console.log('Migrating: Adding tax_rate column to invoice_items');
                this.db.run("ALTER TABLE invoice_items ADD COLUMN tax_rate REAL DEFAULT 0");
            }
        } catch (error) {
            console.error('Migration error:', error);
        }
    }

    // Execute a query and return all results
    query(sql, params = []) {
        try {
            const stmt = this.db.prepare(sql);
            stmt.bind(params);

            const results = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            stmt.free();

            return results;
        } catch (error) {
            console.error('Query error:', error, sql);
            throw error;
        }
    }

    // Execute a query and return first result
    queryOne(sql, params = []) {
        const results = this.query(sql, params);
        return results[0] || null;
    }

    // Execute a mutation (INSERT, UPDATE, DELETE)
    run(sql, params = []) {
        try {
            this.db.run(sql, params);
            this.scheduleAutoSave();
            return this.db.getRowsModified();
        } catch (error) {
            console.error('Run error:', error, sql);
            throw error;
        }
    }

    // Get last inserted row ID
    getLastInsertId() {
        const result = this.queryOne('SELECT last_insert_rowid() as id');
        return result ? result.id : null;
    }

    // Schedule auto-save (debounced)
    scheduleAutoSave() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => this.saveToIndexedDB(), 1000);
    }

    setupAutoSave() {
        // Save before page unload
        window.addEventListener('beforeunload', () => {
            this.saveToIndexedDB();
        });
    }

    // Save database to IndexedDB
    async saveToIndexedDB() {
        try {
            const data = this.db.export();
            const buffer = new Uint8Array(data);

            const request = indexedDB.open('InvoiceManagerDB', 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('database')) {
                    db.createObjectStore('database');
                }
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['database'], 'readwrite');
                const store = transaction.objectStore('database');
                store.put(buffer, 'main');
            };
        } catch (error) {
            console.error('Failed to save to IndexedDB:', error);
        }
    }

    // Load database from IndexedDB
    loadFromIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('InvoiceManagerDB', 1);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('database')) {
                    db.createObjectStore('database');
                }
            };

            request.onsuccess = (event) => {
                const db = event.target.result;
                const transaction = db.transaction(['database'], 'readonly');
                const store = transaction.objectStore('database');
                const getRequest = store.get('main');

                getRequest.onsuccess = () => {
                    resolve(getRequest.result || null);
                };

                getRequest.onerror = () => {
                    resolve(null);
                };
            };

            request.onerror = () => {
                resolve(null);
            };
        });
    }

    // Export database as downloadable file
    exportDatabase() {
        const data = this.db.export();
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-backup-${new Date().toISOString().split('T')[0]}.db`;
        a.click();

        URL.revokeObjectURL(url);
    }

    // Import database from file
    async importDatabase(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const buffer = new Uint8Array(e.target.result);
                    this.db = new this.SQL.Database(buffer);
                    await this.saveToIndexedDB();
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }
}

// Singleton instance
export const db = new Database();
export default db;
