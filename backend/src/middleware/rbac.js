export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Role-specific middleware
export const requireAdmin = requireRole(['admin']);
export const requirePharmacist = requireRole(['admin', 'pharmacist']);
export const requireAccountant = requireRole(['admin', 'accountant']);
export const requireStaff = requireRole(['admin', 'staff', 'pharmacist', 'accountant']);