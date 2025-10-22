import { query } from '../config/database.js';

export const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};


export function requireStaff(req, res, next) {
  // Example: check for staff role
  if (!req.session.userId || req.user.role !== "staff") {
    return res.status(403).json({ message: "Access denied: Staff only" });
  }
  next();
}

export const loadUser = async (req, res, next) => {
  if (req.session.userId) {
    try {
      const result = await query(
        'SELECT id, email, full_name, role FROM users WHERE id = $1',
        [req.session.userId]
      );
      req.user = result.rows[0];
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }
  next();
};