import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const NotFoundPage: React.FC = () => {
  return (
    <div className="auth-page">
      <Header />

      <main className="auth-main">
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🔍</div>
            <h1 className="auth-title">Page Not Found</h1>
            <p className="auth-subtitle" style={{ marginBottom: '2rem' }}>
              Oops! The page you're looking for doesn't exist or has been moved.
            </p>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/" className="auth-button" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Go Home
              </Link>
              <Link
                to="/dashboard"
                className="auth-button"
                style={{
                  textDecoration: 'none',
                  display: 'inline-block',
                  background: 'transparent',
                  border: '2px solid var(--color-primary)',
                  color: 'var(--color-primary)'
                }}
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFoundPage;
