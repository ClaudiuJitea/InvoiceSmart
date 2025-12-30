// Client Service - CRUD operations for clients
import { db } from '../database.js';

export const clientService = {
  // Get all clients
  getAll() {
    return db.query(`
      SELECT * FROM clients 
      ORDER BY name ASC
    `);
  },

  // Get client by ID
  getById(id) {
    return db.queryOne(`
      SELECT * FROM clients WHERE id = ?
    `, [id]);
  },

  // Search clients by name
  search(query) {
    return db.query(`
      SELECT * FROM clients 
      WHERE name LIKE ? OR cif LIKE ?
      ORDER BY name ASC
    `, [`%${query}%`, `%${query}%`]);
  },

  // Create new client
  create(client) {
    db.run(`
      INSERT INTO clients (name, cif, reg_no, address, city, email, phone, country, bank_account, bank_name, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      client.name,
      client.cif || null,
      client.reg_no || null,
      client.address || null,
      client.city || null,
      client.email || null,
      client.phone || null,
      client.country || null,
      client.bank_account || null,
      client.bank_name || null,
      client.notes || null,
    ]);

    return db.getLastInsertId();
  },

  // Update client
  update(id, client) {
    return db.run(`
      UPDATE clients SET
        name = ?,
        cif = ?,
        reg_no = ?,
        address = ?,
        city = ?,
        email = ?,
        phone = ?,
        country = ?,
        bank_account = ?,
        bank_name = ?,
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      client.name,
      client.cif || null,
      client.reg_no || null,
      client.address || null,
      client.city || null,
      client.email || null,
      client.phone || null,
      client.country || null,
      client.bank_account || null,
      client.bank_name || null,
      client.notes || null,
      id,
    ]);
  },

  // Delete client
  delete(id) {
    return db.run('DELETE FROM clients WHERE id = ?', [id]);
  },

  // Get client count
  getCount() {
    const result = db.queryOne('SELECT COUNT(*) as count FROM clients');
    return result ? result.count : 0;
  },
};

export default clientService;
