import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Configure axios to include credentials for session cookies
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/auth/me');
      if (response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.log('Not authenticated:', error.response?.data?.message || error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      if (response.data.user) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setError('');
    }
  };

  const clearError = () => setError('');

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};