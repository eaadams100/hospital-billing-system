import { query } from '../config/database.js';

export const generateRevenueReport = async (req, res) => {
  try {
    const { period = 'month', start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];

    if (start_date && end_date) {
      dateFilter = 'WHERE i.issued_at BETWEEN $1 AND $2';
      params.push(start_date, end_date);
    } else {
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      dateFilter = 'WHERE i.issued_at BETWEEN $1 AND $2';
      params.push(firstDay, lastDay);
    }

    const revenueResult = await query(
      `SELECT 
         DATE(i.issued_at) as date,
         COUNT(*) as invoice_count,
         SUM(i.total_amount) as total_revenue,
         SUM(i.paid_amount) as total_paid,
         SUM(i.total_amount - i.paid_amount) as outstanding
       FROM invoices i
       ${dateFilter}
       GROUP BY DATE(i.issued_at)
       ORDER BY date DESC`,
      params
    );

    const categoryResult = await query(
      `SELECT 
         s.category,
         COUNT(ii.id) as service_count,
         SUM(ii.line_total) as total_revenue
       FROM invoice_items ii
       JOIN invoices i ON ii.invoice_id = i.id
       JOIN services s ON ii.item_id = s.id AND ii.item_type = 'service'
       ${dateFilter}
       GROUP BY s.category
       ORDER BY total_revenue DESC`,
      params
    );

    const paymentMethodResult = await query(
      `SELECT 
         p.method,
         COUNT(*) as payment_count,
         SUM(p.amount) as total_amount
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       ${dateFilter.replace('i.issued_at', 'p.created_at')}
       GROUP BY p.method
       ORDER BY total_amount DESC`,
      params
    );

    res.json({
      period: {
        start: params[0],
        end: params[1]
      },
      summary: {
        total_invoices: revenueResult.rows.reduce((sum, row) => sum + parseInt(row.invoice_count), 0),
        total_revenue: revenueResult.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0),
        total_paid: revenueResult.rows.reduce((sum, row) => sum + parseFloat(row.total_paid), 0),
        total_outstanding: revenueResult.rows.reduce((sum, row) => sum + parseFloat(row.outstanding), 0)
      },
      daily_revenue: revenueResult.rows,
      revenue_by_category: categoryResult.rows,
      payments_by_method: paymentMethodResult.rows
    });

  } catch (error) {
    console.error('Generate revenue report error:', error);
    res.status(500).json({ error: 'Failed to generate revenue report' });
  }
};

export const generateStockReport = async (req, res) => {
  try {
    const { low_stock_only = 'false' } = req.query;

    let whereClause = '';
    if (low_stock_only === 'true') {
      whereClause = 'WHERE stock_quantity <= reorder_level AND active = true';
    }

    const stockResult = await query(
      `SELECT 
         sku,
         name,
         unit,
         price,
         cost_price,
         stock_quantity,
         reorder_level,
         (stock_quantity <= reorder_level) as needs_reorder,
         (price - cost_price) as profit_margin,
         ((price - cost_price) / cost_price * 100) as profit_margin_percent
       FROM pharmacy_items
       ${whereClause}
       ORDER BY needs_reorder DESC, stock_quantity ASC`,
      []
    );

    const lowStockCount = await query(
      'SELECT COUNT(*) as count FROM pharmacy_items WHERE stock_quantity <= reorder_level AND active = true',
      []
    );

    const totalValueResult = await query(
      'SELECT SUM(stock_quantity * cost_price) as total_value FROM pharmacy_items WHERE active = true',
      []
    );

    res.json({
      summary: {
        total_items: stockResult.rows.length,
        low_stock_items: parseInt(lowStockCount.rows[0].count),
        total_inventory_value: parseFloat(totalValueResult.rows[0].total_value || 0)
      },
      items: stockResult.rows
    });

  } catch (error) {
    console.error('Generate stock report error:', error);
    res.status(500).json({ error: 'Failed to generate stock report' });
  }
};

export const generateUtilizationReport = async (req, res) => {
  try {
    const { period = 'month', start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];

    if (start_date && end_date) {
      dateFilter = 'WHERE i.issued_at BETWEEN $1 AND $2';
      params.push(start_date, end_date);
    } else {
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      dateFilter = 'WHERE i.issued_at BETWEEN $1 AND $2';
      params.push(firstDay, lastDay);
    }

    const serviceUtilization = await query(
      `SELECT 
         s.code,
         s.name,
         s.category,
         COUNT(ii.id) as usage_count,
         SUM(ii.quantity) as total_quantity,
         SUM(ii.line_total) as total_revenue,
         AVG(ii.unit_price) as average_price
       FROM invoice_items ii
       JOIN invoices i ON ii.invoice_id = i.id
       JOIN services s ON ii.item_id = s.id AND ii.item_type = 'service'
       ${dateFilter}
       GROUP BY s.id, s.code, s.name, s.category
       ORDER BY total_revenue DESC`,
      params
    );

    const pharmacyUtilization = await query(
      `SELECT 
         p.sku,
         p.name,
         p.unit,
         COUNT(ii.id) as usage_count,
         SUM(ii.quantity) as total_quantity,
         SUM(ii.line_total) as total_revenue,
         AVG(ii.unit_price) as average_price
       FROM invoice_items ii
       JOIN invoices i ON ii.invoice_id = i.id
       JOIN pharmacy_items p ON ii.item_id = p.id AND ii.item_type = 'pharmacy'
       ${dateFilter}
       GROUP BY p.id, p.sku, p.name, p.unit
       ORDER BY total_revenue DESC`,
      params
    );

    const dailyUtilization = await query(
      `SELECT 
         DATE(i.issued_at) as date,
         COUNT(DISTINCT i.id) as invoice_count,
         COUNT(ii.id) as item_count,
         SUM(ii.line_total) as daily_revenue
       FROM invoices i
       JOIN invoice_items ii ON i.id = ii.invoice_id
       ${dateFilter}
       GROUP BY DATE(i.issued_at)
       ORDER BY date DESC`,
      params
    );

    res.json({
      period: {
        start: params[0],
        end: params[1]
      },
      service_utilization: serviceUtilization.rows,
      pharmacy_utilization: pharmacyUtilization.rows,
      daily_activity: dailyUtilization.rows,
      summary: {
        total_services: serviceUtilization.rows.reduce((sum, row) => sum + parseInt(row.usage_count), 0),
        total_pharmacy: pharmacyUtilization.rows.reduce((sum, row) => sum + parseInt(row.usage_count), 0),
        total_revenue: serviceUtilization.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0) +
                      pharmacyUtilization.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue), 0)
      }
    });

  } catch (error) {
    console.error('Generate utilization report error:', error);
    res.status(500).json({ error: 'Failed to generate utilization report' });
  }
};