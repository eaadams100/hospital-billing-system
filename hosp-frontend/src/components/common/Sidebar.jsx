import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'staff', 'pharmacist', 'accountant'] },
    { path: '/patients', label: 'Patients', icon: '👥', roles: ['admin', 'staff', 'accountant'] },
    { path: '/invoices', label: 'Invoices', icon: '🧾', roles: ['admin', 'accountant'] },
    { path: '/pharmacy', label: 'Pharmacy', icon: '💊', roles: ['admin', 'pharmacist'] },
    { path: '/services', label: 'Services', icon: '🩺', roles: ['admin', 'staff'] },
    { path: '/reports', label: 'Reports', icon: '📈', roles: ['admin', 'accountant'] },
    { path: '/admin', label: 'Admin', icon: '⚙️', roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>🏥 Hospital</h2>
        <p>Billing System</p>
      </div>
      <ul className="sidebar-nav">
        {filteredItems.map(item => (
          <li key={item.path}>
            <span>{item.icon}</span>
            <span style={{ marginLeft: '0.5rem' }}>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;