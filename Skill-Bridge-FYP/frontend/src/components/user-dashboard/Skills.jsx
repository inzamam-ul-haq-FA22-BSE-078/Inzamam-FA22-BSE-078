import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Skills.css';

const Skills = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [isSearcher, setIsSearcher] = useState(true);

  // fallback categories (used when server is unreachable)
  const FALLBACK_CATEGORIES = [
    { id: 'dev', label: 'Development & Tech', icon: '💻', color: '#7c3aed' },
    { id: 'design', label: 'Design & Creative', icon: '🎨', color: '#ec4899' },
    { id: 'teaching', label: 'Teaching & Mentorship', icon: '📚', color: '#db2777' },
    { id: 'marketing', label: 'Content & Digital Marketing', icon: '📣', color: '#ef4444' },
    { id: 'animation', label: 'Video & Animation', icon: '🎬', color: '#f59e0b' },
    { id: 'ai', label: 'AI & Automation', icon: '🤖', color: '#06b6d4' },
    { id: 'business', label: 'Business & Freelancing Skills', icon: '💼', color: '#10b981' },
    { id: 'art', label: 'Art & Illustration', icon: '🖌️', color: '#3b82f6' },
  ];

  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadError, setLoadError] = useState(null);

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
    }

    // fetch categories and skills
    fetchCategories();
    fetchSkills();
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/skills/categories`);
      const json = await res.json();
      if (json && json.success) setCategories(json.categories || FALLBACK_CATEGORIES);
      else setCategories(FALLBACK_CATEGORIES);
    } catch (e) {
      console.error('Failed to load categories', e);
      // fallback to local list so UI still shows filters
      setCategories(FALLBACK_CATEGORIES);
      setLoadError('Failed to load categories from server');
    }
  };

  const fetchSkills = async (opts = {}) => {
    try {
      setLoadError(null);
      setLoadingSkills(true);
      const params = new URLSearchParams();
      if (opts.category) params.set('category', opts.category);
      if (opts.search) params.set('search', opts.search);
      if (typeof opts.verified !== 'undefined') params.set('verified', opts.verified ? 'true' : 'false');
      const res = await fetch(`${API_BASE}/api/skills?${params.toString()}`);
      const json = await res.json();
      if (json && json.success) {
        const skillsWithNames = json.skills.map(skill => {
          return {
            ...skill,
            categoryName: skill.category?.name || 'Uncategorized',
            subcategoryName: skill.subcategory?.name || 'No Subcategory',
            tagNames: skill.tags?.map(tag => tag.name) || [],
          };
        });
        setSkills(skillsWithNames);
      } else {
        setSkills([]);
      }
    } catch (e) {
      console.error('Failed to fetch skills', e);
      // try to load from localStorage fallback (AddSkill stores local skills under keys like skills_<email>)
      try {
        const localSkills = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (!key || !key.startsWith('skills_')) continue;
          const arr = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(arr) && arr.length) {
            localSkills.push(...arr);
          }
        }
        if (localSkills.length > 0) {
          setSkills(localSkills);
          setLoadError('Showing cached local skills (offline mode)');
        } else {
          setSkills([]);
          setLoadError('Failed to load skills from server');
        }
      } catch (e2) {
        setSkills([]);
        setLoadError('Failed to load skills from server');
      }
    } finally {
      setLoadingSkills(false);
    }
  };

  // Filter skills based on category and search (server-side)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchSkills({ category: selectedCategory, search: searchQuery, verified: verifiedFilter === 'all' ? undefined : (verifiedFilter === 'verified') });
    }, 300);
    return () => clearTimeout(t);
  }, [selectedCategory, searchQuery]);

  // re-run when verifiedFilter changes
  useEffect(() => {
    const t = setTimeout(() => {
      fetchSkills({ category: selectedCategory, search: searchQuery, verified: verifiedFilter === 'all' ? undefined : (verifiedFilter === 'verified') });
    }, 300);
    return () => clearTimeout(t);
  }, [verifiedFilter]);



  // Handle toggle switch change
  useEffect(() => {
    if (!isSearcher) {
      navigate('/dashboard');
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

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const token = localStorage.getItem('token');

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const handleViewOwnerProfile = (owner) => {
    const ownerId = owner && (owner._id || owner.id);
    if (!ownerId) return;
    navigate(`/user/${ownerId}`);
  };

  const resolveCategoryLabel = (categoryData) => {
    if (!categoryData) return 'Uncategorized';
    if (typeof categoryData === 'string') {
      const found = categories.find(c => c.id === categoryData || c._id === categoryData || String(c.id) === String(categoryData));
      return found ? (found.label || found.name || categoryData) : categoryData;
    }
    if (typeof categoryData === 'object') {
      if (categoryData.name) return categoryData.name;
      if (categoryData.label) return categoryData.label;
      if (categoryData._id) {
        const found = categories.find(c => String(c.id) === String(categoryData._id));
        if (found) return found.label || found.name;
      }
      return String(categoryData);
    }
    return String(categoryData);
  };

  const resolveSubcategoryLabel = (subcategoryData) => {
    if (!subcategoryData) return '';
    if (typeof subcategoryData === 'string') {
      for (const cat of categories) {
        const found = cat.subcategories?.find(s => s.id === subcategoryData || s._id === subcategoryData || String(s.id) === String(subcategoryData));
        if (found) return found.label || found.name || subcategoryData;
      }
      return subcategoryData;
    }
    if (typeof subcategoryData === 'object') {
      if (subcategoryData.name) return subcategoryData.name;
      if (subcategoryData.label) return subcategoryData.label;
      if (subcategoryData._id) return String(subcategoryData._id);
      return String(subcategoryData);
    }
    return String(subcategoryData);
  };

  const resolveTagNames = (tagsData) => {
    if (!Array.isArray(tagsData) || tagsData.length === 0) return [];
    return tagsData
      .map((tag) => {
        if (!tag) return '';
        if (typeof tag === 'string') return tag;
        if (typeof tag === 'object') return tag.name || tag.label || (tag._id ? String(tag._id) : '');
        return String(tag);
      })
      .filter(Boolean);
  };

  // Start a conversation with the skill owner and open Inbox on that conversation
  const handleChatWithOwner = async (owner) => {
    const ownerId = owner && (owner._id || owner.id);
    if (!ownerId) return;
    try {
      const res = await fetch(`${API_BASE}/api/chat/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ participantId: ownerId })
      });
      const json = await res.json();
      if (json && json.success && json.conversation) {
        const convId = json.conversation._id;
        navigate(`/dashboard?tab=inbox&conv=${convId}`);
        return;
      }
    } catch (e) {
      console.error('start chat failed', e);
    }
    // fallback: just open inbox
    navigate('/dashboard?tab=inbox');
  };

  if (loading) {
    return (
      <div className="skills-loading">
        <div className="spinner-large"></div>
        <p>Loading skills...</p>
      </div>
    );
  }

  return (
    <div className="skills-container">
      {/* Top Navigation Bar */}
      <motion.nav className="skills-navbar" initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}>
        <div className="navbar-left">
          <div className="navbar-logo">
            <span className="logo-icon">🌉</span>
            <span className="logo-text">SkillBridge</span>
          </div>
        </div>

        <div className="navbar-search">
          <input
            type="text"
            placeholder="Search skills..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="navbar-actions">
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

      {/* Main Content */}
      <motion.div
        className="skills-content"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Banner Section with Video Background */}
        <motion.section className="banner-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {/* Video Background */}
          <video 
            className="banner-video" 
            autoPlay 
            muted 
            loop 
            playsInline
            onError={() => console.log('Video failed to load')}
          >
            <source src="/Desktop Header new version.webm" type="video/webm" />
            <source src="/banner-video.mp4" type="video/mp4" />
            {/* Fallback: solid background */}
          </video>
          
          <div className="banner-overlay"></div>
          
          <div className="banner-content">
            <h1 className="banner-text">Our freelancers will take it from here</h1>
            <div className="banner-divider"></div>
            
            <div className="banner-search">
              <input
                type="text"
                placeholder="Search for any service..."
                className="banner-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="banner-search-icon">🔍</span>
            </div>
            
            <div className="banner-categories">
              <motion.button
                key="all"
                className={`banner-category-btn ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                All Skills
              </motion.button>
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  className={`banner-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {category.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Skills Section */}
        <motion.section className="skills-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="skills-header">
            <h2 className="section-title">
              {selectedCategory ? `${(categories.find(c=>c.id===selectedCategory)?.label) || ''} Skills` : 'All Skills'}
            </h2>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <p className="skills-count">{skills.length} skills found</p>
              <div className="badge-filter">
                <button className={`filter-btn ${verifiedFilter === 'all' ? 'active' : ''}`} onClick={() => setVerifiedFilter('all')}>All</button>
                <button className={`filter-btn ${verifiedFilter === 'verified' ? 'active' : ''}`} onClick={() => setVerifiedFilter('verified')}>Verified</button>
                <button className={`filter-btn ${verifiedFilter === 'unverified' ? 'active' : ''}`} onClick={() => setVerifiedFilter('unverified')}>Unverified</button>
              </div>
            </div>
          </div>

          {loadingSkills ? (
            <div className="skills-loading" style={{padding:'80px 0'}}>
              <div className="spinner-large"></div>
              <p>Loading skills...</p>
            </div>
          ) : loadError ? (
            <div className="empty-state">
              <span className="empty-icon">⚠️</span>
              <h3>Unable to load skills</h3>
              <p>{loadError}. Try again later or check your server.</p>
            </div>
          ) : null}

          {skills.length > 0 ? (
            <div className="skills-grid">
              {skills
                .filter(s => {
                  if (verifiedFilter === 'all') return true;
                  if (verifiedFilter === 'verified') return (s.badgeStatus === 'verified');
                  return (s.badgeStatus !== 'verified');
                })
                .map((skill, index) => (
                <motion.div
                  key={skill._id}
                  className="skill-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                >
                    <div className="skill-cover-wrapper skill-image">
                    <img className="skill-cover" src={(skill.skillImage && (skill.skillImage.startsWith('http') || skill.skillImage.startsWith('/'))) ? (skill.skillImage.startsWith('/') ? `${API_BASE}${skill.skillImage}` : skill.skillImage) : (skill.skillImage || '/placeholder.png')} alt={skill.title} onError={(e)=>{ try{ e.currentTarget.onerror=null; e.currentTarget.src='/placeholder.png'; }catch(err){} }} />
                      {skill.badgeStatus ? (
                        <div className={`skill-badge ${skill.badgeStatus}`}>{skill.badgeStatus === 'verified' ? 'Verified' : 'Unverified'}</div>
                      ) : null}
                  </div>

                  <div className="skill-owner">
                    <button className="owner-profile-link" onClick={() => handleViewOwnerProfile(skill.owner)}>
                      <img className="owner-avatar" src={(skill.owner && skill.owner.profilePicture) ? (skill.owner.profilePicture.startsWith('/') ? `${API_BASE}${skill.owner.profilePicture}` : skill.owner.profilePicture) : '/placeholder-avatar.png'} alt={skill.owner?.fullName || skill.owner?.email || 'Owner'} onError={(e)=>{ try{ e.currentTarget.onerror=null; e.currentTarget.src='/placeholder-avatar.png'; }catch(err){} }} />
                      <span className="owner-name1">{skill.owner?.fullName || skill.owner?.name || 'View profile'}</span>
                    </button>
                  </div>

                  <h3 className="skill-name">{skill.title}</h3>
                  <p className="skill-category">Category: {skill.categoryName}</p>
                  {/* <p className="skill-subcategory">Subcategory: {skill.subcategoryName}</p>
                  <p className="skill-tags">Tags: {skill.tagNames.length > 0 ? skill.tagNames.join(', ') : 'None'}</p> */}

                  <div className="card-buttons">
                    <button className="read-btn" onClick={() => navigate(`/skill/${skill._id}`)}>Read more</button>
                    <button className="chat-btn" onClick={() => handleChatWithOwner(skill.owner)}>Chat</button>
                  </div> 

                </motion.div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">🔍</span>
              <h3>No skills found</h3>
              <p>Try searching for a different skill or explore other categories</p>
            </div>
          )}
        </motion.section>
      </motion.div>
    </div>
  );
};

// Helper function to get difficulty color
const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'Beginner':
      return 'rgba(34, 197, 94, 0.2)';
    case 'Intermediate':
      return 'rgba(59, 130, 246, 0.2)';
    case 'Advanced':
      return 'rgba(239, 68, 68, 0.2)';
    default:
      return 'rgba(124, 58, 237, 0.2)';
  }
};

export default Skills;
