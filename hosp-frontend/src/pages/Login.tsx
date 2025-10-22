import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, user, loading, error, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, location]);

  // Clear error when user starts typing
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [email, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
    
    setIsLoading(false);
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ color: '#2c3e50', marginBottom: '0.5rem', fontSize: '2rem' }}>🏥 Hospital</h1>
          <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>Billing System</p>
        </div>

        {error && (
          <div style={{
            background: '#fee',
            color: '#c33',
            padding: '0.75rem',
            borderRadius: '4px',
            marginBottom: '1rem',
            border: '1px solid #fcc'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontWeight: '600',
              color: '#2c3e50'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                transition: 'border-color 0.3s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#3498db'}
              onBlur={(e) => e.target.style.borderColor = '#ddd'}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: isLoading ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s'
            }}
            onMouseOver={(e) => {
              if (!isLoading) e.target.style.background = '#2980b9';
            }}
            onMouseOut={(e) => {
              if (!isLoading) e.target.style.background = '#3498db';
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem',
          background: '#f8f9fa',
          borderRadius: '4px',
          border: '1px solid #e9ecef'
        }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#2c3e50' }}>Demo Credentials:</h4>
          <div style={{ fontSize: '0.9rem', color: '#7f8c8d', lineHeight: '1.5' }}>
            <div><strong>Admin:</strong> admin@hospital.com / password</div>
            <div><strong>Pharmacist:</strong> pharmacist@hospital.com / password</div>
            <div><strong>Accountant:</strong> accountant@hospital.com / password</div>
            <div><strong>Staff:</strong> staff@hospital.com / password</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;