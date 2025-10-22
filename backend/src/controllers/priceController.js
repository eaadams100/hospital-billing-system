import { Service, PharmacyItem, AuditLog } from '../models/index.js';
import { query } from '../config/database.js';
import Papa from 'papaparse';

export const getScheduledChanges = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    
    const offset = (page - 1) * limit;
    
    const result = await query(
      `SELECT spc.*, u.full_name as created_by_name 
       FROM scheduled_price_changes spc 
       JOIN users u ON spc.created_by = u.id 
       WHERE spc.status = $1 
       ORDER BY spc.scheduled_for ASC 
       LIMIT $2 OFFSET $3`,
      [status, limit, offset]
    );

    const countResult = await query(
      'SELECT COUNT(*) FROM scheduled_price_changes WHERE status = $1',
      [status]
    );

    // Enhance with entity names
    const enhancedChanges = await Promise.all(
      result.rows.map(async (change) => {
        let entityName = '';
        if (change.entity_type === 'service') {
          const service = await Service.findById(change.entity_id);
          entityName = service ? service.name : 'Unknown Service';
        } else {
          const item = await PharmacyItem.findById(change.entity_id);
          entityName = item ? item.name : 'Unknown Item';
        }
        
        return {
          ...change,
          entity_name: entityName
        };
      })
    );

    res.json({
      changes: enhancedChanges,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Get scheduled changes error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled changes' });
  }
};

