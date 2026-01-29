import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  return (
    <div className="landing-page">
      <Header />
      
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-headline">EXAM PREPARATION, DONE RIGHT</h1>
            <p className="hero-subheadline">
              Syllabus-aligned mock tests for CBSE and Cambridge students. Practice with real exam papers, 
              clear answer keys, and focused feedback.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn-primary">Start Practicing</Link>
              <Link to="/sample-paper" className="btn-secondary">View Sample Paper</Link>
            </div>
          </div>
          
          <div className="hero-illustration">
            <img src="/hero.png" alt="Exam Preparation Illustration" className="illustration-image" />
          </div>
        </div>
      </section>

      {/* WHY PREPTICK */}
      <section className="why-section">
        <div className="section-container">
          <h2 className="section-heading">Why PrepTick?</h2>
          <div className="why-grid">
            <div className="why-card">
              <div className="why-icon">📝</div>
              <p className="why-text">Exam-realistic mock papers, not random questions</p>
            </div>
            <div className="why-card">
              <div className="why-icon">✓</div>
              <p className="why-text">Strictly aligned to CBSE and Cambridge syllabus</p>
            </div>
            <div className="why-card">
              <div className="why-icon">🖨️</div>
              <p className="why-text">Printable PDFs or in-app practice</p>
            </div>
            <div className="why-card">
              <div className="why-icon">💡</div>
              <p className="why-text">Clear answer keys and post-test improvement insights</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="section-container">
          <h2 className="section-heading">How PrepTick Works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <p className="step-text">Choose your board, grade, and subject</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <p className="step-text">Select topics and generate a mock test</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <p className="step-text">Practice on paper or directly in the app</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <p className="step-text">Review answer key and identify improvement areas</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHO IT IS FOR */}
      <section className="who-section">
        <div className="section-container">
          <h2 className="section-heading">Who PrepTick Helps</h2>
          <div className="who-list">
            <div className="who-item">
              <div className="who-icon">👨‍🎓</div>
              <p className="who-text">Students from Class 1 to Class 10</p>
            </div>
            <div className="who-item">
              <div className="who-icon">👨‍👩‍👧</div>
              <p className="who-text">Parents looking for structured exam practice</p>
            </div>
            <div className="who-item">
              <div className="who-icon">🎯</div>
              <p className="who-text">Students who want confidence through revision</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRACTICE MODES */}
      <section className="modes-section">
        <div className="section-container">
          <h2 className="section-heading">Practice the Way Exams Happen</h2>
          <div className="modes-grid">
            <div className="mode-card">
              <div className="mode-icon">📄</div>
              <h3 className="mode-title">Printable Mock Papers</h3>
              <p className="mode-description">Download and print exam-style question papers.</p>
            </div>
            <div className="mode-card">
              <div className="mode-icon">💻</div>
              <h3 className="mode-title">In-App Tests</h3>
              <p className="mode-description">Attempt mock exams digitally with post-test feedback.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST & PHILOSOPHY */}
      <section className="trust-section">
        <div className="section-container">
          <h2 className="section-heading">Built by Parents, For Students</h2>
          <p className="trust-text">
            PrepTick is created by parents who understand the importance of meaningful practice. 
            Our focus is on assessment, feedback, and improvement — not shortcuts.
          </p>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="cta-section">
        <div className="cta-container">
          <h2 className="cta-heading">Start Exam-Ready Practice Today</h2>
          <Link to="/register" className="cta-button">Create Free Account</Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default LandingPage;
