import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './TestResultsPage.css';

interface TopicScore {
  topicId: string;
  topicName: string;
  correct: number;
  total: number;
  percentage: number;
}

interface WeakTopic {
  topicId: string;
  topicName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
}

interface QuestionResult {
  questionId: string;
  questionText: string;
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

interface TestResults {
  evaluation: {
    evaluationId: string;
    overallScore: number;
    correctCount: number;
    totalCount: number;
    topicScores: TopicScore[];
    evaluatedAt: Date;
  };
  report: {
    reportId: string;
    weakTopics: WeakTopic[];
    suggestions: string[];
    generatedAt: Date;
  };
  questions: QuestionResult[];
}

const TestResultsPage: React.FC = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState<TestResults | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    loadResults();
  }, [testId]);

  const loadResults = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/tests/${testId}/results?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load results');
      }

      const data = await response.json();
      setResults(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/tests/${testId}/pdf?includeAnswers=true`);
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-${testId}-results.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  const handleRetryTest = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/tests/${testId}/retry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate retry test');
      }

      const data = await response.json();
      navigate(`/test/${data.testId}`);
    } catch (err) {
      alert('Failed to generate retry test');
    }
  };

  if (loading) {
    return (
      <div className="test-results-page">
        <Header />
        <main className="results-main">
          <div className="loading">Loading results...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="test-results-page">
        <Header />
        <main className="results-main">
          <div className="error-container">
            <h2>Error</h2>
            <p>{error || 'Results not found'}</p>
            <button onClick={() => navigate('/dashboard')} className="back-button">
              Back to Dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { evaluation, report, questions } = results;
  const scorePercentage = evaluation.overallScore;
  const scoreColor = scorePercentage >= 80 ? '#4caf50' : scorePercentage >= 60 ? '#ff9800' : '#f44336';

  return (
    <div className="test-results-page">
      <Header />
      
      <main className="results-main">
        <div className="results-container">
          <h1 className="results-title">Test Results</h1>

          {/* Overall Score Card */}
          <div className="score-card">
            <div className="score-circle" style={{ borderColor: scoreColor }}>
              <div className="score-value" style={{ color: scoreColor }}>
                {scorePercentage.toFixed(1)}%
              </div>
              <div className="score-label">Overall Score</div>
            </div>
            <div className="score-details">
              <div className="score-stat">
                <span className="stat-label">Correct Answers</span>
                <span className="stat-value">{evaluation.correctCount} / {evaluation.totalCount}</span>
              </div>
              <div className="score-stat">
                <span className="stat-label">Incorrect Answers</span>
                <span className="stat-value">{evaluation.totalCount - evaluation.correctCount}</span>
              </div>
            </div>
          </div>

          {/* Topic-wise Performance */}
          <div className="section-card">
            <h2 className="section-title">Topic-wise Performance</h2>
            <div className="topics-list">
              {evaluation.topicScores.map(topic => (
                <div key={topic.topicId} className="topic-item">
                  <div className="topic-header">
                    <span className="topic-name">{topic.topicName}</span>
                    <span className="topic-score">
                      {topic.correct}/{topic.total} ({topic.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="topic-progress-bar">
                    <div
                      className="topic-progress-fill"
                      style={{
                        width: `${topic.percentage}%`,
                        background: topic.percentage >= 60 ? '#4caf50' : '#f44336',
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Weak Topics */}
          {report.weakTopics.length > 0 && (
            <div className="section-card weak-topics-card">
              <h2 className="section-title">Areas for Improvement</h2>
              <div className="weak-topics-list">
                {report.weakTopics.map(topic => (
                  <div key={topic.topicId} className="weak-topic-item">
                    <div className="weak-topic-icon">⚠️</div>
                    <div className="weak-topic-info">
                      <div className="weak-topic-name">{topic.topicName}</div>
                      <div className="weak-topic-score">
                        {topic.score}/{topic.totalQuestions} correct ({topic.percentage.toFixed(1)}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvement Suggestions */}
          {report.suggestions.length > 0 && (
            <div className="section-card">
              <h2 className="section-title">Improvement Suggestions</h2>
              <ul className="suggestions-list">
                {report.suggestions.map((suggestion, index) => (
                  <li key={index} className="suggestion-item">{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Question-by-Question Review */}
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">Question Review</h2>
              <button
                onClick={() => setShowAnswers(!showAnswers)}
                className="toggle-button"
              >
                {showAnswers ? 'Hide Answers' : 'Show Answers'}
              </button>
            </div>

            {showAnswers && (
              <div className="questions-review">
                {questions.map((q, index) => (
                  <div
                    key={q.questionId}
                    className={`question-review-item ${q.isCorrect ? 'correct' : 'incorrect'}`}
                  >
                    <div className="question-review-header">
                      <span className="question-review-number">Question {index + 1}</span>
                      <span className={`question-review-status ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                        {q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                      </span>
                    </div>
                    <div className="question-review-text">{q.questionText}</div>
                    <div className="answer-comparison">
                      <div className="answer-row">
                        <span className="answer-label">Your Answer:</span>
                        <span className={`answer-value ${q.isCorrect ? 'correct' : 'incorrect'}`}>
                          {q.userAnswer || '(Not answered)'}
                        </span>
                      </div>
                      {!q.isCorrect && (
                        <div className="answer-row">
                          <span className="answer-label">Correct Answer:</span>
                          <span className="answer-value correct">{q.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button onClick={handleDownloadPDF} className="action-button secondary">
              📄 Download PDF
            </button>
            <button onClick={handleRetryTest} className="action-button primary">
              🔄 Retry Test
            </button>
            <button onClick={() => navigate('/dashboard')} className="action-button">
              🏠 Back to Dashboard
            </button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TestResultsPage;
