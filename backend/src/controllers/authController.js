import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { User, AuditLog } from '../models/index.js';

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Set session
    req.session.userId = user.id;

    // Log audit
    await AuditLog.create({
      user_id: user.id,
      action: 'LOGIN',
      target_table: 'users',
      target_id: user.id,
      changes: { login_time: new Date() },
      ip_address: req.ip
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req, res) => {
  try {
    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'LOGOUT',
      target_table: 'users',
      target_id: req.user.id,
      changes: { logout_time: new Date() },
      ip_address: req.ip
    });

    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out successfully' });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get current user with password hash
    const user = await User.findByEmail(req.user.email);

    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    // Log audit
    await AuditLog.create({
      user_id: req.user.id,
      action: 'UPDATE',
      target_table: 'users',
      target_id: req.user.id,
      changes: { password_changed: true },
      ip_address: req.ip
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};