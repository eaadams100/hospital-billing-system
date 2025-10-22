import { PharmacyItem, PriceHistory, AuditLog } from '../models/index.js';

export const getPharmacyItems = async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;
    const items = await PharmacyItem.findAll(active_only === 'true');
    res.json(items);
  } catch (error) {
    console.error('Get pharmacy items error:', error);
    res.status(500).json({ error: 'Failed to fetch pharmacy items' });
  }
};

export const getPharmacyItem = async (req, res) => {
  try {
    const item = await PharmacyItem.findById(parseInt(req.params.id));
    
    if (!item) {
      return res.status(404).json({ error: 'Pharmacy item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Get pharmacy item error:', error);
    res.status(500).json({ error: 'Failed to fetch pharmacy item' });
  }
};

export const getLowStockItems = async (req, res) => {
  try {
    const items = await PharmacyItem.findLowStock();
    res.json(items);
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
};

export const createPharmacyItem = async (req, res) => {
  try {
    const item = await PharmacyItem.create(req.body);
    
    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'CREATE',
      target_table: 'pharmacy_items',
      target_id: item.id,
      changes: req.body,
      ip_address: req.ip
    });
    
    res.status(201).json(item);
  } catch (error) {
    console.error('Create pharmacy item error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    res.status(500).json({ error: 'Failed to create pharmacy item' });
  }
};

export const updatePharmacyItem = async (req, res) => {
  try {
    const item = await PharmacyItem.update(parseInt(req.params.id), req.body);
    
    if (!item) {
      return res.status(404).json({ error: 'Pharmacy item not found' });
    }
    
    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'UPDATE',
      target_table: 'pharmacy_items',
      target_id: item.id,
      changes: req.body,
      ip_address: req.ip
    });
    
    res.json(item);
  } catch (error) {
    console.error('Update pharmacy item error:', error);
    res.status(500).json({ error: 'Failed to update pharmacy item' });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { stock_quantity } = req.body;
    
    if (stock_quantity === undefined || stock_quantity < 0) {
      return res.status(400).json({ 
        error: 'Valid stock quantity is required' 
      });
    }
    
    const item = await PharmacyItem.updateStock(parseInt(req.params.id), stock_quantity);
    
    if (!item) {
      return res.status(404).json({ error: 'Pharmacy item not found' });
    }
    
    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'UPDATE',
      target_table: 'pharmacy_items',
      target_id: item.id,
      changes: { stock_quantity },
      ip_address: req.ip
    });
    
    res.json(item);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Failed to update stock' });
  }
};

export const updatePharmacyPrice = async (req, res) => {
  try {
    const { new_price, reason } = req.body;
    
    if (!new_price || !reason) {
      return res.status(400).json({ 
        error: 'New price and reason are required' 
      });
    }
    
    const item = await PharmacyItem.updatePrice(
      parseInt(req.params.id), 
      parseFloat(new_price), 
      req.user.id, 
      reason
    );
    
    if (!item) {
      return res.status(404).json({ error: 'Pharmacy item not found' });
    }
    
    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'UPDATE',
      target_table: 'pharmacy_items',
      target_id: item.id,
      changes: { price_change: { from: item.old_price, to: new_price, reason } },
      ip_address: req.ip
    });
    
    res.json(item);
  } catch (error) {
    console.error('Update pharmacy price error:', error);
    res.status(500).json({ error: 'Failed to update pharmacy price' });
  }
};

export const getPharmacyPriceHistory = async (req, res) => {
  try {
    const history = await PriceHistory.findByEntity('pharmacy', parseInt(req.params.id));
    res.json(history);
  } catch (error) {
    console.error('Get pharmacy price history error:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
};