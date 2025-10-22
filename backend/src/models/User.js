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
  },

  async update(id, userData) {
    const { email, full_name, role } = userData;
    const result = await query(
      'UPDATE users SET email = $1, full_name = $2, role = $3 WHERE id = $4 RETURNING id, email, full_name, role, created_at, last_login',
      [email, full_name, role, id]
    );
    return result.rows[0];
  },

  async delete(id) {
    await query('DELETE FROM users WHERE id = $1', [id]);
    return true;
  }
};