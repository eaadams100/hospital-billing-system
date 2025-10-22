import React from 'react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="header">
      <h1>Hospital Billing System</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span>Welcome, {user?.full_name}</span>
        <span style={{ 
          background: '#e3f2fd', 
          color: '#1976d2', 
          padding: '0.25rem 0.75rem', 
          borderRadius: '20px',
          fontSize: '0.875rem'
        }}>
          {user?.role}
        </span>
        <button onClick={handleLogout} className="btn btn-primary">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;