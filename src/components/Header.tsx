import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="logo">
          <img src="/logo.png" alt="PREP TICK Logo" className="logo-image" />
          <span className="logo-text">PREP TICK</span>
        </Link>

        {/* Hamburger button */}
        <button
          className={`hamburger ${isMobileMenuOpen ? 'hamburger-open' : ''}`}
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="nav-menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>

        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div
            className="nav-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Navigation */}
        <nav
          id="nav-menu"
          className={`nav ${isMobileMenuOpen ? 'nav-open' : ''}`}
          role="navigation"
          aria-label="Main navigation"
        >
          {!isAuthenticated && (
            <Link to="/" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
              Home
            </Link>
          )}
          <Link to="/about" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            About Us
          </Link>
          <Link to="/contact" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            Contact Us
          </Link>
          <Link to="/faq" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
            FAQ
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to="/profile" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Profile
              </Link>
              <button onClick={handleLogout} className="nav-link nav-link-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={() => setIsMobileMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="nav-link nav-link-signup" onClick={() => setIsMobileMenuOpen(false)}>
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
