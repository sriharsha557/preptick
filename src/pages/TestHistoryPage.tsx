import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './TestHistoryPage.css';

interface TestHistoryEntry {
  testId: string;
  subject: string;
  score: number | null;
  totalQuestions: number;
  completedAt: Date | null;
  status: string;
}

const TestHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tests, setTests] = useState<TestHistoryEntry[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [filterSubject, setFilterSubject] = useState<string>('All');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/tests/history/${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load test history');
      }

      const data = await response.json();
      setTests(data.tests);
      setAverageScore(data.averageScore);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      setLoading(false);
    }
  };

  const getSubjects = () => {
    const subjects = new Set(tests.map(t => t.subject));
    return ['All', ...Array.from(subjects)];
  };

  const filteredTests = filterSubject === 'All' 
    ? tests 
    : tests.filter(t => t.subject === filterSubject);

  const completedTests = filteredTests.filter(t => t.status === 'Submitted');
  const inProgressTests = filteredTests.filter(t => t.status === 'InProgress');

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
                {averageScore.toFixed(1)}%
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
              <p>No tests found. Start by generating your first test!</p>
              <button onClick={() => navigate('/generate-test')} className="generate-button">
                Generate Test
              </button>
            </div>
          ) : (
            <div className="tests-list">
              {filteredTests.map(test => (
                <div key={test.testId} className="test-card">
                  <div className="test-card-header">
                    <div className="test-subject">{test.subject}</div>
                    <div className={`test-status ${test.status.toLowerCase()}`}>
                      {test.status === 'Submitted' ? 'Completed' : 'In Progress'}
                    </div>
                  </div>

                  <div className="test-card-body">
                    <div className="test-info">
                      <div className="info-row">
                        <span className="info-label">Questions:</span>
                        <span className="info-value">{test.totalQuestions}</span>
                      </div>
                      {test.score !== null && (
                        <div className="info-row">
                          <span className="info-label">Score:</span>
                          <span 
                            className="info-value score"
                            style={{ color: getScoreColor(test.score) }}
                          >
                            {test.score.toFixed(1)}%
                          </span>
                        </div>
                      )}
                      <div className="info-row">
                        <span className="info-label">Date:</span>
                        <span className="info-value">{formatDate(test.completedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="test-card-actions">
                    {test.status === 'Submitted' ? (
                      <>
                        <button
                          onClick={() => navigate(`/test/${test.testId}/results`)}
                          className="action-btn primary"
                        >
                          View Results
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const userId = localStorage.getItem('userId');
                              const response = await fetch(`/api/tests/${test.testId}/retry`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId }),
                              });
                              const data = await response.json();
                              navigate(`/test/${data.testId}`);
                            } catch (err) {
                              alert('Failed to retry test');
                            }
                          }}
                          className="action-btn secondary"
                        >
                          Retry
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
