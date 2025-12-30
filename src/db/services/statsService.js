// Statistics Service
import { db } from '../database.js';

export const statsService = {
  // Helper to build where clause
  _buildWhereClause(filters = {}, params = []) {
    let where = 'WHERE 1=1';

    if (filters.currency) {
      where += ' AND i.currency = ?';
      params.push(filters.currency);
    }

    if (filters.startDate) {
      where += ' AND i.issue_date >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      where += ' AND i.issue_date <= ?';
      params.push(filters.endDate);
    }

    if (filters.clientId) {
      where += ' AND i.client_id = ?';
      params.push(filters.clientId);
    }

    return { where, params };
  },

  // Get monthly revenue with filters (Shows only PAID by default for revenue charts)
  getMonthlyRevenue(filters = {}) {
    const params = [];
    const { where } = this._buildWhereClause({
      currency: filters.currency || 'EUR',
      startDate: filters.startDate,
      endDate: filters.endDate,
      clientId: filters.clientId
    }, params);

    const today = new Date();
    // Default to last 12 months including current
    let startDate = filters.startDate ? new Date(filters.startDate) : new Date(today.getFullYear(), today.getMonth() - 11, 1);
    let endDate = filters.endDate ? new Date(filters.endDate) : today;

    const months = [];
    const current = new Date(startDate);
    current.setDate(1);

    // Use local date strings to avoid UTC-offset month shifts
    while (current <= endDate) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
      current.setMonth(current.getMonth() + 1);
    }

    let finalWhere = where;
    // If no custom date filter, we force the query to match the labels range
    if (!filters.startDate) {
      const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`;
      finalWhere += " AND i.issue_date >= ?";
      params.push(startStr);
    }

    const results = db.query(`
      SELECT 
        strftime('%Y-%m', i.issue_date) as month,
        SUM(i.total) as revenue
      FROM invoices i
      ${finalWhere} AND i.status = 'paid'
      GROUP BY strftime('%Y-%m', i.issue_date)
      ORDER BY month ASC
    `, params);

    return months.map(month => {
      const match = results.find(r => r.month === month);
      return {
        month,
        revenue: match ? match.revenue : 0
      };
    });
  },

  // Get status distribution with filters
  getStatusDistribution(filters = {}) {
    const params = [];
    const { where } = this._buildWhereClause({
      currency: filters.currency || 'EUR',
      startDate: filters.startDate,
      endDate: filters.endDate,
      clientId: filters.clientId
    }, params);

    return db.query(`
      SELECT 
        i.status,
        COUNT(*) as count,
        SUM(i.total) as value
      FROM invoices i
      ${where}
      GROUP BY i.status
    `, params);
  },

  // Get top clients (filtered)
  getTopClients(limit = 5, filters = {}) {
    const params = [];
    const { where } = this._buildWhereClause({
      currency: filters.currency || 'EUR',
      startDate: filters.startDate,
      endDate: filters.endDate,
      clientId: filters.clientId
    }, params);

    return db.query(`
      SELECT 
        c.name,
        COUNT(i.id) as invoice_count,
        SUM(i.total) as total_revenue
      FROM invoices i
      JOIN clients c ON i.client_id = c.id
      ${where}
      GROUP BY i.client_id, c.name
      ORDER BY total_revenue DESC
      LIMIT ?
    `, [...params, limit]);
  },

  // Get overview stats
  getOverview(filters = {}) {
    const baseParams = [];
    const { where } = this._buildWhereClause({
      currency: filters.currency || 'EUR',
      startDate: filters.startDate,
      endDate: filters.endDate,
      clientId: filters.clientId
    }, baseParams);

    const totalRevenue = db.queryOne(`
          SELECT SUM(i.total) as val FROM invoices i ${where} AND i.status = 'paid'
      `, baseParams)?.val || 0;

    const outstanding = db.queryOne(`
          SELECT SUM(i.total) as val FROM invoices i ${where} AND i.status IN ('sent', 'overdue')
      `, baseParams)?.val || 0;

    const overdue = db.queryOne(`
          SELECT SUM(i.total) as val FROM invoices i ${where} AND i.status = 'overdue'
      `, baseParams)?.val || 0;

    return {
      totalRevenue,
      outstanding,
      overdue
    };
  },

  // Get raw data for export
  getForExport(filters = {}) {
    const params = [];
    const { where } = this._buildWhereClause({ ...filters }, params);

    return db.query(`
        SELECT 
            i.invoice_number,
            i.issue_date,
            i.due_date,
            c.name as client_name,
            c.cif as client_cif,
            i.status,
            i.total,
            i.currency,
            i.tax_amount
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        ${where}
        ORDER BY i.issue_date DESC
    `, params);
  }
};

export default statsService;
