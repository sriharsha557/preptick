import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './ContactPage.css';

const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    try {
      const response = await fetch('https://formspree.io/f/xzdgebod', {
        method: 'POST',
        body: new FormData(form),
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        setSubmitted(true);
        form.reset();
        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <div className="contact-page">
      <Header />
      
      <main className="contact-main">
        <div className="contact-container">
          <div className="contact-header">
            <h1 className="contact-title">Contact Us</h1>
            <div className="title-underline"></div>
            <p className="contact-subtitle">
              We would love to hear from you.
            </p>
          </div>
          
          <div className="contact-intro">
            <p className="intro-text">
              If you have questions, feedback, or suggestions about PrepTick, please reach out to us using the form below. 
              Whether you are a parent, student, or educator, your inputs help us improve and build a better exam preparation experience.
            </p>
          </div>

          <div className="contact-content">
            <div className="contact-info">
              <h2 className="info-title">Get in Touch</h2>
              
              <div className="info-description">
                <p>Use the contact form to:</p>
                <ul className="info-list">
                  <li>Ask questions about the platform</li>
                  <li>Share feedback or improvement ideas</li>
                  <li>Report issues or suggest features</li>
                </ul>
                <p className="response-time">
                  We try to respond to all messages within 1–2 business days.
                </p>
              </div>
            </div>
            
            <div className="contact-form-section">
              <h2 className="form-section-title">Contact Form</h2>
              
              {submitted ? (
                <div className="success-message">
                  <div className="success-icon">✓</div>
                  <h3 className="success-title">Message Sent!</h3>
                  <p className="success-text">Thank you for contacting us. We'll get back to you within 1-2 business days.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="subject" className="form-label">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="message" className="form-label">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      className="form-textarea"
                      rows={6}
                      required
                    />
                  </div>
                  
                  <button type="submit" className="submit-button">
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="privacy-note">
            <h3 className="privacy-title">Privacy Note</h3>
            <p className="privacy-text">
              Your contact details will be used only to respond to your query. We do not share your information with third parties.
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ContactPage;
