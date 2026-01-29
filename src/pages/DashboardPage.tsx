import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './DashboardPage.css';

interface UserProfile {
  userId: string;
  email: string;
  curriculum: string;
  grade: number;
  subjects: string[];
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');

    if (!token || !userId) {
      navigate('/login');
      return;
    }

    fetchProfile(userId, token);
  }, [navigate]);

  const fetchProfile = async (userId: string, token: string) => {
    try {
      const response = await fetch(`/api/auth/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        navigate('/login');
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <Header />
        <main className="dashboard-main">
          <div className="loading">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Header />
      
      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="dashboard-header">
            <h1 className="dashboard-title">Welcome to Your Dashboard</h1>
            <button onClick={handleLogout} className="logout-button">Logout</button>
          </div>
          
          {profile && (
            <div className="profile-card">
              <h2 className="profile-title">Your Profile</h2>
              <div className="profile-info">
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{profile.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Curriculum:</span>
                  <span className="info-value">{profile.curriculum}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Grade:</span>
                  <span className="info-value">{profile.grade}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Subjects:</span>
                  <span className="info-value">{profile.subjects.join(', ')}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="features-grid">
            <div className="feature-card">
              <h3 className="feature-title">Generate Mock Test</h3>
              <p className="feature-description">Create customized mock tests based on your syllabus</p>
              <button className="feature-button">Coming Soon</button>
            </div>
            
            <div className="feature-card">
              <h3 className="feature-title">View Test History</h3>
              <p className="feature-description">Track your performance and progress over time</p>
              <button className="feature-button">Coming Soon</button>
            </div>
            
            <div className="feature-card">
              <h3 className="feature-title">Performance Analytics</h3>
              <p className="feature-description">Analyze your strengths and weak topics</p>
              <button className="feature-button">Coming Soon</button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DashboardPage;
