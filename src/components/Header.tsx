import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <img src="/logo.png" alt="PREP TICK Logo" className="logo-image" />
          <span className="logo-text">PREP TICK</span>
        </div>
        <nav className="nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/about" className="nav-link">About Us</Link>
          <Link to="/contact" className="nav-link">Contact Us</Link>
          <Link to="/faq" className="nav-link">FAQ</Link>
          <Link to="/login" className="nav-link">Login</Link>
          <Link to="/register" className="nav-link nav-link-signup">Sign Up</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
