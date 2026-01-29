import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AboutPage.css';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      <Header />
      
      <main className="about-main">
        <div className="about-container">
          <div className="about-header">
            <h1 className="about-title">About Us</h1>
            <div className="title-underline"></div>
          </div>
          
          <div className="about-content">
            <div className="story-section">
              <p className="story-text">
                PrepTick was founded by two friends, <strong>Rahul</strong> and <strong>Harsha</strong>, who are also parents of young students.
              </p>
              
              <p className="story-text">
                As parents, we experienced first-hand how difficult it can be to find reliable, syllabus-aligned sample questions that truly reflect exam standards. While there is plenty of learning content available, meaningful practice through well-structured mock tests is surprisingly hard to come by.
              </p>
              
              <p className="story-text highlight">
                We created PrepTick to solve this exact problem.
              </p>
              
              <p className="story-text">
                Our goal is simple: to help students prepare better for exams by giving them access to realistic mock test papers, clear answer keys, and focused post-test feedback that highlights improvement areas. PrepTick is designed to support both printed exam practice and digital assessments, so students can practice in a way that feels familiar and effective.
              </p>
              
              <p className="story-text">
                We believe that consistent practice, honest assessment, and targeted revision build confidence. PrepTick is our effort to make exam preparation clearer, calmer, and more effective for students and parents alike.
              </p>
            </div>
            
            <div className="values-section">
              <h2 className="values-title">Our Values</h2>
              
              <div className="values-grid">
                <div className="value-card">
                  <div className="value-icon">📚</div>
                  <h3 className="value-name">Syllabus-Aligned</h3>
                  <p className="value-description">
                    Every question reflects official curriculum standards and exam patterns
                  </p>
                </div>
                
                <div className="value-card">
                  <div className="value-icon">✓</div>
                  <h3 className="value-name">Realistic Practice</h3>
                  <p className="value-description">
                    Mock tests that mirror actual exam difficulty and format
                  </p>
                </div>
                
                <div className="value-card">
                  <div className="value-icon">💡</div>
                  <h3 className="value-name">Focused Feedback</h3>
                  <p className="value-description">
                    Clear insights on strengths and areas needing improvement
                  </p>
                </div>
                
                <div className="value-card">
                  <div className="value-icon">🎯</div>
                  <h3 className="value-name">Confidence Building</h3>
                  <p className="value-description">
                    Consistent practice that builds exam readiness and reduces anxiety
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mission-section">
              <div className="mission-box">
                <h2 className="mission-title">Our Mission</h2>
                <p className="mission-text">
                  To make exam preparation clearer, calmer, and more effective for students and parents through reliable, syllabus-aligned practice materials and meaningful feedback.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AboutPage;
