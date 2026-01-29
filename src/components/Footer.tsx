import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
          © {new Date().getFullYear()} PREP TICK. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
