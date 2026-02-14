import express from 'express';
import { getDb } from '../database.js';
import { buildRequestAuditContext, logAuditEvent } from '../auditLogger.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const query = String(req.query.q || '').trim();
    const activeOnly = req.query.active === '1';

    let where = '1=1';
    const params = [];

    if (query) {
      where += ' AND (name LIKE ? OR producer LIKE ? OR category LIKE ? OR product_code LIKE ?)';
      const pattern = `%${query}%`;
      params.push(pattern, pattern, pattern, pattern);
    }

    if (activeOnly) {
      where += ' AND is_active = 1';
    }

    const products = await db.all(
      `SELECT *
       FROM products
       WHERE ${where}
       ORDER BY name ASC, id ASC`,
      params
    );

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const product = await db.get('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

router.post('/', async (req, res) => {
  try {
    const db = await getDb();
    const product = req.body || {};
    const name = String(product.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    const result = await db.run(
      `INSERT INTO products (
        name, producer, category, product_code, unit, unit_price, tax_rate, stock_quantity, notes, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        product.producer ? String(product.producer).trim() : null,
        product.category ? String(product.category).trim() : null,
        product.product_code ? String(product.product_code).trim() : null,
        product.unit ? String(product.unit).trim() : 'pcs',
        Number(product.unit_price || 0),
        Number(product.tax_rate || 0),
        Number(product.stock_quantity || 0),
        product.notes ? String(product.notes) : null,
        product.is_active === false ? 0 : 1,
      ]
    );

    await logAuditEvent({
      ...buildRequestAuditContext(req),
      userId: req.user?.id || null,
      username: req.user?.username || null,
      action: 'product.create',
      method: 'POST',
      path: '/api/products',
      statusCode: 201,
      details: { id: result.lastID, name },
    });

    res.status(201).json({ id: result.lastID });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const existing = await db.get('SELECT id FROM products WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = req.body || {};
    const name = String(product.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Product name is required' });
    }

    await db.run(
      `UPDATE products SET
        name = ?,
        producer = ?,
        category = ?,
        product_code = ?,
        unit = ?,
        unit_price = ?,
        tax_rate = ?,
        stock_quantity = ?,
        notes = ?,
        is_active = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        name,
        product.producer ? String(product.producer).trim() : null,
        product.category ? String(product.category).trim() : null,
        product.product_code ? String(product.product_code).trim() : null,
        product.unit ? String(product.unit).trim() : 'pcs',
        Number(product.unit_price || 0),
        Number(product.tax_rate || 0),
        Number(product.stock_quantity || 0),
        product.notes ? String(product.notes) : null,
        product.is_active === false ? 0 : 1,
        req.params.id,
      ]
    );

    await logAuditEvent({
      ...buildRequestAuditContext(req),
      userId: req.user?.id || null,
      username: req.user?.username || null,
      action: 'product.update',
      method: 'PUT',
      path: `/api/products/${req.params.id}`,
      statusCode: 200,
      details: { id: parseInt(req.params.id, 10), name },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const existing = await db.get('SELECT id, name FROM products WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await db.run('DELETE FROM products WHERE id = ?', [req.params.id]);

    await logAuditEvent({
      ...buildRequestAuditContext(req),
      userId: req.user?.id || null,
      username: req.user?.username || null,
      action: 'product.delete',
      method: 'DELETE',
      path: `/api/products/${req.params.id}`,
      statusCode: 200,
      details: { id: existing.id, name: existing.name },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
