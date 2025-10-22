import { query } from '../config/database.js';

export const ScheduledPriceChanges = {
  async findPending() {
    const result = await query(
      `SELECT * FROM scheduled_price_changes 
       WHERE status = 'pending' AND scheduled_for <= CURRENT_DATE 
       ORDER BY scheduled_for ASC`
    );
    return result.rows;
  },

  async markAsApplied(id) {
    const result = await query(
      'UPDATE scheduled_price_changes SET status = $1, applied_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      ['applied', id]
    );
    return result.rows[0];
  },

  async findByEntity(entityType, entityId) {
    const result = await query(
      `SELECT * FROM scheduled_price_changes 
       WHERE entity_type = $1 AND entity_id = $2 AND status = 'pending' 
       ORDER BY scheduled_for ASC`,
      [entityType, entityId]
    );
    return result.rows;
  }
};