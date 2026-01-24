import express from 'express';
import { getDb } from '../database.js';

const router = express.Router();

function sanitizeCurrency(c) {
    if (c && /^[A-Z]{3}$/.test(c)) return c;
    return 'EUR';
}

// Helper to check if a query param value is actually valid (not "null" or "undefined" strings)
function isValidParam(value) {
    return value !== undefined && value !== null && value !== '' && value !== 'null' && value !== 'undefined';
}

function buildWhereClause(filters = {}, params = []) {
    let where = 'WHERE 1=1';

    if (isValidParam(filters.currency)) {
        where += ' AND (i.currency = ? OR i.secondary_currency = ?)';
        params.push(filters.currency, filters.currency);
    }

    if (isValidParam(filters.startDate)) {
        where += ' AND i.issue_date >= ?';
        params.push(filters.startDate);
    }

    if (isValidParam(filters.endDate)) {
        where += ' AND i.issue_date <= ?';
        params.push(filters.endDate);
    }

    if (isValidParam(filters.clientId)) {
        where += ' AND i.client_id = ?';
        params.push(filters.clientId);
    }

    return { where, params };
}

// Get total revenue converted to a target currency
// Uses stored secondary amounts for conversion when available
router.get('/revenue-by-currency', async (req, res) => {
    try {
        const db = await getDb();
        const targetCurrency = sanitizeCurrency(req.query.currency || 'EUR');

        // Get all invoices with their currency info (excluding cancelled)
        const invoices = await db.all(`
            SELECT 
                i.currency as primary_currency,
                i.secondary_currency,
                i.total as primary_total,
                i.total_secondary as secondary_total,
                i.exchange_rate,
                i.status
            FROM invoices i
            WHERE i.status != 'cancelled'
        `);

        let totalRevenue = 0;

        for (const inv of invoices) {
            if (inv.primary_currency === targetCurrency) {
                // Invoice is already in target currency
                totalRevenue += inv.primary_total || 0;
            } else if (inv.secondary_currency === targetCurrency) {
                // Use the stored secondary amount (already converted)
                totalRevenue += inv.secondary_total || 0;
            } else {
                // Currency doesn't match - skip or convert with fallback
                // For now, we skip invoices that don't have the target currency
                // In a full implementation, you'd fetch live rates here
            }
        }

        res.json({
            currency: targetCurrency,
            totalRevenue: totalRevenue
        });
    } catch (error) {
        console.error('Error fetching revenue by currency:', error);
        res.status(500).json({ error: 'Failed to fetch revenue by currency' });
    }
});



// Get available currencies (both primary and secondary)
router.get('/available-currencies', async (req, res) => {
    try {
        const db = await getDb();
        // Get both primary currencies and secondary currencies
        const primaryResults = await db.all('SELECT DISTINCT currency FROM invoices WHERE currency IS NOT NULL');
        const secondaryResults = await db.all('SELECT DISTINCT secondary_currency FROM invoices WHERE secondary_currency IS NOT NULL');

        const primaryCurrencies = primaryResults.map(r => r.currency).filter(c => c);
        const secondaryCurrencies = secondaryResults.map(r => r.secondary_currency).filter(c => c);

        // Combine and deduplicate
        const allCurrencies = [...new Set([...primaryCurrencies, ...secondaryCurrencies])];

        res.json(allCurrencies);
    } catch (error) {
        console.error('Error fetching available currencies:', error);
        res.status(500).json({ error: 'Failed to fetch available currencies' });
    }
});

