import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './TakeTestPage.css';

interface Question {
  questionId: string;
  questionText: string;
  questionType: string;
  options?: string[];
  topicId: string;
}

interface Response {
  questionId: string;
  answer: string;
  answeredAt: Date;
}

const TakeTestPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Map<string, string>>(new Map());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  useEffect(() => {
    startTest();
  }, [testId]);

  const startTest = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/login');
        return;
      }

      // Start test session
      const startResponse = await fetch(`/api/tests/${testId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start test');
      }

      const startData = await startResponse.json();
      const newSessionId = startData.sessionId;
      setSessionId(newSessionId);

      // Get test session with questions
      const sessionResponse = await fetch(`/api/tests/session/${newSessionId}`);
      
      if (!sessionResponse.ok) {
        throw new Error('Failed to load test');
      }

      const sessionData = await sessionResponse.json();
      setQuestions(sessionData.questions);
      
      // Load existing responses
      const existingResponses = new Map<string, string>();
      sessionData.responses.forEach((r: Response) => {
        existingResponses.set(r.questionId, r.answer);
      });
      setResponses(existingResponses);
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load test');
      setLoading(false);
    }
  };

  const handleAnswerChange = (answer: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    const newResponses = new Map(responses);
    newResponses.set(currentQuestion.questionId, answer);
    setResponses(newResponses);

    // Auto-save answer
    saveAnswer(currentQuestion.questionId, answer);
  };

  const saveAnswer = async (questionId: string, answer: string) => {
    try {
      await fetch(`/api/tests/session/${sessionId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questionId, answer }),
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit the test? You cannot change your answers after submission.')) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/tests/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit test');
      }

      const data = await response.json();
      
      // Navigate to results page
      navigate(`/test/${testId}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit test');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="take-test-page">
        <Header />
        <main className="take-test-main">
          <div className="loading">Loading test...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="take-test-page">
        <Header />
        <main className="take-test-main">
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/dashboard')} className="back-button">
              Back to Dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = responses.get(currentQuestion.questionId) || '';
  const answeredCount = responses.size;
  const progress = (answeredCount / questions.length) * 100;

  return (
    <div className="take-test-page">
      <Header />
      
      <main className="take-test-main">
        <div className="test-container">
          <div className="test-header">
            <h1 className="test-title">Mock Test</h1>
            <div className="test-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-text">
                Question {currentQuestionIndex + 1} of {questions.length} 
                ({answeredCount} answered)
              </p>
            </div>
          </div>

          <div className="question-card">
            <div className="question-number">Question {currentQuestionIndex + 1}</div>
            <div className="question-text">{currentQuestion.questionText}</div>

            <div className="answer-section">
              {currentQuestion.questionType === 'MultipleChoice' && currentQuestion.options ? (
                <div className="options-list">
                  {currentQuestion.options.map((option, index) => (
                    <label key={index} className="option-label">
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={currentAnswer === option}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  className="answer-input"
                  value={currentAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={4}
                />
              )}
            </div>
          </div>

          <div className="navigation-buttons">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="nav-button"
            >
              ← Previous
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button onClick={handleNext} className="nav-button primary">
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="nav-button submit"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>

          <div className="question-navigator">
            <h3>Questions</h3>
            <div className="question-grid">
              {questions.map((q, index) => (
                <button
                  key={q.questionId}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`question-number-btn ${
                    index === currentQuestionIndex ? 'active' : ''
                  } ${responses.has(q.questionId) ? 'answered' : ''}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TakeTestPage;
