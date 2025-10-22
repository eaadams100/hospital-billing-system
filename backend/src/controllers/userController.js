import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { User, AuditLog } from '../models/index.js';

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT id, email, full_name, role, created_at, last_login 
       FROM users 
       ORDER BY created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) FROM users');

    res.json({
      users: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(parseInt(req.params.id));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['admin', 'staff', 'pharmacist', 'accountant'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      password_hash: passwordHash,
      full_name,
      role
    });

    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'CREATE',
      target_table: 'users',
      target_id: user.id,
      changes: { email, full_name, role },
      ip_address: req.ip
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'User with this email already exists' });
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { email, full_name, role } = req.body;
    const userId = parseInt(req.params.id);

    if (!email || !full_name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['admin', 'staff', 'pharmacist', 'accountant'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== userId) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const result = await query(
      `UPDATE users SET 
       email = $1, full_name = $2, role = $3 
       WHERE id = $4 
       RETURNING id, email, full_name, role, created_at, last_login`,
      [email, full_name, role, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'UPDATE',
      target_table: 'users',
      target_id: user.id,
      changes: { email, full_name, role },
      ip_address: req.ip
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent self-deletion
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await query('DELETE FROM users WHERE id = $1', [userId]);

    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'DELETE',
      target_table: 'users',
      target_id: userId,
      changes: { deleted_user: user },
      ip_address: req.ip
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};