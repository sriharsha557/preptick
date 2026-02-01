import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AuthPages.css';

interface LocationState {
  from?: {
    pathname: string;
  };
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  // Get the page user was trying to access before being redirected to login
  const from = (location.state as LocationState)?.from?.pathname || '/dashboard';
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Navigate to dashboard when authentication state changes after login attempt
  // Also redirect if user is already authenticated when visiting login page
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User authenticated, navigating to:', from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login...');

      // Login with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error('Supabase auth error:', authError);
        
        // Provide user-friendly error messages
        let errorMessage = authError.message;
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (authError.message.includes('Email not confirmed')) {
          errorMessage = 'Please verify your email address. Check your inbox for a confirmation link.';
        } else if (authError.message.includes('Email link is invalid')) {
          errorMessage = 'Email confirmation link is invalid or expired.';
        }
        
        setError(errorMessage);
        return;
      }

      if (authData.session) {
        console.log('Login successful');

        // Store Supabase session
        localStorage.setItem('supabase_session', JSON.stringify(authData.session));

        // Use AuthContext login method to set user state
        // Navigation happens in useEffect when isAuthenticated becomes true
        login(authData.session.access_token, authData.user.id, authData.user.email || '');
      } else {
        setError('Login failed. No session returned.');
        console.error('No session returned from Supabase');
      }
    } catch (err) {
      setError('Network error. Please check your internet connection and try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Header />
      
      <main className="auth-main">
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Login to continue your exam preparation</p>
            
            {error && <div className="auth-error">{error}</div>}
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
            
            <p className="auth-link-text">
              Don't have an account? <Link to="/register" className="auth-link">Register here</Link>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default LoginPage;
