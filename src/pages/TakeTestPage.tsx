import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { PageLoading } from '../components/LoadingSkeleton';
import { apiPost, apiGet } from '../lib/api';
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

// Timer duration in seconds (30 minutes default)
const DEFAULT_TEST_DURATION = 30 * 60;

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

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(DEFAULT_TEST_DURATION);
  const [isTimerWarning, setIsTimerWarning] = useState(false);
  const [isTimerCritical, setIsTimerCritical] = useState(false);

  // Auto-save indicator
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    startTest();
  }, [testId]);

  // Timer effect
  useEffect(() => {
    if (loading || submitting) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }

        // Warning at 5 minutes
        if (prev <= 5 * 60 && !isTimerWarning) {
          setIsTimerWarning(true);
        }

        // Critical at 1 minute
        if (prev <= 60 && !isTimerCritical) {
          setIsTimerCritical(true);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, submitting, isTimerWarning, isTimerCritical]);

  // Format time remaining
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTest = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/login');
        return;
      }

      // Start test session
      const startData = await apiPost<{ sessionId: string }>(`/api/tests/${testId}/start`, { userId });
      const newSessionId = startData.sessionId;
      setSessionId(newSessionId);

      // Get test session with questions
      const sessionData = await apiGet<{
        questions: Question[];
        responses: Response[];
      }>(`/api/tests/session/${newSessionId}`);
      setQuestions(sessionData.questions);

      // Load existing responses
      const existingResponses = new Map<string, string>();
      sessionData.responses.forEach((r: Response) => {
        existingResponses.set(r.questionId, r.answer);
      });
      setResponses(existingResponses);

      // Set timer based on question count (2 min per question, max 60 min)
      const testDuration = Math.min(sessionData.questions.length * 2 * 60, 60 * 60);
      setTimeRemaining(testDuration);

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

    // Auto-save answer with debounce
    saveAnswer(currentQuestion.questionId, answer);
  };

  const saveAnswer = useCallback(async (questionId: string, answer: string) => {
    setSaveStatus('saving');

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    try {
      await apiPost(`/api/tests/session/${sessionId}/answer`, { questionId, answer });

      setSaveStatus('saved');

      // Reset to idle after 2 seconds
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Failed to save answer:', err);
      setSaveStatus('error');
    }
  }, [sessionId]);

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

  const handleAutoSubmit = async () => {
    // Auto-submit when time runs out
    setSubmitting(true);
    try {
      await apiPost('/api/tests/submit', { sessionId });
      navigate(`/test/${testId}/results`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit test');
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);

    try {
      await apiPost('/api/tests/submit', { sessionId });
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
          <PageLoading message="Loading test..." />
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
            <div className="error-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
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
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="take-test-page">
      <Header />

      <main className="take-test-main">
        <div className="test-container">
          {/* Test Header with Timer */}
          <div className="test-header">
            <div className="test-header-left">
              <h1 className="test-title">Mock Test</h1>
              <div className="test-progress">
                <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="progress-text">
                  {answeredCount} of {questions.length} answered
                </p>
              </div>
            </div>

            <div className="test-header-right">
              {/* Timer */}
              <div
                className={`timer ${isTimerWarning ? 'timer-warning' : ''} ${isTimerCritical ? 'timer-critical' : ''}`}
                role="timer"
                aria-label={`Time remaining: ${formatTime(timeRemaining)}`}
              >
                <svg className="timer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                <span className="timer-text">{formatTime(timeRemaining)}</span>
              </div>

              {/* Save Status Indicator */}
              <div className={`save-indicator save-indicator-${saveStatus}`} aria-live="polite">
                {saveStatus === 'saving' && (
                  <>
                    <span className="save-spinner" aria-hidden="true"></span>
                    <span>Saving...</span>
                  </>
                )}
                {saveStatus === 'saved' && (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span>Saved</span>
                  </>
                )}
                {saveStatus === 'error' && (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 8v4M12 16h.01" />
                    </svg>
                    <span>Save failed</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Question Card */}
          <div className="question-card animate-fade-in">
            <div className="question-number">Question {currentQuestionIndex + 1}</div>
            <div className="question-text">{currentQuestion.questionText}</div>

            <div className="answer-section">
              {currentQuestion.questionType === 'MultipleChoice' && currentQuestion.options ? (
                <div className="options-list" role="radiogroup" aria-label="Answer options">
                  {currentQuestion.options.map((option, index) => (
                    <label key={index} className={`option-label ${currentAnswer === option ? 'option-selected' : ''}`}>
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={currentAnswer === option}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                      />
                      <span className="option-indicator">{String.fromCharCode(65 + index)}</span>
                      <span className="option-text">{option}</span>
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
                  aria-label="Your answer"
                />
              )}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="navigation-buttons">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="nav-button"
              aria-label="Previous question"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Previous
            </button>

            {currentQuestionIndex < questions.length - 1 ? (
              <button onClick={handleNext} className="nav-button primary" aria-label="Next question">
                Next
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={submitting}
                className="nav-button submit"
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>

          {/* Question Navigator */}
          <div className="question-navigator">
            <h3>Questions</h3>
            <div className="question-grid" role="navigation" aria-label="Question navigator">
              {questions.map((q, index) => (
                <button
                  key={q.questionId}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`question-number-btn ${
                    index === currentQuestionIndex ? 'active' : ''
                  } ${responses.has(q.questionId) ? 'answered' : ''}`}
                  aria-label={`Question ${index + 1}${responses.has(q.questionId) ? ', answered' : ', not answered'}${index === currentQuestionIndex ? ', current' : ''}`}
                  aria-current={index === currentQuestionIndex ? 'true' : undefined}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div className="navigator-legend">
              <span className="legend-item">
                <span className="legend-dot"></span>
                Not answered
              </span>
              <span className="legend-item">
                <span className="legend-dot answered"></span>
                Answered
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <h2 id="modal-title">Submit Test?</h2>
            <div className="modal-content">
              <p>Are you sure you want to submit your test?</p>
              {unansweredCount > 0 && (
                <p className="modal-warning">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <path d="M12 9v4M12 17h.01" />
                  </svg>
                  You have {unansweredCount} unanswered question{unansweredCount > 1 ? 's' : ''}.
                </p>
              )}
              <p className="modal-note">You cannot change your answers after submission.</p>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowConfirmModal(false)} className="modal-button secondary">
                Continue Test
              </button>
              <button onClick={handleSubmit} className="modal-button primary" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default TakeTestPage;