export const createScheduledChange = async (req, res) => {
  try {
    const { entity_type, entity_id, new_price, scheduled_for, reason } = req.body;

    if (!entity_type || !entity_id || !new_price || !scheduled_for || !reason) {
      return res.status(400).json({ 
        error: 'Entity type, entity ID, new price, scheduled date, and reason are required' 
      });
    }

    if (!['service', 'pharmacy'].includes(entity_type)) {
      return res.status(400).json({ error: 'Entity type must be service or pharmacy' });
    }

    // Verify entity exists
    let entity;
    if (entity_type === 'service') {
      entity = await Service.findById(entity_id);
    } else {
      entity = await PharmacyItem.findById(entity_id);
    }

    if (!entity) {
      return res.status(404).json({ error: `${entity_type} not found` });
    }

    const scheduledDate = new Date(scheduled_for);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled date must be in the future' });
    }

    const result = await query(
      `INSERT INTO scheduled_price_changes 
       (entity_type, entity_id, new_price, scheduled_for, created_by, reason) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [entity_type, entity_id, new_price, scheduled_for, req.user.id, reason]
    );

    const change = result.rows[0];

    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'CREATE',
      target_table: 'scheduled_price_changes',
      target_id: change.id,
      changes: { entity_type, entity_id, new_price, scheduled_for, reason },
      ip_address: req.ip
    });

    res.status(201).json(change);
  } catch (error) {
    console.error('Create scheduled change error:', error);
    res.status(500).json({ error: 'Failed to schedule price change' });
  }
};

export const cancelScheduledChange = async (req, res) => {
  try {
    const changeId = parseInt(req.params.id);

    const result = await query(
      'UPDATE scheduled_price_changes SET status = $1 WHERE id = $2 AND status = $3 RETURNING *',
      ['cancelled', changeId, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scheduled change not found or already applied/cancelled' });
    }

    const change = result.rows[0];

    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'UPDATE',
      target_table: 'scheduled_price_changes',
      target_id: change.id,
      changes: { status: 'cancelled' },
      ip_address: req.ip
    });

    res.json({ message: 'Scheduled price change cancelled successfully', change });
  } catch (error) {
    console.error('Cancel scheduled change error:', error);
    res.status(500).json({ error: 'Failed to cancel scheduled change' });
  }
};

export const processBulkPriceUpdate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    const csvData = req.file.buffer.toString();
    const results = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      trimHeaders: true
    });

    if (results.errors.length > 0) {
      return res.status(400).json({ 
        error: 'Invalid CSV format', 
        details: results.errors 
      });
    }

    const records = results.data;
    const preview = [];
    const errors = [];

    // Validate each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2;

      try {
        // Validate required fields
        if (!record.entity_type || !record.identifier || !record.new_price) {
          errors.push(`Row ${rowNumber}: entity_type, identifier, and new_price are required`);
          continue;
        }

        if (!['service', 'pharmacy'].includes(record.entity_type)) {
          errors.push(`Row ${rowNumber}: entity_type must be 'service' or 'pharmacy'`);
          continue;
        }

        const newPrice = parseFloat(record.new_price);
        if (isNaN(newPrice) || newPrice < 0) {
          errors.push(`Row ${rowNumber}: new_price must be a valid non-negative number`);
          continue;
        }

        // Find entity
        let entity, currentPrice, entityName;
        if (record.entity_type === 'service') {
          entity = await Service.findByCode(record.identifier);
          if (entity) {
            currentPrice = entity.base_price;
            entityName = entity.name;
          }
        } else {
          entity = await PharmacyItem.findBySku(record.identifier);
          if (entity) {
            currentPrice = entity.price;
            entityName = entity.name;
          }
        }

        if (!entity) {
          errors.push(`Row ${rowNumber}: ${record.entity_type} with identifier '${record.identifier}' not found`);
          continue;
        }

        // Validate effective date if provided
        let effectiveDate = null;
        if (record.effective_date) {
          effectiveDate = new Date(record.effective_date);
          if (isNaN(effectiveDate.getTime())) {
            errors.push(`Row ${rowNumber}: effective_date must be in DD/MM/YYYY format`);
            continue;
          }
        }

        preview.push({
          row: rowNumber,
          entity_type: record.entity_type,
          identifier: record.identifier,
          entity_name: entityName,
          current_price: currentPrice,
          new_price: newPrice,
          effective_date: effectiveDate,
          reason: record.reason || 'Bulk update'
        });

      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    }

    if (errors.length > 0 && preview.length === 0) {
      return res.status(400).json({ 
        error: 'All records have validation errors', 
        details: errors 
      });
    }

    res.json({
      preview,
      errors,
      totalRecords: records.length,
      validRecords: preview.length,
      invalidRecords: errors.length
    });

  } catch (error) {
    console.error('Process bulk price update error:', error);
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
};

export const confirmBulkPriceUpdate = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required' });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        const { entity_type, identifier, new_price, effective_date, reason } = update;

        // Find entity
        let entity;
        if (entity_type === 'service') {
          entity = await Service.findByCode(identifier);
        } else {
          entity = await PharmacyItem.findBySku(identifier);
        }

        if (!entity) {
          errors.push(`Entity not found: ${identifier}`);
          continue;
        }

        // Apply immediately or schedule for later
        if (!effective_date || new Date(effective_date) <= new Date()) {
          // Apply immediately
          if (entity_type === 'service') {
            await Service.updatePrice(entity.id, new_price, req.user.id, reason);
          } else {
            await PharmacyItem.updatePrice(entity.id, new_price, req.user.id, reason);
          }
        } else {
          // Schedule for later
          await query(
            `INSERT INTO scheduled_price_changes 
             (entity_type, entity_id, new_price, scheduled_for, created_by, reason) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [entity_type, entity.id, new_price, effective_date, req.user.id, reason]
          );
        }

        results.push({
          identifier,
          entity_type,
          status: effective_date ? 'scheduled' : 'applied',
          effective_date
        });

      } catch (error) {
        errors.push(`Failed to update ${update.identifier}: ${error.message}`);
      }
    }

    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'BULK_UPDATE',
      target_table: 'price_updates',
      target_id: null,
      changes: { results, errors, total: updates.length },
      ip_address: req.ip
    });

    res.json({
      message: 'Bulk price update completed',
      results,
      errors,
      summary: {
        total: updates.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Confirm bulk price update error:', error);
    res.status(500).json({ error: 'Failed to apply bulk price updates' });
  }
};