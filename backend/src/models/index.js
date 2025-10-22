import { query } from '../config/database.js';

export const User = {
  async findById(id) {
    const result = await query(
      'SELECT id, email, full_name, role, created_at, last_login FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  },

  async create(userData) {
    const { email, password_hash, full_name, role } = userData;
    const result = await query(
      'INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role, created_at',
      [email, password_hash, full_name, role]
    );
    return result.rows[0];
  }
};

export const Patient = {
  async findAll(page = 1, limit = 10, search = '') {
    const offset = (page - 1) * limit;
    let whereClause = '';
    let params = [limit, offset];
    
    if (search) {
      whereClause = `WHERE first_name ILIKE $3 OR last_name ILIKE $3 OR phone ILIKE $3`;
      params.push(`%${search}%`);
    }

    const result = await query(
      `SELECT * FROM patients ${whereClause} ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM patients ${whereClause}`,
      search ? [`%${search}%`] : []
    );

    return {
      patients: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  },

  async findById(id) {
    const result = await query(
      'SELECT * FROM patients WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async create(patientData) {
    const { first_name, last_name, dob, gender, phone, email, address, insurance_provider } = patientData;
    const result = await query(
      `INSERT INTO patients 
       (first_name, last_name, dob, gender, phone, email, address, insurance_provider) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [first_name, last_name, dob, gender, phone, email, address, insurance_provider]
    );
    return result.rows[0];
  },

  async update(id, patientData) {
    const { first_name, last_name, dob, gender, phone, email, address, insurance_provider } = patientData;
    const result = await query(
      `UPDATE patients SET 
       first_name = $1, last_name = $2, dob = $3, gender = $4, phone = $5, 
       email = $6, address = $7, insurance_provider = $8, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $9 RETURNING *`,
      [first_name, last_name, dob, gender, phone, email, address, insurance_provider, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await query('DELETE FROM patients WHERE id = $1', [id]);
    return true;
  }
};

export const Service = {
  async findAll(activeOnly = true) {
    const whereClause = activeOnly ? 'WHERE active = true' : '';
    const result = await query(
      `SELECT * FROM services ${whereClause} ORDER BY category, name`
    );
    return result.rows;
  },

  async findById(id) {
    const result = await query(
      'SELECT * FROM services WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async findByCode(code) {
    const result = await query(
      'SELECT * FROM services WHERE code = $1',
      [code]
    );
    return result.rows[0];
  },

  async create(serviceData) {
    const { code, name, description, category, base_price, cost_price, duration_minutes } = serviceData;
    const result = await query(
      `INSERT INTO services 
       (code, name, description, category, base_price, cost_price, duration_minutes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [code, name, description, category, base_price, cost_price, duration_minutes]
    );
    return result.rows[0];
  },

  async update(id, serviceData) {
    const { code, name, description, category, base_price, cost_price, duration_minutes, active } = serviceData;
    const result = await query(
      `UPDATE services SET 
       code = $1, name = $2, description = $3, category = $4, base_price = $5, 
       cost_price = $6, duration_minutes = $7, active = $8, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $9 RETURNING *`,
      [code, name, description, category, base_price, cost_price, duration_minutes, active, id]
    );
    return result.rows[0];
  },

  async updatePrice(id, newPrice, changedBy, reason) {
    // Get current price
    const current = await this.findById(id);
    
    // Update service price
    const result = await query(
      'UPDATE services SET base_price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newPrice, id]
    );

    // Log price history
    await query(
      `INSERT INTO price_history 
       (entity_type, entity_id, old_price, new_price, changed_by, reason) 
       VALUES ('service', $1, $2, $3, $4, $5)`,
      [id, current.base_price, newPrice, changedBy, reason]
    );

    return result.rows[0];
  }
};

export const PharmacyItem = {
  async findAll(activeOnly = true) {
    const whereClause = activeOnly ? 'WHERE active = true' : '';
    const result = await query(
      `SELECT * FROM pharmacy_items ${whereClause} ORDER BY name`
    );
    return result.rows;
  },

  async findById(id) {
    const result = await query(
      'SELECT * FROM pharmacy_items WHERE id = $1',
      [id]
    );
    return result.rows[0];
  },

  async findBySku(sku) {
    const result = await query(
      'SELECT * FROM pharmacy_items WHERE sku = $1',
      [sku]
    );
    return result.rows[0];
  },

  async findLowStock() {
    const result = await query(
      'SELECT * FROM pharmacy_items WHERE stock_quantity <= reorder_level AND active = true ORDER BY stock_quantity ASC'
    );
    return result.rows;
  },

  async create(itemData) {
    const { sku, name, unit, description, price, cost_price, stock_quantity, reorder_level, supplier_id } = itemData;
    const result = await query(
      `INSERT INTO pharmacy_items 
       (sku, name, unit, description, price, cost_price, stock_quantity, reorder_level, supplier_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [sku, name, unit, description, price, cost_price, stock_quantity, reorder_level, supplier_id]
    );
    return result.rows[0];
  },

  async update(id, itemData) {
    const { sku, name, unit, description, price, cost_price, stock_quantity, reorder_level, supplier_id, active } = itemData;
    const result = await query(
      `UPDATE pharmacy_items SET 
       sku = $1, name = $2, unit = $3, description = $4, price = $5, cost_price = $6,
       stock_quantity = $7, reorder_level = $8, supplier_id = $9, active = $10, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $11 RETURNING *`,
      [sku, name, unit, description, price, cost_price, stock_quantity, reorder_level, supplier_id, active, id]
    );
    return result.rows[0];
  },

  async updateStock(id, newQuantity) {
    const result = await query(
      'UPDATE pharmacy_items SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newQuantity, id]
    );
    return result.rows[0];
  },

  async updatePrice(id, newPrice, changedBy, reason) {
    // Get current price
    const current = await this.findById(id);
    
    // Update item price
    const result = await query(
      'UPDATE pharmacy_items SET price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newPrice, id]
    );

    // Log price history
    await query(
      `INSERT INTO price_history 
       (entity_type, entity_id, old_price, new_price, changed_by, reason) 
       VALUES ('pharmacy', $1, $2, $3, $4, $5)`,
      [id, current.price, newPrice, changedBy, reason]
    );

    return result.rows[0];
  }
};

export const Account = {
  async create(accountData) {
    const { patient_id, created_by } = accountData;
    const result = await query(
      `INSERT INTO accounts (patient_id, created_by) 
       VALUES ($1, $2) RETURNING *`,
      [patient_id, created_by]
    );
    return result.rows[0];
  },

  async findById(id) {
    const result = await query(
      `SELECT a.*, p.first_name, p.last_name, p.phone 
       FROM accounts a 
       JOIN patients p ON a.patient_id = p.id 
       WHERE a.id = $1`,
      [id]
    );
    return result.rows[0];
  },

  async findByPatientId(patientId) {
    const result = await query(
      `SELECT * FROM accounts WHERE patient_id = $1 AND status = 'open' ORDER BY created_at DESC`,
      [patientId]
    );
    return result.rows[0];
  }
};

export const Invoice = {
  async generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `HOSP-${year}${month}-`;
    
    const result = await query(
      'SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE $1',
      [`${prefix}%`]
    );
    
    const count = parseInt(result.rows[0].count) + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  },

  async create(invoiceData) {
    const { account_id, due_date, subtotal, discount, total_amount, items } = invoiceData;
    
    const invoiceNumber = await this.generateInvoiceNumber();
    
    const client = await query('BEGIN');
    
    try {
      // Create invoice
      const invoiceResult = await query(
        `INSERT INTO invoices 
         (account_id, invoice_number, due_date, subtotal, discount, total_amount) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [account_id, invoiceNumber, due_date, subtotal, discount, total_amount]
      );
      
      const invoice = invoiceResult.rows[0];
      
      // Create invoice items
      for (const item of items) {
        await query(
          `INSERT INTO invoice_items 
           (invoice_id, item_type, item_id, description, quantity, unit_price, line_total) 
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [invoice.id, item.item_type, item.item_id, item.description, item.quantity, item.unit_price, item.line_total]
        );
      }
      
      // Update account totals
      await query(
        'UPDATE accounts SET total_amount = total_amount + $1, balance = balance + $1 WHERE id = $2',
        [total_amount, account_id]
      );
      
      await query('COMMIT');
      return invoice;
      
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  },

  async findById(id) {
    const invoiceResult = await query(
      `SELECT i.*, a.patient_id, p.first_name, p.last_name, p.phone, p.email 
       FROM invoices i 
       JOIN accounts a ON i.account_id = a.id 
       JOIN patients p ON a.patient_id = p.id 
       WHERE i.id = $1`,
      [id]
    );
    
    if (invoiceResult.rows.length === 0) return null;
    
    const invoice = invoiceResult.rows[0];
    
    // Get invoice items
    const itemsResult = await query(
      `SELECT * FROM invoice_items WHERE invoice_id = $1`,
      [id]
    );
    
    invoice.items = itemsResult.rows;
    
    // Get payments
    const paymentsResult = await query(
      `SELECT p.*, u.full_name as collected_by 
       FROM payments p 
       JOIN users u ON p.paid_by = u.id 
       WHERE p.invoice_id = $1 
       ORDER BY p.created_at`,
      [id]
    );
    
    invoice.payments = paymentsResult.rows;
    
    return invoice;
  },

  async findByNumber(invoiceNumber) {
    const result = await query(
      `SELECT i.*, a.patient_id, p.first_name, p.last_name 
       FROM invoices i 
       JOIN accounts a ON i.account_id = a.id 
       JOIN patients p ON a.patient_id = p.id 
       WHERE i.invoice_number = $1`,
      [invoiceNumber]
    );
    return result.rows[0];
  },

  async findAll(page = 1, limit = 10, filters = {}) {
    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [limit, offset];
    let paramCount = 2;

    if (filters.patient_id) {
      paramCount++;
      whereConditions.push(`a.patient_id = $${paramCount}`);
      params.push(filters.patient_id);
    }

    if (filters.status) {
      paramCount++;
      whereConditions.push(`i.payment_status = $${paramCount}`);
      params.push(filters.status);
    }

    if (filters.start_date) {
      paramCount++;
      whereConditions.push(`i.issued_at >= $${paramCount}`);
      params.push(filters.start_date);
    }

    if (filters.end_date) {
      paramCount++;
      whereConditions.push(`i.issued_at <= $${paramCount}`);
      params.push(filters.end_date);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT i.*, p.first_name, p.last_name, p.phone 
       FROM invoices i 
       JOIN accounts a ON i.account_id = a.id 
       JOIN patients p ON a.patient_id = p.id 
       ${whereClause} 
       ORDER BY i.issued_at DESC 
       LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) 
       FROM invoices i 
       JOIN accounts a ON i.account_id = a.id 
       ${whereClause}`,
      params.slice(2)
    );

    return {
      invoices: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    };
  },

  async recordPayment(paymentData) {
    const { invoice_id, paid_by, amount, method, transaction_ref } = paymentData;
    
    const client = await query('BEGIN');
    
    try {
      // Record payment
      const paymentResult = await query(
        `INSERT INTO payments 
         (invoice_id, paid_by, amount, method, transaction_ref) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [invoice_id, paid_by, amount, method, transaction_ref]
      );
      
      // Update invoice paid amount and status
      const invoice = await this.findById(invoice_id);
      const newPaidAmount = (invoice.paid_amount || 0) + amount;
      let paymentStatus = 'partial';
      
      if (newPaidAmount >= invoice.total_amount) {
        paymentStatus = 'paid';
      } else if (newPaidAmount > 0) {
        paymentStatus = 'partial';
      }
      
      await query(
        'UPDATE invoices SET paid_amount = $1, payment_status = $2 WHERE id = $3',
        [newPaidAmount, payment_status, invoice_id]
      );
      
      // Update account balance
      await query(
        'UPDATE accounts SET balance = balance - $1 WHERE id = $2',
        [amount, invoice.account_id]
      );
      
      await query('COMMIT');
      return paymentResult.rows[0];
      
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }
};

export const PriceHistory = {
  async findByEntity(entityType, entityId) {
    const result = await query(
      `SELECT ph.*, u.full_name as changed_by_name 
       FROM price_history ph 
       JOIN users u ON ph.changed_by = u.id 
       WHERE ph.entity_type = $1 AND ph.entity_id = $2 
       ORDER BY ph.changed_at DESC`,
      [entityType, entityId]
    );
    return result.rows;
  }
};

export const AuditLog = {
  async create(logData) {
    const { user_id, action, target_table, target_id, changes, ip_address } = logData;
    await query(
      `INSERT INTO audit_logs 
       (user_id, action, target_table, target_id, changes, ip_address) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user_id, action, target_table, target_id, changes, ip_address]
    );
  }
};