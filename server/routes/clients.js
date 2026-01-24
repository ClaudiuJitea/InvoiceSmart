import express from 'express';
import { getDb } from '../database.js';

const router = express.Router();

// Get all clients
router.get('/', async (req, res) => {
    try {
        const db = await getDb();
        const query = req.query.q;

        if (query) {
            const clients = await db.all(`
        SELECT * FROM clients 
        WHERE name LIKE ? OR cif LIKE ?
        ORDER BY name ASC
      `, [`%${query}%`, `%${query}%`]);
            res.json(clients);
        } else {
            const clients = await db.all('SELECT * FROM clients ORDER BY name ASC');
            res.json(clients);
        }
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

// Get client by ID
router.get('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const client = await db.get('SELECT * FROM clients WHERE id = ?', req.params.id);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json(client);
    } catch (error) {
        console.error('Error fetching client:', error);
        res.status(500).json({ error: 'Failed to fetch client' });
    }
});

// Create client
router.post('/', async (req, res) => {
    try {
        const db = await getDb();
        const client = req.body;

        const result = await db.run(`
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

        res.status(201).json({ id: result.lastID });
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
});

// Update client
router.put('/:id', async (req, res) => {
    try {
        const db = await getDb();
        const client = req.body;

        await db.run(`
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
            req.params.id,
        ]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client' });
    }
});

// Delete client
router.delete('/:id', async (req, res) => {
    try {
        const db = await getDb();
        await db.run('DELETE FROM clients WHERE id = ?', req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
});

export default router;
