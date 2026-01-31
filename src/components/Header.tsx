import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    setIsLoggedIn(!!userId);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to={isLoggedIn ? "/dashboard" : "/"} className="logo">
          <img src="/logo.png" alt="PREP TICK Logo" className="logo-image" />
          <span className="logo-text">PREP TICK</span>
        </Link>
        <nav className="nav">
          {!isLoggedIn && <Link to="/" className="nav-link">Home</Link>}
          <Link to="/about" className="nav-link">About Us</Link>
          <Link to="/contact" className="nav-link">Contact Us</Link>
          <Link to="/faq" className="nav-link">FAQ</Link>
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/profile" className="nav-link">Profile</Link>
              <button onClick={handleLogout} className="nav-link nav-link-logout">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link nav-link-signup">Sign Up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
