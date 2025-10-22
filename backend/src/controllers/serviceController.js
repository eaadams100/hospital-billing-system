import { Service, PriceHistory, AuditLog } from '../models/index.js';

export const getServices = async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;
    const services = await Service.findAll(active_only === 'true');
    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

export const getService = async (req, res) => {
  try {
    const service = await Service.findById(parseInt(req.params.id));
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Failed to fetch service' });
  }
};

export const createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    
    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'CREATE',
      target_table: 'services',
      target_id: service.id,
      changes: req.body,
      ip_address: req.ip
    });
    
    res.status(201).json(service);
  } catch (error) {
    console.error('Create service error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Service code already exists' });
    }
    res.status(500).json({ error: 'Failed to create service' });
  }
};

export const updateService = async (req, res) => {
  try {
    const service = await Service.update(parseInt(req.params.id), req.body);
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'UPDATE',
      target_table: 'services',
      target_id: service.id,
      changes: req.body,
      ip_address: req.ip
    });
    
    res.json(service);
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
};

export const updateServicePrice = async (req, res) => {
  try {
    const { new_price, reason } = req.body;
    
    if (!new_price || !reason) {
      return res.status(400).json({ 
        error: 'New price and reason are required' 
      });
    }
    
    const service = await Service.updatePrice(
      parseInt(req.params.id), 
      parseFloat(new_price), 
      req.user.id, 
      reason
    );
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'UPDATE',
      target_table: 'services',
      target_id: service.id,
      changes: { price_change: { from: service.old_price, to: new_price, reason } },
      ip_address: req.ip
    });
    
    res.json(service);
  } catch (error) {
    console.error('Update service price error:', error);
    res.status(500).json({ error: 'Failed to update service price' });
  }
};

export const getServicePriceHistory = async (req, res) => {
  try {
    const history = await PriceHistory.findByEntity('service', parseInt(req.params.id));
    res.json(history);
  } catch (error) {
    console.error('Get service price history error:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
};