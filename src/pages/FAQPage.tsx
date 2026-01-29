import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './FAQPage.css';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const faqs: FAQItem[] = [
    {
      category: 'general',
      question: 'What is PREP TICK?',
      answer: 'PREP TICK is an exam preparation platform that helps students practice with syllabus-aligned mock tests. We generate questions based on CBSE curriculum to ensure students are well-prepared for their exams.',
    },
    {
      category: 'general',
      question: 'Which grades and subjects are supported?',
      answer: 'Currently, we support CBSE curriculum for Classes 3-4, covering English and Mathematics. We are continuously expanding to include more grades and subjects.',
    },
    {
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click on the "Login" button in the header, then select "Register" to create a new account. You\'ll need to provide your name, email, password, and select your grade level.',
    },
    {
      category: 'account',
      question: 'Is PREP TICK free to use?',
      answer: 'Yes, PREP TICK is currently free to use for all students. We believe in making quality education accessible to everyone.',
    },
    {
      category: 'tests',
      question: 'How are mock tests generated?',
      answer: 'Our system uses AI to generate questions based on the official CBSE syllabus. Questions are aligned with specific topics and learning objectives to ensure comprehensive coverage.',
    },
    {
      category: 'tests',
      question: 'Can I retake a test?',
      answer: 'Yes, you can generate and take as many mock tests as you want. Each test will have different questions to help you practice various concepts.',
    },
    {
      category: 'tests',
      question: 'How long does it take to complete a test?',
      answer: 'Test duration varies based on the number of questions and difficulty level. Typically, tests range from 30 minutes to 1 hour.',
    },
    {
      category: 'technical',
      question: 'What browsers are supported?',
      answer: 'PREP TICK works best on modern browsers like Chrome, Firefox, Safari, and Edge. Make sure your browser is updated to the latest version.',
    },
    {
      category: 'technical',
      question: 'I\'m having trouble logging in. What should I do?',
      answer: 'First, make sure you\'re using the correct email and password. If you\'ve forgotten your password, use the "Forgot Password" link. If issues persist, contact our support team.',
    },
    {
      category: 'results',
      question: 'How are my results calculated?',
      answer: 'Your score is calculated based on correct answers. Detailed feedback is provided for each question to help you understand concepts better.',
    },
    {
      category: 'results',
      question: 'Can I see my past test results?',
      answer: 'Yes, all your test results are saved in your dashboard. You can review them anytime to track your progress.',
    },
  ];

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'general', label: 'General' },
    { id: 'account', label: 'Account' },
    { id: 'tests', label: 'Tests' },
    { id: 'results', label: 'Results' },
    { id: 'technical', label: 'Technical' },
  ];

  const filteredFaqs = selectedCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === selectedCategory);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      <Header />
      
      <main className="faq-main">
        <div className="faq-container">
          <div className="faq-header">
            <h1 className="faq-title">Frequently Asked Questions</h1>
            <div className="title-underline"></div>
            <p className="faq-subtitle">
              Find answers to common questions about PREP TICK
            </p>
          </div>

          <div className="faq-categories">
            {categories.map(category => (
              <button
                key={category.id}
                className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="faq-list">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="faq-item">
                <button
                  className={`faq-question ${openIndex === index ? 'active' : ''}`}
                  onClick={() => toggleFAQ(index)}
                >
                  <span className="question-text">{faq.question}</span>
                  <span className="toggle-icon">{openIndex === index ? '−' : '+'}</span>
                </button>
                {openIndex === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="faq-contact">
            <h2 className="contact-title">Still have questions?</h2>
            <p className="contact-text">
              Can't find the answer you're looking for? Feel free to reach out to our support team.
            </p>
            <a href="/contact" className="contact-button">
              Contact Us
            </a>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default FAQPage;
