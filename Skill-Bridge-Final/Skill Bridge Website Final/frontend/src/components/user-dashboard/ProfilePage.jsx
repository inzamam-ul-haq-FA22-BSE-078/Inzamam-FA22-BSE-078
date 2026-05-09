import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './ProfilePage.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      navigate('/login');
      return;
    }

    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Get profile data from localStorage
      const savedProfile = localStorage.getItem(`profile_${parsedUser.email}`);
      if (savedProfile) {
        setProfileData(JSON.parse(savedProfile));
      }
    }

    setLoading(false);
  }, [navigate]);

  const handleEditProfile = () => {
    navigate('/edit-profile');
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };


  return (
    <div className="profile-page-container">
      {/* Header Navigation */}
      <div className="profile-navbar">
        <button className="back-btn" onClick={handleGoBack}>
          <span>←</span> Back to Dashboard
        </button>
        <h1 className="profile-title">My Profile</h1>
        <div style={{ width: '150px' }} />
      </div>

      {/* Main Profile Content */}
      <div className="profile-content">
        {profileData ? (
          <>
            {/* Hero Section with Profile Picture */}
            <motion.div
              className="profile-hero"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="hero-background" />
              
              <div className="hero-content">
                <div className="profile-image-wrapper">
                  <img
                    src={profileData?.profilePicture || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user?.email}
                    alt="Profile"
                    className="profile-image-hero"
                  />
                </div>

                <div className="hero-info">
                  <h1 className="hero-name">{profileData?.fullName || user?.name || 'User'}</h1>
                  <p className="hero-email">{user?.email}</p>
                  
                  <div className="hero-badges">
                    {profileData?.dateOfBirth && (
                      <span className="badge">🎂 {calculateAge(profileData.dateOfBirth)} years old</span>
                    )}
                    {profileData?.country && (
                      <span className="badge">📍 {profileData.country}</span>
                    )}
                    {profileData?.gender && (
                      <span className="badge">👤 {profileData.gender[0].toUpperCase() + profileData.gender.slice(1)}</span>
                    )}
                  </div>

                  <motion.button
                    className="edit-profile-btn-hero"
                    onClick={handleEditProfile}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ✏️ Edit Profile
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Main Profile Card */}
            <motion.div
              className="profile-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {/* Contact Information */}
              <div className="profile-section">
                <h3 className="section-title">📞 Contact Information</h3>
                <div className="info-grid-3col">
                  <div className="info-card">
                    <div className="info-icon">📱</div>
                    <span className="info-label">Phone</span>
                    <span className="info-value">{profileData.phoneNo || 'Not provided'}</span>
                  </div>
                  <div className="info-card">
                    <div className="info-icon">🌍</div>
                    <span className="info-label">Country</span>
                    <span className="info-value">{profileData.country || 'Not provided'}</span>
                  </div>
                  <div className="info-card">
                    <div className="info-icon">📍</div>
                    <span className="info-label">Address</span>
                    <span className="info-value">{profileData.address || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Skills Section */}
              {profileData.skillsDescription && (
                <div className="profile-section">
                  <h3 className="section-title">🎯 Skills & Expertise</h3>
                  <div className="skills-box">
                    <p className="skills-text">{profileData.skillsDescription}</p>
                  </div>
                </div>
              )}

              {/* Bio Section */}
              {profileData.bio && (
                <div className="profile-section">
                  <h3 className="section-title">📝 Bio</h3>
                  <div className="about-box">
                    <p className="about-text">{profileData.bio}</p>
                  </div>
                </div>
              )}

              {/* Portfolio & Social Links */}
              {(profileData.portfolioLinks?.length > 0 || profileData.socialMediaLinks?.length > 0) && (
                <div className="profile-section">
                  <h3 className="section-title">🔗 Links</h3>
                  <div className="links-grid-2col">
                    {profileData.portfolioLinks && profileData.portfolioLinks.length > 0 && (
                      <div className="links-column">
                        <h4 className="links-subtitle">💼 Portfolio</h4>
                        <div className="links-list">
                          {profileData.portfolioLinks.map((link, idx) => (
                            link && (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="profile-link-item"
                              >
                                <span className="link-icon">🌐</span>
                                <span className="link-text">{link.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                <span className="link-arrow">→</span>
                              </a>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                    {profileData.socialMediaLinks && profileData.socialMediaLinks.length > 0 && (
                      <div className="links-column">
                        <h4 className="links-subtitle">📱 Social Media</h4>
                        <div className="links-list">
                          {profileData.socialMediaLinks.map((link, idx) => (
                            link && (
                              <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="profile-link-item"
                              >
                                <span className="link-icon">📱</span>
                                <span className="link-text">{link.replace(/^https?:\/\/(www\.)?/, '')}</span>
                                <span className="link-arrow">→</span>
                              </a>
                            )
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Education */}
              {profileData.education && profileData.education.length > 0 && (
                <div className="profile-section">
                  <h3 className="section-title">🎓 Education</h3>
                  <div className="education-timeline">
                    {profileData.education.map((edu, idx) => (
                      edu.degree && (
                        <motion.div
                          key={idx}
                          className="education-timeline-item"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <div className="timeline-dot" />
                          <div className="timeline-content">
                            <div className="edu-degree-badge">{edu.degree}</div>
                            <h4 className="edu-institute">{edu.institute}</h4>
                            <p className="edu-year">Completed: {edu.completedYear}</p>
                          </div>
                        </motion.div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {profileData.achievements && (
                <div className="profile-section">
                  <h3 className="section-title">🏆 Achievements & Certifications</h3>
                  <div className="achievements-box">
                    <p className="achievements-text">{profileData.achievements}</p>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        ) : (
          <motion.div
            className="profile-card no-profile-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="empty-state">
              <div className="empty-icon">👤</div>
              <h3>No Profile Data</h3>
              <p>Complete your profile to showcase your skills and experience</p>
              <motion.button
                className="edit-profile-btn-hero"
                onClick={handleEditProfile}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✏️ Create Your Profile
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
