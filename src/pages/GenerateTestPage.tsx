import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './GenerateTestPage.css';

interface Topic {
  id: string;
  name: string;
}

const GenerateTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [subjects] = useState(['Mathematics', 'Science', 'English']);
  const [topics, setTopics] = useState<Topic[]>([]);
  
  const [formData, setFormData] = useState({
    curriculum: 'CBSE',
    grade: 10,
    subject: 'Mathematics',
    selectedTopics: [] as string[],
    questionCount: 10,
    testMode: 'InAppExam' as 'InAppExam' | 'PDFDownload',
  });

  useEffect(() => {
    // Load topics for selected subject, curriculum, and grade
    loadTopics(formData.curriculum, formData.grade, formData.subject);
  }, [formData.subject, formData.curriculum, formData.grade]);

  const loadTopics = async (curriculum: string, grade: number, subject: string) => {
    try {
      const response = await fetch(`/api/syllabus/${curriculum}/${grade}/${subject}/topics`);
      
      if (response.ok) {
        const data = await response.json();
        const loadedTopics = data.topics.map((t: any) => ({
          id: t.topicId,
          name: t.topicName,
        }));
        setTopics(loadedTopics);
      } else {
        // Fallback to mock topics if API fails
        console.warn('Failed to load topics from API, using mock data');
        useMockTopics(subject);
      }
    } catch (error) {
      console.error('Error loading topics:', error);
      // Fallback to mock topics
      useMockTopics(subject);
    }
  };

  const useMockTopics = (subject: string) => {
    const mockTopics: Record<string, Topic[]> = {
      Mathematics: [
        { id: 'math-algebra', name: 'Algebra' },
        { id: 'math-geometry', name: 'Geometry' },
        { id: 'math-trigonometry', name: 'Trigonometry' },
        { id: 'math-calculus', name: 'Calculus' },
      ],
      Science: [
        { id: 'sci-physics', name: 'Physics' },
        { id: 'sci-chemistry', name: 'Chemistry' },
        { id: 'sci-biology', name: 'Biology' },
      ],
      English: [
        { id: 'eng-grammar', name: 'Grammar' },
        { id: 'eng-literature', name: 'Literature' },
        { id: 'eng-writing', name: 'Writing' },
      ],
    };

    setTopics(mockTopics[subject] || []);
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({
      ...formData,
      subject: e.target.value,
      selectedTopics: [], // Reset topics when subject changes
    });
  };

  const handleTopicToggle = (topicId: string) => {
    const isSelected = formData.selectedTopics.includes(topicId);
    setFormData({
      ...formData,
      selectedTopics: isSelected
        ? formData.selectedTopics.filter(id => id !== topicId)
        : [...formData.selectedTopics, topicId],
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

      // Generate test
      const response = await fetch('/api/tests/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          subject: formData.subject,
          topics: formData.selectedTopics,
          questionCount: formData.questionCount,
          testCount: 1,
          testMode: formData.testMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate test');
      }

      const data = await response.json();
      const testId = data.tests[0].testId;

      // If PDF mode, download the PDF
      if (formData.testMode === 'PDFDownload') {
        window.open(`/api/tests/${testId}/pdf?includeAnswers=true`, '_blank');
        navigate('/dashboard');
      } else {
        // Navigate to test execution page for online exam
        navigate(`/test/${testId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate test');
      console.error('Generate test error:', err);
    } finally {
      setLoading(false);
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
                {topics.map(topic => (
                  <label key={topic.id} className="topic-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.selectedTopics.includes(topic.id)}
                      onChange={() => handleTopicToggle(topic.id)}
                    />
                    <span>{topic.name}</span>
                  </label>
                ))}
              </div>
              {formData.selectedTopics.length === 0 && (
                <p className="help-text">Select at least one topic</p>
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
                  <p className="option-description">Download the test with answer key for offline practice</p>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="generate-button"
              disabled={loading || formData.selectedTopics.length === 0}
            >
              {loading ? 'Generating Test...' : formData.testMode === 'PDFDownload' ? 'Generate & Download PDF' : 'Generate Test'}
            </button>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default GenerateTestPage;