// Get monthly revenue
router.get('/monthly-revenue', async (req, res) => {
    try {
        const db = await getDb();
        const filters = req.query;
        const params = [];

        // Default to last 12 months including current if no dates provided
        const today = new Date();
        let startDate = filters.startDate ? new Date(filters.startDate) : new Date(today.getFullYear(), today.getMonth() - 11, 1);
        let endDate = filters.endDate ? new Date(filters.endDate) : today;

        const currency = filters.currency || 'EUR';
        const sanitizedCurrency = sanitizeCurrency(currency);
        const valueExpression = `CASE WHEN i.currency = '${sanitizedCurrency}' THEN i.total ELSE i.total_secondary END`;

        const { where } = buildWhereClause({
            currency: currency,
            startDate: filters.startDate,
            endDate: filters.endDate,
            clientId: filters.clientId
        }, params);

        let finalWhere = where;
        // If no custom date filter, we force the query to match the labels range
        if (!filters.startDate) {
            // Just ensures the query respects the implicit date range we calculated
            // But if filtering by exact dates passed in, buildWhereClause handles it
            const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`;
            finalWhere += " AND i.issue_date >= ?";
            params.push(startStr);
        }

        const results = await db.all(`
      SELECT 
        strftime('%Y-%m', i.issue_date) as month,
        SUM(${valueExpression}) as revenue
      FROM invoices i
      ${finalWhere} AND i.status = 'paid'
      GROUP BY strftime('%Y-%m', i.issue_date)
      ORDER BY month ASC
    `, params);

        // Fill in missing months
        const months = [];
        const current = new Date(startDate);
        current.setDate(1);

        while (current <= endDate) {
            const year = current.getFullYear();
            const month = String(current.getMonth() + 1).padStart(2, '0');
            months.push(`${year}-${month}`);
            current.setMonth(current.getMonth() + 1);
        }

        const data = months.map(month => {
            const match = results.find(r => r.month === month);
            return {
                month,
                revenue: match ? match.revenue : 0
            };
        });

        res.json(data);
    } catch (error) {
        console.error('Error fetching monthly revenue:', error);
        res.status(500).json({ error: 'Failed to fetch monthly revenue' });
    }
});

// Get status distribution
router.get('/status-distribution', async (req, res) => {
    try {
        const db = await getDb();
        const filters = req.query;
        const params = [];
        const currency = filters.currency || 'EUR';
        const sanitizedCurrency = sanitizeCurrency(currency);
        const valueExpression = `CASE WHEN i.currency = '${sanitizedCurrency}' THEN i.total ELSE i.total_secondary END`;

        const { where } = buildWhereClause({
            currency: currency,
            startDate: filters.startDate,
            endDate: filters.endDate,
            clientId: filters.clientId
        }, params);

        const results = await db.all(`
      SELECT 
        i.status,
        COUNT(*) as count,
        SUM(${valueExpression}) as value
      FROM invoices i
      ${where}
      GROUP BY i.status
    `, params);

        res.json(results);
    } catch (error) {
        console.error('Error fetching status distribution:', error);
        res.status(500).json({ error: 'Failed to fetch status distribution' });
    }
});

// Get top clients
router.get('/top-clients', async (req, res) => {
    try {
        const db = await getDb();
        const filters = req.query;
        const limit = parseInt(req.query.limit) || 5;
        const params = [];
        const currency = filters.currency || 'EUR';
        const sanitizedCurrency = sanitizeCurrency(currency);
        const valueExpression = `CASE WHEN i.currency = '${sanitizedCurrency}' THEN i.total ELSE i.total_secondary END`;

        const { where } = buildWhereClause({
            currency: currency,
            startDate: filters.startDate,
            endDate: filters.endDate,
            clientId: filters.clientId
        }, params);

        const results = await db.all(`
      SELECT 
        c.name,
        COUNT(i.id) as invoice_count,
        SUM(${valueExpression}) as total_revenue
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      ${where}
      GROUP BY i.client_id, c.name
      ORDER BY total_revenue DESC
      LIMIT ?
    `, [...params, limit]);

        res.json(results);
    } catch (error) {
        console.error('Error fetching top clients:', error);
        res.status(500).json({ error: 'Failed to fetch top clients' });
    }
});

// Get overview
router.get('/overview', async (req, res) => {
    try {
        const db = await getDb();
        const filters = req.query;
        const baseParams = [];
        const currency = filters.currency || 'EUR';
        const sanitizedCurrency = sanitizeCurrency(currency);
        const valueExpression = `CASE WHEN i.currency = '${sanitizedCurrency}' THEN i.total ELSE i.total_secondary END`;

        const { where } = buildWhereClause({
            currency: currency,
            startDate: filters.startDate,
            endDate: filters.endDate,
            clientId: filters.clientId
        }, baseParams);

        const totalRevenue = await db.get(`
          SELECT SUM(${valueExpression}) as val FROM invoices i ${where} AND i.status = 'paid'
      `, baseParams);

        const outstanding = await db.get(`
          SELECT SUM(${valueExpression}) as val, COUNT(*) as count FROM invoices i ${where} AND i.status IN ('sent', 'overdue')
      `, baseParams);

        const overdue = await db.get(`
          SELECT SUM(${valueExpression}) as val, COUNT(*) as count FROM invoices i ${where} AND i.status = 'overdue'
      `, baseParams);

        res.json({
            totalRevenue: totalRevenue?.val || 0,
            outstanding: outstanding?.val || 0,
            pendingCount: outstanding?.count || 0,
            overdue: overdue?.val || 0,
            overdueCount: overdue?.count || 0
        });
    } catch (error) {
        console.error('Error fetching overview:', error);
        res.status(500).json({ error: 'Failed to fetch overview' });
    }
});


export default router;
