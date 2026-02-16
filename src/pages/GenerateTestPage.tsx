import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { apiGet, apiPost, getApiUrl, ApiError } from '../lib/api';
import { pdfDownloadService, DownloadState } from '../services/pdfDownloadService';
import { FEATURE_FLAGS } from '../config/features';
import './GenerateTestPage.css';

interface Topic {
  id: string;
  name: string;
}

const GenerateTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Only show Mathematics and English for now (Science and Hindi hidden for later)
  const [subjects] = useState(['Mathematics', 'English']);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Student metadata for PDF personalization (Requirement 9)
  const [userName, setUserName] = useState<string>('');

  // Custom topic state
  const [showCustomTopic, setShowCustomTopic] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationFeedback, setValidationFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    curriculum: 'CBSE',
    grade: 10,
    subject: 'Mathematics',
    selectedTopics: [] as string[],
    questionCount: 10,
    testMode: 'InAppExam' as 'InAppExam' | 'PDFDownload',
    includeAnswers: true,
  });

  // State for dual PDF downloads (Requirement 3.1)
  const [generatedTestId, setGeneratedTestId] = useState<string | null>(null);

  // PDF download state (Requirements: 5.1, 5.2, 5.3)
  const [downloadState, setDownloadState] = useState<DownloadState>({
    loading: false,
    error: null,
    success: false,
    progress: null,
  });

  // Fetch user profile on mount to auto-populate grade
  // Requirements: 1.1, 1.2, 1.4, 1.5
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await apiGet<{
          id: string;
          email: string;
          name: string;
          grade?: number;
          subjects?: string;
          curriculum?: string;
        }>('/api/users/profile');

        // Store user name for PDF personalization (Requirement 9)
        if (profile.name) {
          setUserName(profile.name);
        }

        // Auto-populate grade if available (Requirement 1.2)
        if (profile.grade) {
          setFormData(prev => ({
            ...prev,
            grade: profile.grade!,
          }));
        }

        // Auto-populate curriculum if available
        if (profile.curriculum) {
          setFormData(prev => ({
            ...prev,
            curriculum: profile.curriculum!,
          }));
        }
      } catch (error) {
        // Log error but don't block the user (Requirement 1.5)
        console.error('Failed to fetch profile:', error);
        // Leave grade field at default value for manual entry (Requirement 1.4)
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchUserProfile();
  }, []);

  // Subscribe to PDF download service state changes
  useEffect(() => {
    const unsubscribe = pdfDownloadService.subscribe((state) => {
      setDownloadState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Load topics for selected subject, curriculum, and grade
    loadTopics(formData.curriculum, formData.grade, formData.subject);
  }, [formData.subject, formData.curriculum, formData.grade]);

  const loadTopics = async (curriculum: string, grade: number, subject: string) => {
    try {
      setError(''); // Clear previous errors
      const data = await apiGet<{ 
        topics: Array<{ topicId: string; topicName: string }>;
        source?: string;
      }>(
        `/api/syllabus/${curriculum}/${grade}/${subject}/topics`
      );

      const loadedTopics = data.topics.map((t) => ({
        id: t.topicId,
        name: t.topicName,
      }));
      setTopics(loadedTopics);

      // If no topics found, show a helpful message
      if (loadedTopics.length === 0) {
        console.warn('No topics found for this subject/grade combination');
        setError('No topics available for this combination. Please try another subject or contact support.');
      } else {
        console.log(`Loaded ${loadedTopics.length} topics from ${data.source || 'unknown'} source`);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
      // Show detailed error message
      if (error instanceof Error) {
        setError(`Failed to load topics: ${error.message}. Please check your connection or try again later.`);
      } else {
        setError('Failed to load topics. Please check if the backend is running and try again.');
      }
      setTopics([]);
    }
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      subject: e.target.value,
      selectedTopics: [], // Reset topics when subject changes
    });
  };

  const handleTopicToggle = (topicId: string) => {
    // Split comma-separated IDs to handle deduplicated topics (Requirement 4.4, 4.5)
    const ids = topicId.split(',');
    const isSelected = ids.every(id => formData.selectedTopics.includes(id));
    
    setFormData({
      ...formData,
      selectedTopics: isSelected
        ? formData.selectedTopics.filter(id => !ids.includes(id))
        : [...formData.selectedTopics, ...ids],
    });
  };

  const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= 50) {
      setFormData({
        ...formData,
        questionCount: value,
      });
    }
  };

  const handleValidateCustomTopic = async () => {
    if (!customTopic.trim()) return;

    setIsValidating(true);
    setValidationFeedback(null);

    try {
      const result = await apiPost<{
        valid: boolean;
        feedback: string;
        topicId?: string;
        topicName?: string;
      }>('/api/topics/validate', {
        customTopic: customTopic.trim(),
        curriculum: formData.curriculum,
        grade: formData.grade,
        subject: formData.subject,
      });

      if (result.valid && result.topicId && result.topicName) {
        // Add the custom topic to the topics list
        const newTopic = { id: result.topicId, name: result.topicName };
        setTopics(prev => [...prev, newTopic]);

        // Auto-select the custom topic
        setFormData(prev => ({
          ...prev,
          selectedTopics: [...prev.selectedTopics, result.topicId!],
        }));

        setValidationFeedback({
          type: 'success',
          message: result.feedback,
        });

        // Clear the input
        setCustomTopic('');
      } else {
        setValidationFeedback({
          type: 'error',
          message: result.feedback,
        });
      }
    } catch (err) {
      console.error('Topic validation error:', err);
      setValidationFeedback({
        type: 'error',
        message: 'Failed to validate topic. Please try again.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/login');
        return;
      }

      // Validate form
      if (formData.selectedTopics.length === 0) {
        setError('Please select at least one topic');
        setLoading(false);
        return;
      }

      // Generate test using API utility
      const data = await apiPost<{ success: boolean; tests: Array<{ testId: string }> }>(
        '/api/tests/generate',
        {
          userId,
          subject: formData.subject,
          topics: formData.selectedTopics,
          questionCount: formData.questionCount,
          testCount: 1,
          testMode: formData.testMode,
        }
      );

      const testId = data.tests[0].testId;

      // If PDF mode, store test ID and show download buttons (Requirement 3.4)
      if (formData.testMode === 'PDFDownload') {
        setGeneratedTestId(testId);
      } else {
        // Navigate to test execution page for online exam
        navigate(`/test/${testId}`);
      }
    } catch (err) {
      console.error('Generate test error:', err);
      if (err instanceof ApiError) {
        // Show more detailed error message
        setError(err.message || 'Failed to generate test');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate test');
      }
    } finally {
      setLoading(false);
    }
  };

  // Download question paper PDF (Requirements: 3.5, 9, 5.1, 5.2, 5.3)
  const handleDownloadQuestions = async () => {
    if (!generatedTestId) return;
    
    try {
      // Reset any previous state
      pdfDownloadService.reset();
      
      // Download using the service (handles loading states automatically)
      const blob = await pdfDownloadService.downloadTestPDF(generatedTestId);
      
      // Trigger browser download
      pdfDownloadService.triggerDownload(blob, `test-${generatedTestId}-questions.pdf`);
    } catch (error) {
      // Error is already handled by the service
      console.error('Download failed:', error);
    }
  };

  // Download answer key PDF (Requirements: 3.6, 5.1, 5.2, 5.3)
  const handleDownloadAnswers = async () => {
    if (!generatedTestId) return;
    
    try {
      // Reset any previous state
      pdfDownloadService.reset();
      
      // Download using the service (handles loading states automatically)
      const blob = await pdfDownloadService.downloadAnswerKeyPDF(generatedTestId);
      
      // Trigger browser download
      pdfDownloadService.triggerDownload(blob, `test-${generatedTestId}-answers.pdf`);
    } catch (error) {
      // Error is already handled by the service
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="generate-test-page">
      <Header />
      
      <main className="generate-test-main">
        <div className="generate-test-container">
          <h1 className="page-title">Generate Mock Test</h1>
          <p className="page-subtitle">Create a customized test based on your syllabus</p>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="generate-test-form">
            <div className="form-section">
              <label htmlFor="curriculum" className="form-label">Curriculum</label>
              <select
                id="curriculum"
                value={formData.curriculum}
                onChange={(e) => setFormData({ ...formData, curriculum: e.target.value, selectedTopics: [] })}
                className="form-select"
              >
                <option value="CBSE">CBSE</option>
                <option value="Cambridge">Cambridge</option>
              </select>
            </div>

            <div className="form-section">
              <label htmlFor="grade" className="form-label">Grade/Class</label>
              <select
                id="grade"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value), selectedTopics: [] })}
                className="form-select"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(grade => (
                  <option key={grade} value={grade}>
                    Class {grade}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-section">
              <label htmlFor="subject" className="form-label">Subject</label>
              <select
                id="subject"
                value={formData.subject}
                onChange={handleSubjectChange}
                className="form-select"
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-section">
              <label className="form-label">Topics</label>
              <div className="topics-grid">
                {topics.map(topic => {
                  // Handle comma-separated IDs for deduplicated topics (Requirement 4.4, 4.5)
                  const ids = topic.id.split(',');
                  const isSelected = ids.every(id => formData.selectedTopics.includes(id));
                  
                  return (
                    <label key={topic.id} className={`topic-checkbox ${topic.id.startsWith('custom-') ? 'custom-topic-chip' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTopicToggle(topic.id)}
                      />
                      <span>{topic.name}</span>
                    </label>
                  );
                })}
              </div>
              {formData.selectedTopics.length === 0 && (
                <p className="help-text">Select at least one topic</p>
              )}

              {/* Custom Topic Section - Only show if feature flag is enabled (Requirements 5.2, 5.3, 5.4) */}
              {FEATURE_FLAGS.CUSTOM_TOPICS_ENABLED && (
                <div className="custom-topic-section">
                  <p className="help-text">
                    Can't find your topic? Add a custom topic and we'll validate it against the syllabus.
                  </p>
                  <button
                    type="button"
                    className="custom-topic-toggle"
                    onClick={() => {
                      setShowCustomTopic(!showCustomTopic);
                      setValidationFeedback(null);
                    }}
                  >
                    {showCustomTopic ? '−' : '+'} Add Custom Topic
                  </button>

                  {showCustomTopic && (
                    <div className="custom-topic-form">
                      <input
                        type="text"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        placeholder="Enter a specific topic name..."
                        className="custom-topic-input"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleValidateCustomTopic();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleValidateCustomTopic}
                        disabled={isValidating || !customTopic.trim()}
                        className="validate-button"
                      >
                        {isValidating ? 'Validating...' : 'Validate & Add'}
                      </button>
                      {validationFeedback && (
                        <div className={`validation-feedback ${validationFeedback.type}`}>
                          {validationFeedback.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="form-section">
              <label htmlFor="questionCount" className="form-label">
                Number of Questions: {formData.questionCount}
              </label>
              <input
                type="range"
                id="questionCount"
                min="5"
                max="50"
                value={formData.questionCount}
                onChange={handleQuestionCountChange}
                className="form-range"
              />
              <div className="range-labels">
                <span>5</span>
                <span>50</span>
              </div>
            </div>

            <div className="form-section">
              <label className="form-label">Test Mode</label>
              <div className="test-mode-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="testMode"
                    value="InAppExam"
                    checked={formData.testMode === 'InAppExam'}
                    onChange={(e) => setFormData({ ...formData, testMode: e.target.value as 'InAppExam' | 'PDFDownload' })}
                  />
                  <span>Take Exam Online</span>
                  <p className="option-description">Take the test directly in the browser with instant results</p>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="testMode"
                    value="PDFDownload"
                    checked={formData.testMode === 'PDFDownload'}
                    onChange={(e) => setFormData({ ...formData, testMode: e.target.value as 'InAppExam' | 'PDFDownload' })}
                  />
                  <span>Download as PDF</span>
                  <p className="option-description">Download the test for offline practice</p>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="generate-button"
              disabled={loading || formData.selectedTopics.length === 0 || (formData.testMode === 'PDFDownload' && generatedTestId !== null)}
            >
              {loading ? 'Generating Test...' : formData.testMode === 'PDFDownload' ? 'Generate Test' : 'Generate Test'}
            </button>
          </form>

          {/* Dual PDF Download Buttons (Requirements: 3.4, 3.5, 3.6, 5.1, 5.2, 5.3) */}
          {formData.testMode === 'PDFDownload' && generatedTestId && (
            <div className="pdf-download-section">
              <h2>Test Generated Successfully!</h2>
              <p>Download your test materials below:</p>
              
              {/* Loading/Error/Success Messages */}
              {downloadState.loading && (
                <div className="download-status loading">
                  <div className="spinner"></div>
                  <span>Generating PDF...</span>
                  {downloadState.progress && (
                    <div className="progress-message">{downloadState.progress}</div>
                  )}
                </div>
              )}
              
              {downloadState.error && (
                <div className="download-status error">
                  {downloadState.error}
                </div>
              )}
              
              {downloadState.success && (
                <div className="download-status success">
                  PDF downloaded successfully
                </div>
              )}
              
              <div className="download-buttons">
                <button
                  onClick={handleDownloadQuestions}
                  className="download-button download-questions"
                  disabled={downloadState.loading}
                >
                  📄 Download Question Paper
                </button>
                <button
                  onClick={handleDownloadAnswers}
                  className="download-button download-answers"
                  disabled={downloadState.loading}
                >
                  ✅ Download Answer Key
                </button>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="back-button"
              >
                Back to Dashboard
              </button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default GenerateTestPage;
