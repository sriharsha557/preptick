import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { apiGet } from '../lib/api';
import './DashboardPage.css';

interface UserProfile {
  userId: string;
  email: string;
  name?: string;
  gender?: string;
  schoolName?: string;
  city?: string;
  country?: string;
  profilePicture?: string;
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
    const userEmail = localStorage.getItem('userEmail');

    console.log('Dashboard - Checking auth:', { token: !!token, userId, userEmail });

    if (!token || !userId) {
      console.log('No token or userId, redirecting to login');
      navigate('/login');
      return;
    }

    fetchProfile(userId, userEmail || '');
  }, [navigate]);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      console.log('Fetching profile for:', userId, email);

      // Fetch profile from API using the authenticated API utility
      const data = await apiGet<{
        id: string;
        email: string;
        name?: string;
        gender?: string;
        schoolName?: string;
        city?: string;
        country?: string;
        profilePicture?: string;
        curriculum: string;
        grade: number;
        subjects?: string;
      }>(`/api/users/${userId}/profile`);

      const profileData: UserProfile = {
        userId: data.id,
        email: data.email,
        name: data.name,
        gender: data.gender,
        schoolName: data.schoolName,
        city: data.city,
        country: data.country,
        profilePicture: data.profilePicture,
        curriculum: data.curriculum,
        grade: data.grade,
        subjects: data.subjects ? JSON.parse(data.subjects) : []
      };

      setProfile(profileData);
      console.log('Profile loaded:', profileData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      // Fallback to localStorage data on error
      const storedEmail = localStorage.getItem('userEmail');
      const mockProfile: UserProfile = {
        userId: userId,
        email: storedEmail || email,
        curriculum: 'CBSE',
        grade: 10,
        subjects: ['Mathematics', 'Science', 'English']
      };
      setProfile(mockProfile);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    console.log('Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('supabase_session');
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
              <div className="profile-header">
                <div className="profile-avatar">
                  {profile.profilePicture ? (
                    <img src={profile.profilePicture} alt="Profile" />
                  ) : (
                    <div className="avatar-placeholder">
                      {profile.name ? profile.name[0].toUpperCase() : profile.email[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="profile-details">
                  <h2 className="profile-name">{profile.name || 'Student'}</h2>
                  <p className="profile-email">{profile.email}</p>
                </div>
                <button 
                  className="edit-profile-button"
                  onClick={() => navigate('/profile')}
                >
                  Edit Profile
                </button>
              </div>
              
              <div className="profile-info">
                {profile.gender && (
                  <div className="info-item">
                    <span className="info-label">Gender:</span>
                    <span className="info-value">{profile.gender}</span>
                  </div>
                )}
                {profile.schoolName && (
                  <div className="info-item">
                    <span className="info-label">School:</span>
                    <span className="info-value">{profile.schoolName}</span>
                  </div>
                )}
                {(profile.city || profile.country) && (
                  <div className="info-item">
                    <span className="info-label">Location:</span>
                    <span className="info-value">
                      {[profile.city, profile.country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">Curriculum:</span>
                  <span className="info-value">{profile.curriculum}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Grade:</span>
                  <span className="info-value">Class {profile.grade}</span>
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
              <button 
                className="feature-button"
                onClick={() => navigate('/generate-test')}
              >
                Generate Test
              </button>
            </div>
            
            <div className="feature-card">
              <h3 className="feature-title">View Test History</h3>
              <p className="feature-description">Track your performance and progress over time</p>
              <button 
                className="feature-button"
                onClick={() => navigate('/history')}
              >
                View History
              </button>
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
