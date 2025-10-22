export const validatePatient = (req, res, next) => {
  const { first_name, last_name, dob, gender } = req.body;
  
  if (!first_name || !last_name || !dob || !gender) {
    return res.status(400).json({ 
      error: 'First name, last name, date of birth, and gender are required' 
    });
  }
  
  next();
};

export const validateService = (req, res, next) => {
  const { code, name, category, base_price } = req.body;
  
  if (!code || !name || !category || base_price === undefined) {
    return res.status(400).json({ 
      error: 'Code, name, category, and base price are required' 
    });
  }
  
  if (!['lab', 'consultation', 'procedure'].includes(category)) {
    return res.status(400).json({ 
      error: 'Category must be one of: lab, consultation, procedure' 
    });
  }
  
  if (base_price < 0) {
    return res.status(400).json({ 
      error: 'Base price must be non-negative' 
    });
  }
  
  next();
};

export const validatePharmacyItem = (req, res, next) => {
  const { sku, name, unit, price } = req.body;
  
  if (!sku || !name || !unit || price === undefined) {
    return res.status(400).json({ 
      error: 'SKU, name, unit, and price are required' 
    });
  }
  
  if (price < 0) {
    return res.status(400).json({ 
      error: 'Price must be non-negative' 
    });
  }
  
  next();
};

export const validateInvoice = (req, res, next) => {
  const { account_id, due_date, items } = req.body;
  
  if (!account_id || !due_date || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ 
      error: 'Account ID, due date, and at least one item are required' 
    });
  }
  
  // Validate items
  for (const item of items) {
    if (!item.item_type || !item.item_id || !item.quantity || !item.unit_price) {
      return res.status(400).json({ 
        error: 'Each item must have item_type, item_id, quantity, and unit_price' 
      });
    }
    
    if (!['service', 'pharmacy'].includes(item.item_type)) {
      return res.status(400).json({ 
        error: 'Item type must be either "service" or "pharmacy"' 
      });
    }
    
    if (item.quantity <= 0) {
      return res.status(400).json({ 
        error: 'Quantity must be positive' 
      });
    }
  }
  
  next();
};