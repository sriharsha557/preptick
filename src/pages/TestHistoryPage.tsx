import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { apiGet, apiPost, ApiError } from '../lib/api';
import './TestHistoryPage.css';

interface TestHistoryEntry {
  testId: string;
  subject: string;
  score: number | null;
  totalQuestions: number;
  completedAt: Date | null;
  status: string;
}

// Safe accessor functions for data validation and default values
const safeGetScore = (test: TestHistoryEntry): number | null => {
  if (test.score === null || test.score === undefined) return null;
  if (typeof test.score !== 'number' || isNaN(test.score)) return null;
  return test.score;
};

const safeGetScoreDisplay = (test: TestHistoryEntry): string => {
  const score = safeGetScore(test);
  if (score === null) return 'N/A';
  return `${score.toFixed(1)}%`;
};

const safeGetDate = (test: TestHistoryEntry): Date | null => {
  if (!test.completedAt) return null;
  
  // Handle both Date objects and string dates
  if (test.completedAt instanceof Date) {
    return isNaN(test.completedAt.getTime()) ? null : test.completedAt;
  }
  
  // Try to parse string date
  const parsed = new Date(test.completedAt);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const safeGetDateDisplay = (test: TestHistoryEntry): string => {
  const date = safeGetDate(test);
  if (!date) return 'N/A';
  
  try {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid date';
  }
};

const safeGetStatus = (test: TestHistoryEntry): string => {
  if (!test.status || typeof test.status !== 'string') return 'Unknown';
  return test.status;
};

const safeGetStatusDisplay = (test: TestHistoryEntry): string => {
  const status = safeGetStatus(test);
  if (status === 'Submitted') return 'Completed';
  if (status === 'InProgress') return 'In Progress';
  return status;
};

const safeGetSubject = (test: TestHistoryEntry): string => {
  if (!test.subject || typeof test.subject !== 'string') return 'Unknown Subject';
  return test.subject;
};

const safeGetTotalQuestions = (test: TestHistoryEntry): number => {
  if (test.totalQuestions === null || test.totalQuestions === undefined) return 0;
  if (typeof test.totalQuestions !== 'number' || isNaN(test.totalQuestions)) return 0;
  return Math.max(0, test.totalQuestions);
};

// Type guard to validate test entry has required fields
const isValidTestEntry = (test: any): test is TestHistoryEntry => {
  return (
    test &&
    typeof test === 'object' &&
    typeof test.testId === 'string' &&
    test.testId.length > 0
  );
};

const TestHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tests, setTests] = useState<TestHistoryEntry[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [filterSubject, setFilterSubject] = useState<string>('All');
  const [retryLoading, setRetryLoading] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<{ testId: string; message: string } | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/login');
        return;
      }

      const data = await apiGet<{ tests: TestHistoryEntry[]; averageScore: number }>(`/api/tests/history/${userId}`);
      
      // Validate and filter tests data
      const validTests = Array.isArray(data.tests) 
        ? data.tests.filter(isValidTestEntry)
        : [];
      
      setTests(validTests);
      
      // Safely handle average score
      const avgScore = typeof data.averageScore === 'number' && !isNaN(data.averageScore)
        ? data.averageScore
        : 0;
      setAverageScore(avgScore);
      
      setLoading(false);
    } catch (err) {
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to load test history. Please try again.';
      
      if (err instanceof ApiError) {
        // Handle specific API error codes
        if (err.statusCode === 401 || err.statusCode === 403) {
          errorMessage = 'Your session has expired. Please log in again.';
          // Redirect to login after a short delay
          setTimeout(() => navigate('/login'), 2000);
        } else if (err.statusCode === 404) {
          errorMessage = 'Test history service not found. Please contact support.';
        } else if (err.statusCode === 500) {
          errorMessage = 'Server error occurred while loading your history. Please try again later.';
        } else if (err.statusCode >= 500) {
          errorMessage = 'Our servers are experiencing issues. Please try again in a few minutes.';
        } else {
          errorMessage = err.message || 'An unexpected error occurred while loading your history.';
        }
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleRetryTest = async (testId: string) => {
    try {
      // Clear any previous error for this test
      setRetryError(null);
      
      // Set loading state for this specific test
      setRetryLoading(testId);
      
      // Get userId from localStorage
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/login');
        return;
      }

      // Make API request to retry endpoint
      const response = await apiPost<{ success: boolean; testId: string }>(
        `/api/tests/${testId}/retry`,
        { userId }
      );

      // Validate response structure before navigation
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from server');
      }

      if (!response.success) {
        throw new Error('Server indicated retry operation failed');
      }

      if (!response.testId || typeof response.testId !== 'string') {
        throw new Error('Invalid test ID received from server');
      }

      // Navigate to the new test
      navigate(`/test/${response.testId}`);
    } catch (err) {
      // Comprehensive error handling with user-friendly messages
      let errorMessage = 'Failed to retry test. Please try again.';

      if (err instanceof ApiError) {
        // Handle specific API error codes
        if (err.statusCode === 404) {
          errorMessage = 'Original test not found. It may have been deleted.';
        } else if (err.statusCode === 400) {
          errorMessage = 'Failed to generate retry test. Please try again.';
        } else if (err.statusCode === 401) {
          errorMessage = 'Session expired. Please log in again.';
          // Redirect to login after a short delay
          setTimeout(() => navigate('/login'), 2000);
        } else if (err.statusCode === 500) {
          errorMessage = 'Server error occurred. Please try again later.';
        } else {
          errorMessage = err.message || 'An unexpected error occurred.';
        }
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      // Set error state for this specific test
      setRetryError({ testId, message: errorMessage });
    } finally {
      // Clear loading state
      setRetryLoading(null);
    }
  };

  const getSubjects = () => {
    const subjects = new Set(tests.map(t => safeGetSubject(t)));
    return ['All', ...Array.from(subjects)];
  };

  const filteredTests = filterSubject === 'All' 
    ? tests 
    : tests.filter(t => safeGetSubject(t) === filterSubject);

  const completedTests = filteredTests.filter(t => safeGetStatus(t) === 'Submitted');
  const inProgressTests = filteredTests.filter(t => safeGetStatus(t) === 'InProgress');

  const getScoreColor = (score: number | null) => {
    if (score === null || score === undefined) return '#999';
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  if (loading) {
    return (
      <div className="test-history-page">
        <Header />
        <main className="history-main">
          <div className="loading">Loading test history...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="test-history-page">
        <Header />
        <main className="history-main">
          <div className="error-container">
            <h2>Unable to Load Test History</h2>
            <p className="error-message-text">{error}</p>
            <div className="error-actions">
              <button onClick={loadHistory} className="retry-button">
                Try Again
              </button>
              <button onClick={() => navigate('/dashboard')} className="back-button">
                Back to Dashboard
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="test-history-page">
      <Header />
      
      <main className="history-main">
        <div className="history-container">
          <div className="history-header">
            <h1 className="history-title">Test History</h1>
            <button onClick={() => navigate('/generate-test')} className="new-test-button">
              + New Test
            </button>
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{tests.length}</div>
              <div className="stat-label">Total Tests</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{completedTests.length}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{inProgressTests.length}</div>
              <div className="stat-label">In Progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: getScoreColor(averageScore) }}>
                {averageScore > 0 ? averageScore.toFixed(1) : '0.0'}%
              </div>
              <div className="stat-label">Average Score</div>
            </div>
          </div>

          {/* Filter */}
          <div className="filter-section">
            <label htmlFor="subject-filter" className="filter-label">Filter by Subject:</label>
            <select
              id="subject-filter"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="filter-select"
            >
              {getSubjects().map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {/* Test List */}
          {filteredTests.length === 0 ? (
            <div className="empty-state">
              {tests.length === 0 ? (
                <>
                  <h3>No Test History Yet</h3>
                  <p>You haven't taken any tests yet. Start your learning journey by generating your first test!</p>
                </>
              ) : (
                <>
                  <h3>No Tests Found</h3>
                  <p>No tests found for the selected subject filter. Try selecting a different subject or clear the filter.</p>
                </>
              )}
              <button onClick={() => navigate('/generate-test')} className="generate-button">
                Generate New Test
              </button>
            </div>
          ) : (
            <div className="tests-list">
              {filteredTests.map(test => (
                <div key={test.testId} className="test-card">
                  <div className="test-card-header">
                    <div className="test-subject">{safeGetSubject(test)}</div>
                    <div className={`test-status ${safeGetStatus(test).toLowerCase()}`}>
                      {safeGetStatusDisplay(test)}
                    </div>
                  </div>

                  <div className="test-card-body">
                    <div className="test-info">
                      <div className="info-row">
                        <span className="info-label">Questions:</span>
                        <span className="info-value">{safeGetTotalQuestions(test)}</span>
                      </div>
                      {safeGetScore(test) !== null && (
                        <div className="info-row">
                          <span className="info-label">Score:</span>
                          <span 
                            className="info-value score"
                            style={{ color: getScoreColor(safeGetScore(test)) }}
                          >
                            {safeGetScoreDisplay(test)}
                          </span>
                        </div>
                      )}
                      <div className="info-row">
                        <span className="info-label">Date:</span>
                        <span className="info-value">{safeGetDateDisplay(test)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="test-card-actions">
                    {safeGetStatus(test) === 'Submitted' ? (
                      <>
                        <button
                          onClick={() => navigate(`/test/${test.testId}/results`)}
                          className="action-btn primary"
                        >
                          View Results
                        </button>
                        <button
                          onClick={() => handleRetryTest(test.testId)}
                          className="action-btn secondary"
                          disabled={retryLoading === test.testId}
                        >
                          {retryLoading === test.testId ? 'Retrying...' : 'Retry'}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate(`/test/${test.testId}`)}
                        className="action-btn primary"
                      >
                        Continue Test
                      </button>
                    )}
                  </div>
                  
                  {/* Display retry error if it exists for this test */}
                  {retryError && retryError.testId === test.testId && (
                    <div className="retry-error">
                      <span className="error-message">{retryError.message}</span>
                      <button
                        onClick={() => setRetryError(null)}
                        className="dismiss-error"
                        aria-label="Dismiss error"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TestHistoryPage;
