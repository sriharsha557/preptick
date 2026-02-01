import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AuthPages.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      console.log('Attempting login with:', formData.email);
      
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
        console.log('Login successful! User ID:', authData.user.id);
        
        // Store Supabase session
        localStorage.setItem('supabase_session', JSON.stringify(authData.session));
        
        // Use AuthContext login method to set user state
        login(authData.session.access_token, authData.user.id, authData.user.email || '');
        
        console.log('Navigating to dashboard...');
        
        // Navigate to dashboard
        navigate('/dashboard');
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
