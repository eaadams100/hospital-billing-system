import { Invoice, Account, Patient, Service, PharmacyItem, AuditLog } from '../models/index.js';

export const getInvoices = async (req, res) => {
  try {
    const { page = 1, limit = 10, patient_id, status, start_date, end_date } = req.query;
    
    const filters = {};
    if (patient_id) filters.patient_id = parseInt(patient_id);
    if (status) filters.status = status;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    
    const result = await Invoice.findAll(parseInt(page), parseInt(limit), filters);
    res.json(result);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
};

export const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(parseInt(req.params.id));
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};

export const createInvoice = async (req, res) => {
  try {
    const { patient_id, due_date, items, discount = 0 } = req.body;
    
    // Find or create account for patient
    let account = await Account.findByPatientId(patient_id);
    if (!account) {
      account = await Account.create({
        patient_id: patient_id,
        created_by: req.user.id
      });
    }
    
    // Calculate totals and validate items
    let subtotal = 0;
    const validatedItems = [];
    
    for (const item of items) {
      let entity, description, unit_price;
      
      if (item.item_type === 'service') {
        entity = await Service.findById(item.item_id);
        if (!entity) {
          return res.status(400).json({ error: `Service with ID ${item.item_id} not found` });
        }
        description = entity.name;
        unit_price = entity.base_price;
      } else if (item.item_type === 'pharmacy') {
        entity = await PharmacyItem.findById(item.item_id);
        if (!entity) {
          return res.status(400).json({ error: `Pharmacy item with ID ${item.item_id} not found` });
        }
        if (entity.stock_quantity < item.quantity) {
          return res.status(400).json({ 
            error: `Insufficient stock for ${entity.name}. Available: ${entity.stock_quantity}` 
          });
        }
        description = entity.name;
        unit_price = entity.price;
        
        // Update stock
        await PharmacyItem.updateStock(item.item_id, entity.stock_quantity - item.quantity);
      }
      
      const line_total = unit_price * item.quantity;
      subtotal += line_total;
      
      validatedItems.push({
        item_type: item.item_type,
        item_id: item.item_id,
        description,
        quantity: item.quantity,
        unit_price,
        line_total
      });
    }
    
    const total_amount = subtotal - discount;
    
    const invoiceData = {
      account_id: account.id,
      due_date,
      subtotal,
      discount,
      total_amount,
      items: validatedItems
    };
    
    const invoice = await Invoice.create(invoiceData);
    
    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'CREATE',
      target_table: 'invoices',
      target_id: invoice.id,
      changes: invoiceData,
      ip_address: req.ip
    });
    
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
};

export const recordPayment = async (req, res) => {
  try {
    const { amount, method, transaction_ref } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid payment amount is required' });
    }
    
    if (!['cash', 'card', 'insurance'].includes(method)) {
      return res.status(400).json({ error: 'Valid payment method is required' });
    }
    
    const payment = await Invoice.recordPayment({
      invoice_id: parseInt(req.params.id),
      paid_by: req.user.id,
      amount: parseFloat(amount),
      method,
      transaction_ref
    });
    
    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'UPDATE',
      target_table: 'invoices',
      target_id: parseInt(req.params.id),
      changes: { payment: { amount, method, transaction_ref } },
      ip_address: req.ip
    });
    
    res.status(201).json(payment);
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
};

export const getInvoiceByNumber = async (req, res) => {
  try {
    const invoice = await Invoice.findByNumber(req.params.number);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error('Get invoice by number error:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
};