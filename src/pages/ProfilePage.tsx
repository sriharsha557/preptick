import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './ProfilePage.css';

interface ProfileData {
  name: string;
  email: string;
  gender: string;
  schoolName: string;
  city: string;
  country: string;
  profilePicture: string;
  curriculum: string;
  grade: number;
  subjects: string[];
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    gender: '',
    schoolName: '',
    city: '',
    country: '',
    profilePicture: '',
    curriculum: 'CBSE',
    grade: 10,
    subjects: ['Mathematics', 'Science', 'English'],
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/users/${userId}/profile`);
      if (response.ok) {
        const data = await response.json();
        setProfileData({
          name: data.name || '',
          email: data.email || '',
          gender: data.gender || '',
          schoolName: data.schoolName || '',
          city: data.city || '',
          country: data.country || '',
          profilePicture: data.profilePicture || '',
          curriculum: data.curriculum || 'CBSE',
          grade: data.grade || 10,
          subjects: data.subjects ? JSON.parse(data.subjects) : ['Mathematics', 'Science', 'English'],
        });
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubjectToggle = (subject: string) => {
    setProfileData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In production, upload to cloud storage (S3, Cloudinary, etc.)
      // For now, create a local URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          profilePicture: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name,
          gender: profileData.gender,
          schoolName: profileData.schoolName,
          city: profileData.city,
          country: profileData.country,
          profilePicture: profileData.profilePicture,
          curriculum: profileData.curriculum,
          grade: profileData.grade,
          subjects: JSON.stringify(profileData.subjects),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <Header />
      
      <main className="profile-main">
        <div className="profile-container">
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information and preferences</p>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleSubmit} className="profile-form">
            {/* Profile Picture */}
            <div className="profile-picture-section">
              <div className="profile-picture-preview">
                {profileData.profilePicture ? (
                  <img src={profileData.profilePicture} alt="Profile" />
                ) : (
                  <div className="profile-picture-placeholder">
                    <span>{profileData.name ? profileData.name[0].toUpperCase() : '?'}</span>
                  </div>
                )}
              </div>
              <div className="profile-picture-upload">
                <label htmlFor="profilePicture" className="upload-button">
                  Change Picture
                </label>
                <input
                  type="file"
                  id="profilePicture"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Personal Information */}
            <div className="form-section">
              <h2 className="section-title">Personal Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    className="form-input"
                    disabled
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gender" className="form-label">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={profileData.gender}
                    onChange={handleInputChange}
                    className="form-select"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="PreferNotToSay">Prefer not to say</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="schoolName" className="form-label">School Name (Optional)</label>
                  <input
                    type="text"
                    id="schoolName"
                    name="schoolName"
                    value={profileData.schoolName}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your school name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city" className="form-label">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={profileData.city}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your city"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country" className="form-label">Country</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={profileData.country}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your country"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="form-section">
              <h2 className="section-title">Academic Information</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="curriculum" className="form-label">Curriculum *</label>
                  <select
                    id="curriculum"
                    name="curriculum"
                    value={profileData.curriculum}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="CBSE">CBSE</option>
                    <option value="Cambridge">Cambridge</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="grade" className="form-label">Grade/Class *</label>
                  <select
                    id="grade"
                    name="grade"
                    value={profileData.grade}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(grade => (
                      <option key={grade} value={grade}>
                        Class {grade}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Subjects *</label>
                <div className="subjects-grid">
                  {['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'].map(subject => (
                    <label key={subject} className="subject-checkbox">
                      <input
                        type="checkbox"
                        checked={profileData.subjects.includes(subject)}
                        onChange={() => handleSubjectToggle(subject)}
                      />
                      <span>{subject}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="save-button"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProfilePage;
