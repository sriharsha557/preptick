import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './SamplePaperPage.css';

const SamplePaperPage: React.FC = () => {
  const handleDownload = () => {
    // Create a link to download the file
    const link = document.createElement('a');
    link.href = '/documents/PrepTick_Sample_Paper_Class6_Maths.docx';
    link.download = 'PrepTick_Sample_Paper_Class6_Maths.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="sample-paper-page">
      <Header />
      
      <main className="sample-main">
        <div className="sample-container">
          <div className="sample-header">
            <h1 className="sample-title">Sample Question Paper</h1>
            <div className="title-underline"></div>
            <p className="sample-subtitle">
              Experience the quality of PrepTick mock tests with our sample paper
            </p>
          </div>

          <div className="sample-content">
            <div className="sample-card">
              <div className="sample-badge">Sample Paper</div>
              
              <div className="sample-info">
                <div className="sample-icon">📄</div>
                <h2 className="sample-name">Class 6 Mathematics</h2>
                <p className="sample-description">
                  A comprehensive mock test paper aligned with CBSE curriculum for Class 6 Mathematics.
                  This sample demonstrates the quality and format of PrepTick question papers.
                </p>
              </div>

              <div className="sample-details">
                <div className="detail-item">
                  <span className="detail-label">Curriculum:</span>
                  <span className="detail-value">CBSE</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Grade:</span>
                  <span className="detail-value">Class 6</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Subject:</span>
                  <span className="detail-value">Mathematics</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Format:</span>
                  <span className="detail-value">DOCX (Microsoft Word)</span>
                </div>
              </div>

              <div className="sample-features">
                <h3 className="features-title">What's Included</h3>
                <ul className="features-list">
                  <li>✓ Syllabus-aligned questions</li>
                  <li>✓ Multiple question types (MCQ, Short Answer, Numerical)</li>
                  <li>✓ Exam-realistic difficulty level</li>
                  <li>✓ PrepTick watermark on every page</li>
                  <li>✓ Professional formatting</li>
                  <li>✓ Answer key included</li>
                </ul>
              </div>

              <div className="sample-actions">
                <button onClick={handleDownload} className="download-button">
                  <span className="button-icon">⬇</span>
                  Download Sample Paper
                </button>
                <Link to="/register" className="register-button">
                  Create Free Account
                </Link>
              </div>

              <div className="sample-note">
                <p className="note-text">
                  <strong>Note:</strong> All PrepTick question papers include our logo watermark 
                  to ensure authenticity and quality. Register for free to generate unlimited 
                  custom mock tests for your curriculum and grade.
                </p>
              </div>
            </div>

            <div className="why-preptick-section">
              <h2 className="section-title">Why Choose PrepTick?</h2>
              <div className="benefits-grid">
                <div className="benefit-card">
                  <div className="benefit-icon">🎯</div>
                  <h3 className="benefit-title">Syllabus Aligned</h3>
                  <p className="benefit-text">
                    Every question is mapped to official CBSE and Cambridge curriculum topics
                  </p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">📊</div>
                  <h3 className="benefit-title">Performance Tracking</h3>
                  <p className="benefit-text">
                    Get detailed feedback and identify weak areas for focused improvement
                  </p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">🖨️</div>
                  <h3 className="benefit-title">Print or Practice Online</h3>
                  <p className="benefit-text">
                    Download PDFs for paper practice or take tests directly in the app
                  </p>
                </div>
                <div className="benefit-card">
                  <div className="benefit-icon">🔄</div>
                  <h3 className="benefit-title">Unlimited Tests</h3>
                  <p className="benefit-text">
                    Generate as many mock tests as you need with unique questions every time
                  </p>
                </div>
              </div>
            </div>

            <div className="cta-section">
              <h2 className="cta-title">Ready to Start Practicing?</h2>
              <p className="cta-text">
                Create your free account and generate custom mock tests tailored to your curriculum and grade
              </p>
              <Link to="/register" className="cta-button">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SamplePaperPage;
