import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './AuthPages.css';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    curriculum: 'CBSE',
    grade: '5',
    subjects: [] as string[],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const subjectOptions = ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubjectChange = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.subjects.length === 0) {
      setError('Please select at least one subject');
      return;
    }

    setLoading(true);

    try {
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            curriculum: formData.curriculum,
            grade: parseInt(formData.grade),
            subjects: formData.subjects,
          }
        }
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (authData.user) {
        // Create user profile in Supabase database
        const { error: profileError } = await supabase
          .from('User')
          .insert([
            {
              id: authData.user.id,
              email: formData.email,
              passwordHash: '', // Managed by Supabase Auth
              curriculum: formData.curriculum,
              grade: parseInt(formData.grade),
              subjects: JSON.stringify(formData.subjects),
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            }
          ]);

        if (profileError) {
          setError(profileError.message || 'Failed to create user profile');
          return;
        }

        alert('Registration successful! Please check your email to verify your account.');
        navigate('/login');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Header />
      
      <main className="auth-main">
        <div className="auth-container">
          <div className="auth-card">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Start your exam preparation journey</p>
            
            {error && <div className="auth-error">{error}</div>}
            
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  minLength={8}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="curriculum" className="form-label">Curriculum</label>
                  <select
                    id="curriculum"
                    name="curriculum"
                    value={formData.curriculum}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="Cambridge">Cambridge</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="grade" className="form-label">Grade</label>
                  <select
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className="form-input"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">Subjects</label>
                <div className="checkbox-group">
                  {subjectOptions.map(subject => (
                    <label key={subject} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => handleSubjectChange(subject)}
                        className="checkbox-input"
                      />
                      <span>{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </form>
            
            <p className="auth-link-text">
              Already have an account? <Link to="/login" className="auth-link">Login here</Link>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default RegisterPage;
