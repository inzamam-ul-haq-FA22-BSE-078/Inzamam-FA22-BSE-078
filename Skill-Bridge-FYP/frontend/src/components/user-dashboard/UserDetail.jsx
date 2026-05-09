import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Skills.css';

const UserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/users/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.message || 'Unable to load user profile');
        }
        setUser(json.user);
      } catch (err) {
        setError(err.message || 'Unable to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [API_BASE, id, navigate, token]);

  const resolveImageUrl = (src) => {
    if (!src) return '/placeholder-avatar.png';
    if (src.startsWith('http') || src.startsWith('data:')) return src;
    if (src.startsWith('/')) return `${API_BASE}${src}`;
    return src;
  };

  const displayName = user?.fullName || user?.name || 'User profile';

  if (loading) {
    return (
      <div className="page-content user-detail-page">
        <div className="skills-loading">
          <div className="spinner-large"></div>
          <p>Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="page-content user-detail-page">
        <div className="empty-state">
          <h3>User not found</h3>
          <p>{error || 'This profile may have been removed or is unavailable.'}</p>
          <button className="btn" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  const socialLinks = user.socialMediaLinks ? Object.entries(user.socialMediaLinks).filter(([_, value]) => value) : [];

  return (
    <div className="page-content user-detail-page">
      <motion.div className="user-detail-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back to skills
        </button>

        <div className="user-detail-header">
          <img
            className="detail-avatar"
            src={resolveImageUrl(user.profilePicture)}
            alt={displayName}
            onError={(e) => {
              try {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/placeholder-avatar.png';
              } catch (err) {}
            }}
          />

          <div className="user-detail-meta">
            <h1>{displayName}</h1>
            <p className="user-detail-subtitle">
              {user.email}
              {user.phoneNo ? ` · ${user.phoneNo}` : ''}
            </p>
            {user.createdAt && <p className="user-detail-subtitle">Member since {new Date(user.createdAt).toLocaleDateString()}</p>}
          </div>
        </div>

        <div className="user-detail-section">
          <h3>About</h3>
          <p>{user.bio || user.skillsDescription || 'No additional profile information available.'}</p>
        </div>

        <div className="user-detail-grid">
          <div className="user-detail-section">
            <h3>Contact</h3>
            <p><strong>Email:</strong> {user.email}</p>
            {user.phoneNo && <p><strong>Phone:</strong> {user.phoneNo}</p>}
            {user.country && <p><strong>Country:</strong> {user.country}</p>}
            {user.address && <p><strong>Location:</strong> {user.address}</p>}
          </div>

          {socialLinks.length > 0 && (
            <div className="user-detail-section">
              <h3>Social Links</h3>
              <ul className="social-links">
                {socialLinks.map(([key, value]) => (
                  <li key={key}>
                    <a href={value} target="_blank" rel="noreferrer">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {Array.isArray(user.skills) && user.skills.length > 0 && (
          <div className="user-detail-section">
            <h3>Skills</h3>
            <div className="profile-skills-list">
              {user.skills.map((skill, index) => (
                <div className="profile-skill-pill" key={`${skill.skill || skill._id}-${index}`}>
                  <span>{skill.skill}</span>
                  {skill.proficiency ? <span className="skill-level">{skill.proficiency}</span> : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default UserDetail;
