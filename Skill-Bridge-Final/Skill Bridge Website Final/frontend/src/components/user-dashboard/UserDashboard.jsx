import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './UserDashboard.css';
import { usePresence, formatLastSeen } from '../../utils/presence';
import AddSkill from './AddSkill';
import EditSkill from './EditSkill';
import Inbox from './Inbox';
import MySkills from './MySkills';
import ProjectCollaboration from './ProjectCollaboration';

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

const UserDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isSearcher, setIsSearcher] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      navigate('/login');
      return;
    }

    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.isAdmin) {
        navigate('/admin-dashboard');
        return;
      }
      setUser(parsedUser);
    }

    // Activate tab from query (e.g., /dashboard?tab=inbox&conv=...)
    try {
      const params = new URLSearchParams(location.search);
      const tab = params.get('tab');
      if (tab) {
        setActiveTab(tab);
      } else if (location.pathname.includes('skills')) {
        setActiveTab('skills');
      }
    } catch (err) {
      console.error('Error parsing query params:', err);
    }

    setLoading(false);
  }, [location, navigate]);

  // Handle toggle switch change
  useEffect(() => {
    if (isSearcher) {
      navigate('/skills');
    }
  }, [isSearcher, navigate]);

  const handleToggle = () => {
    setIsSearcher(!isSearcher);
  };

  const handleLogout = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      localStorage.setItem(`presence_${parsed.email}`, JSON.stringify({ status: 'offline', lastSeen: new Date().toISOString() }));
      // notify socket if available
      if (window.__SB_SOCKET) {
        try {
          window.__SB_SOCKET.emit('presence:change', { status: 'offline' });
          window.__SB_SOCKET.disconnect();
        } catch (e) {}
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-large"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const navItems = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'inbox', label: 'Inbox', icon: '📬' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'skills', label: 'Skills', icon: '🎯' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'add-skill', label: '+ Add Skill', icon: '➕' },
  ];

  const renderContent = () => {
    // Check if we're trying to edit a skill
    const q = new URLSearchParams(location.search);
    const editSkillId = q.get('editSkill');
    if (editSkillId) {
      return <EditSkill skillId={editSkillId} />;
    }

    switch (activeTab) {
      case 'profile':
        return <ProfilePage user={user} />;
      case 'inbox':
        return <Inbox user={user} />;
      case 'reports':
        return <ReportsPage user={user} />;
      case 'skills':
        return <SkillsPage user={user} />;
      case 'projects':
        return <ProjectCollaboration user={user} />;
      case 'add-skill':
        return <AddSkill user={user} />;
      default:
        return <ProfilePage user={user} />;
    }
  };

  return (
    <div className="user-dashboard-container">
      {/* Modern Navbar */}
      <motion.nav className="modern-navbar" initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}>
        <div className="navbar-left">
          <div className="navbar-logo">
            <span className="logo-icon">🌉</span>
            <span className="logo-text">SkillBridge</span>
          </div>
        </div>

        <div className="navbar-center">
          <ul className="nav-items-users">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`nav-item-users ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  {/* <span className="nav-icon-users">{item.icon}</span> */}
                  <span className="nav-label-users">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="navbar-right">
          <div className="toggle-wrapper">
            <label className="toggle-label">Become Searcher</label>
            <div className={`toggle-switch ${isSearcher ? 'active' : ''}`} onClick={handleToggle}>
              <div className="toggle-circle"></div>
            </div>
          </div>
          <button className="logout-user-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </motion.nav>

      {/* Content Area */}
      <motion.div
        className="dashboard-content-area"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        key={activeTab}
      >
        {renderContent()}
      </motion.div>
    </div>
  );
};

// Profile Page Component
const ProfilePage = ({ user }) => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [skillsViews, setSkillsViews] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const getPresenceStatus = (email) => {
    if (!email) return null;
    const val = localStorage.getItem(`presence_${email}`);
    if (val) {
      try {
        return JSON.parse(val);
      } catch (e) {
        return null;
      }
    }
    if (profileData?.availabilityStatus) return { status: profileData.availabilityStatus };
    return null;
  };

  const presence = usePresence(profileData?.email || user?.email);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        
        if (data.success && data.user) {
          setProfileData(data.user);
          // prime presence cache
          if (data.user.email) {
            const status = data.user.availabilityStatus || 'offline';
            const lastSeen = data.user.lastSeen || new Date().toISOString();
            localStorage.setItem(`presence_${data.user.email}`, JSON.stringify({ status, lastSeen }));
            window.dispatchEvent(new CustomEvent('presence:update', { detail: { email: data.user.email, status, lastSeen } }));
          }
          // Load skills views from localStorage
          const savedSkillsViews = localStorage.getItem(`skillsViews_${user?.email}`);
          if (savedSkillsViews) {
            setSkillsViews(JSON.parse(savedSkillsViews));
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user?.email]);

  const handleMediaUpload = (e) => {
    const files = Array.from(e.target.files);
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const mediaItem = {
          id: Date.now() + Math.random(),
          type: file.type.startsWith('video') ? 'video' : 'image',
          src: reader.result,
          fileName: file.name,
          uploadedAt: new Date().toLocaleString(),
        };
        
        const newSkillsViews = [...skillsViews, mediaItem];
        setSkillsViews(newSkillsViews);
        localStorage.setItem(`skillsViews_${user?.email}`, JSON.stringify(newSkillsViews));
      };
      reader.readAsDataURL(file);
    });

    setShowUploadModal(false);
  };

  const removeMedia = (id) => {
    const filtered = skillsViews.filter(item => item.id !== id);
    setSkillsViews(filtered);
    localStorage.setItem(`skillsViews_${user?.email}`, JSON.stringify(filtered));
  };

  // Social Media Icons
  const getSocialMediaIcon = (platform) => {
    const icons = {
      instagram: '/instagram logo.jpg',
      facebook: '/facebook logo.jpg',
      tiktok: '/tiktok logo.png',
      linkedin: '/linkedIn logo.png',
      fiverr: '/fiverr logo.png',
    };
    return icons[platform?.toLowerCase()] || null;
  };

  const getSocialMediaLink = (platform) => {
    if (profileData?.socialMediaLinks) {
      if (typeof profileData.socialMediaLinks === 'object' && !Array.isArray(profileData.socialMediaLinks)) {
        return profileData.socialMediaLinks[platform?.toLowerCase()];
      }
      const links = Array.isArray(profileData.socialMediaLinks) ? profileData.socialMediaLinks : [];
      return links.find(link => link?.toLowerCase().includes(platform?.toLowerCase()));
    }
    return null;
  };

  return (
    <motion.div
      className="page-content profile-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {loading ? (
        <div className="loading-spinner">Loading profile...</div>
      ) : profileData ? (
        <>
          {/* Hero Section - Restored */}
          <motion.div
            className="profile-hero-section"
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
                {(() => {
                  const pres = getPresenceStatus(profileData?.email || user?.email);
                  const cls = pres ? pres.status : (profileData?.availabilityStatus || 'offline');
                  return <div className={`status-indicator ${cls}`} />;
                })()}
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
                  {presence ? (
                    <span className={`badge status-badge ${presence.status === 'online' ? 'online' : 'offline'}`}>
                      {presence.status === 'online' ? `🟢 Online` : `🔴 Offline`} {presence.lastSeen ? `· ${formatLastSeen(presence.lastSeen)}` : ''}
                    </span>
                  ) : null}
                </div>

                {/* Social Media Links */}
                <div className="hero-social-media">
                  {['instagram', 'facebook', 'tiktok', 'linkedin', 'fiverr'].map((platform) => {
                    const link = getSocialMediaLink(platform);
                    const iconPath = getSocialMediaIcon(platform);
                    return link && iconPath ? (
                      <a
                        key={platform}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-media-link"
                        title={platform}
                      >
                        <img src={iconPath} alt={platform} className="social-media-icon-img" />
                      </a>
                    ) : null;
                  })}
                </div>

                <motion.button
                  className="edit-profile-btn-hero"
                  onClick={() => navigate('/edit-profile')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ✏️ Edit Profile
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Profile Details */}
          <motion.div
            className="profile-details-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Contact Information */}
            {(profileData?.phoneNo || profileData?.country || profileData?.address) && (
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
            )}

            {/* Skills & Expertise */}
            {profileData?.skillsDescription && (
              <div className="profile-section">
                <h3 className="section-title">🎯 Skills & Expertise</h3>
                <div className="skills-box">
                  <p className="skills-text">{profileData.skillsDescription}</p>
                </div>
              </div>
            )}

            {/* Bio Section */}
            {profileData?.bio && (
              <div className="profile-section">
                <h3 className="section-title">📝 Bio</h3>
                <div className="about-box">
                  <p className="about-text">{profileData.bio}</p>
                </div>
              </div>
            )}

            {/* Education */}
            {profileData?.education && profileData.education.length > 0 && (
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
            {profileData?.achievements && (
              <div className="profile-section">
                <h3 className="section-title">🏆 Achievements & Certifications</h3>
                <div className="achievements-box">
                  <p className="achievements-text">{profileData.achievements}</p>
                </div>
              </div>
            )}

            {/* Portfolio & Social Links */}
            {(profileData?.portfolioLinks?.length > 0 || profileData?.socialMediaLinks?.length > 0) && (
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
                </div>
              </div>
            )}

            {/* Skills Views - Video/Image Upload */}
            <div className="profile-section">
              <div className="skills-views-header">
                <h3 className="section-title">📹 Skills Views</h3>
                <motion.button
                  className="upload-button-corner"
                  onClick={() => setShowUploadModal(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  📤 Upload
                </motion.button>
              </div>
              
              <div className="skills-views-container">
                {/* Upload Modal */}
                {showUploadModal && (
                  <motion.div
                    className="upload-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowUploadModal(false)}
                  >
                    <motion.div
                      className="upload-modal"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="modal-header">
                        <h3>Upload Video or Image</h3>
                        <button
                          className="modal-close-btn"
                          onClick={() => setShowUploadModal(false)}
                        >
                          ✕
                        </button>
                      </div>

                      <motion.div
                        className="media-upload-box-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <label className="upload-label">
                          <input
                            type="file"
                            multiple
                            accept="video/*,image/*"
                            onChange={handleMediaUpload}
                            className="file-input-hidden"
                          />
                          <div className="upload-content">
                            <span className="upload-icon">📤</span>
                            <h4>Drag & drop files here</h4>
                            <p>or click to select</p>
                            <span className="upload-hint">Video (MP4, WebM) or Image (JPG, PNG)</span>
                          </div>
                        </label>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Media Gallery */}
                {skillsViews.length > 0 && (
                  <div className="media-gallery">
                    {/* <h4 className="gallery-title">Your Skills Views</h4> */}
                    <div className="media-grid">
                      {skillsViews.map((media) => (
                        <motion.div
                          key={media.id}
                          className="media-item"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="media-wrapper">
                            {media.type === 'video' ? (
                              <video
                                controls
                                className="media-content"
                                src={media.src}
                              />
                            ) : (
                              <img
                                className="media-content"
                                src={media.src}
                                alt={media.fileName}
                              />
                            )}
                          </div>
                          <div className="media-info">
                            <p className="media-name">{media.fileName.substring(0, 20)}...</p>
                            <p className="media-date">{media.uploadedAt}</p>
                          </div>
                          <motion.button
                            className="delete-media-btn"
                            onClick={() => removeMedia(media.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            ✕
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {skillsViews.length === 0 && (
                  <motion.div
                    className="empty-media-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <p>No videos or images uploaded yet. Start by uploading your first skill demonstration!</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      ) : (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="empty-icon">👤</span>
          <h3>No Profile Data</h3>
          <p>Complete your profile to get started</p>
          <motion.button
            className="edit-profile-btn-hero"
            onClick={() => navigate('/edit-profile')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ✏️ Create Your Profile
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
};

// Inbox Page Component
// NOTE: Replaced by the centralized `Inbox` component (imported from ./Inbox.jsx)
// The legacy InboxPage local stub was removed to ensure the Dashboard's Inbox tab
// renders the full chat UI and functionality.

// Reports Page Component
const ReportsPage = ({ user }) => {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', media: [] });

  useEffect(() => {
    const stored = localStorage.getItem(`reports_${user.email}`);
    if (stored) {
      setReports(JSON.parse(stored));
    }
  }, [user.email]);

  const saveReports = (newReports) => {
    setReports(newReports);
    localStorage.setItem(`reports_${user.email}`, JSON.stringify(newReports));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newReport = {
      id: Date.now(),
      title: formData.title,
      description: formData.description,
      status: 'pending',
      media: formData.media.map(f => f.name), // just names for simplicity
      submittedAt: new Date().toISOString(),
      userEmail: user.email,
      userName: user.name || user.fullName || 'Unknown User',
    };
    saveReports([...reports, newReport]);
    setFormData({ title: '', description: '', media: [] });
    setShowForm(false);
  };

  const filteredReports = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  return (
    <motion.div
      className="page-content reports-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <h1>Reports</h1>
        <p>Manage your problem reports</p>
      </div>
      <div className="filters-row">
        <div className="filters">
          <button onClick={() => setFilter('all')} className={filter === 'all' ? 'active' : ''}>All</button>
          <button onClick={() => setFilter('pending')} className={filter === 'pending' ? 'active' : ''}>Pending</button>
          <button onClick={() => setFilter('accepted')} className={filter === 'accepted' ? 'active' : ''}>Accepted</button>
          <button onClick={() => setFilter('rejected')} className={filter === 'rejected' ? 'active' : ''}>Rejected</button>
        </div>
        <button className="report-btn" onClick={() => setShowForm(true)}>Report a Problem</button>
      </div>
      {showForm && (
        <div className="modal-overlay">
          <motion.div className="modal-content" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="modal-header">
              <h2>Report a Problem</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="report-form">
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={user.name} readOnly />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={user.email} readOnly />
              </div>
              <div className="form-group">
                <label>Title</label>
                <input type="text" placeholder="Brief title of the issue" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea placeholder="Describe the problem in detail" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Media Files (optional)</label>
                <div className="file-upload">
                  <input type="file" multiple id="media-upload" onChange={(e) => setFormData({...formData, media: Array.from(e.target.files)})} />
                  <label htmlFor="media-upload" className="file-upload-label">
                    <span>📎 Choose files</span>
                  </label>
                  {formData.media.length > 0 && <p>{formData.media.length} file(s) selected</p>}
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="submit-btn">Submit Report</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      <div className="reports-list">
        {filteredReports.length === 0 ? (
          <div className="no-reports">
            <p>No reports found.</p>
          </div>
        ) : (
          filteredReports.map(report => (
            <motion.div key={report.id} className="report-card" whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <div className="report-header">
                <h3>{report.title}</h3>
                <span className={`status-badge ${report.status}`}>{report.status}</span>
              </div>
              <p className="report-description">{report.description}</p>
              <div className="report-footer">
                <span className="report-date">Submitted: {new Date(report.submittedAt).toLocaleDateString()}</span>
                {report.media && report.media.length > 0 && <span className="media-count">📎 {report.media.length} file(s)</span>}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

// Skills Page Component
const SkillsPage = ({ user }) => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 6;

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        if (token) {
          const res = await fetch(`${apiBase}/api/skills/my`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const json = await res.json();
            if (json.success) {
              setSkills(Array.isArray(json.skills) ? json.skills : []);
            } else {
              setSkills([]);
            }
          } else {
            // fallback to localStorage
            const arr = JSON.parse(localStorage.getItem(`skills_${user?.email}`) || '[]');
            setSkills(Array.isArray(arr) ? arr.slice().reverse() : []);
          }
        } else {
          const arr = JSON.parse(localStorage.getItem(`skills_${user?.email}`) || '[]');
          setSkills(Array.isArray(arr) ? arr.slice().reverse() : []);
        }
      } catch (e) {
        console.error('Failed to load skills:', e);
        const arr = JSON.parse(localStorage.getItem(`skills_${user?.email}`) || '[]');
        setSkills(Array.isArray(arr) ? arr.slice().reverse() : []);
      }
      setLoading(false);
    };
    load();

    // reload when storage changes
    const onStorage = (e) => {
      if (e.key && e.key.startsWith('skills_')) {
        try {
          const arr = JSON.parse(localStorage.getItem(`skills_${user?.email}`) || '[]');
          setSkills(Array.isArray(arr) ? arr.slice().reverse() : []);
        } catch (e) {
          setSkills([]);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user?.email]);

  const totalPages = Math.max(1, Math.ceil((skills.length || 0) / perPage));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * perPage;
  const pageItems = skills.slice(start, start + perPage);

  const truncateWords = (text, count) => {
    if (!text) return '';
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length <= count) return words.join(' ');
    return words.slice(0, count).join(' ') + '...';
  };

  const navigate = useNavigate();
  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const getMediaUrl = (pathOrData) => {
    if (!pathOrData) return null;
    if (typeof pathOrData === 'string' && (pathOrData.startsWith('data:') || pathOrData.startsWith('http'))) return pathOrData;
    if (typeof pathOrData === 'string' && pathOrData.startsWith('/')) return `${apiBase}${pathOrData}`;
    return pathOrData;
  };

  const onEdit = (skill) => {
    navigate(`/dashboard?editSkill=${skill._id || skill.id}`);
  };
  const onReadMore = (skill) => {
    const id = skill?._id || skill?.id;
    if (!id) return;
    navigate(`/skill/${id}`);
  };

  if (loading) {
    return (
      <motion.div className="page-content skills-page" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div className="loading-spinner">Loading skills...</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="page-content skills-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <h1>My Skills</h1>
        <p>View all your shared skills</p>
      </div>
      {skills.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🎯</span>
          <h3>No skills added yet</h3>
          <p>Add your first skill to start sharing and learning</p>
        </div>
      ) : (
        <>
          <MySkills
            skills={pageItems}
            onEdit={onEdit}
            onReadMore={onReadMore}
            getMediaUrl={getMediaUrl}
            truncateWords={truncateWords}
          />
          <div className="pagination">
            <button className="page-btn" disabled={current === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button key={idx} className={`page-number ${current === idx + 1 ? 'active' : ''}`} onClick={() => setPage(idx + 1)}>{idx + 1}</button>
            ))}
            <button className="page-btn" disabled={current === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default UserDashboard;
