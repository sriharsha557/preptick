import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AuthPages.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
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
      // Login with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (authData.session) {
        // Store session
        localStorage.setItem('supabase_session', JSON.stringify(authData.session));
        localStorage.setItem('userId', authData.user.id);
        
        // Also login to our backend
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('token', data.token);
          navigate('/dashboard');
        } else {
          // Even if backend login fails, Supabase auth succeeded
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
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
