import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './AdminDashboard.css';
import UsersManagement from './UsersManagement';
import SkillsManagement from './SkillsManagement';
import Overview from './Overview';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSkills: 0,
    activeExchanges: 0,
    pendingVerification: 0,
  });
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [reportSearch, setReportSearch] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState('all');

  // Categories management state
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    categoryName: '',
    subcategoryName: '',
    tags: [],
    tagInput: ''
  });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 10000); // Auto-hide after 10 seconds
  };

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      navigate('/login');
      return;
    }

    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (!parsedUser.isAdmin) {
        navigate('/dashboard');
        return;
      }
      setUser(parsedUser);
    }

    // Simulated stats
    setStats({
      totalUsers: 245,
      totalSkills: 1203,
      activeExchanges: 87,
      pendingVerification: 12,
    });

    // Simulated users
    setUsers([
      { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', joined: '2024-01-10' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Active', joined: '2024-01-12' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'Inactive', joined: '2024-01-08' },
    ]);
  }, [navigate]);

  // Categories management functions
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const [catRes, subRes, tagRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/categories`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/admin/subcategories`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/admin/tags`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (!catRes.ok || !subRes.ok || !tagRes.ok) {
        throw new Error('Failed to fetch categories data');
      }

      const [catData, subData, tagData] = await Promise.all([
        catRes.json(),
        subRes.json(),
        tagRes.json()
      ]);

      if (catData.success) setCategories(catData.categories);
      if (subData.success) setSubcategories(subData.subcategories);
      if (tagData.success) setTags(tagData.tags);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showNotification('Failed to load categories data', 'error');
    }
  };

  const loadReports = () => {
    const loaded = [];
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('reports_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(list)) {
            list.forEach((item) => {
              loaded.push({
                ...item,
                userEmail: item.userEmail || key.replace('reports_', ''),
                userName: item.userName || item.userEmail || key.replace('reports_', ''),
              });
            });
          }
        } catch (error) {
          console.warn('Invalid report data in localStorage for', key, error);
        }
      }
    });
    loaded.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    setReports(loaded);
  };

  const saveReportsToStorage = (reportList) => {
    const grouped = reportList.reduce((acc, report) => {
      const key = `reports_${report.userEmail || 'unknown'}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(report);
      return acc;
    }, {});

    Object.keys(grouped).forEach((key) => {
      localStorage.setItem(key, JSON.stringify(grouped[key]));
    });

    setReports(reportList);
  };

  const updateReportStatus = (reportId, newStatus) => {
    const updated = reports.map((report) =>
      report.id === reportId ? { ...report, status: newStatus } : report
    );
    saveReportsToStorage(updated);
    showNotification('Report status updated successfully.');
  };

  useEffect(() => {
    if (activeSection === 'categories') {
      fetchCategories();
    }
    if (activeSection === 'reports') {
      loadReports();
    }
  }, [activeSection]);

  useEffect(() => {
    loadReports();
  }, []);

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    setPasswordMessage(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'All password fields are required.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setPasswordMessage({ type: 'error', text: 'Authentication required. Please log in again.' });
        return;
      }

      const res = await fetch(`${API_BASE}/api/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Unable to change password.');
      }

      setPasswordMessage({ type: 'success', text: 'Password updated successfully.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message || 'Password update failed.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleBulkCategorySubmit = async () => {
    if (!bulkForm.categoryName.trim() || !bulkForm.subcategoryName.trim()) {
      showNotification('Category name and subcategory name are required', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showNotification('Authentication required. Please log in again.', 'error');
        navigate('/login');
        return;
      }

      console.log('Sending bulk request:', {
        categoryName: bulkForm.categoryName.trim(),
        subcategoryName: bulkForm.subcategoryName.trim(),
        tags: bulkForm.tags
      });

      const res = await fetch(`${API_BASE}/api/admin/categories/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryName: bulkForm.categoryName.trim(),
          subcategoryName: bulkForm.subcategoryName.trim(),
          tags: bulkForm.tags
        })
      });

      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);

      if (res.ok && data.success) {
        // Refresh the data
        await fetchCategories();
        // Reset form
        setBulkForm({
          categoryName: '',
          subcategoryName: '',
          tags: [],
          tagInput: ''
        });
        setShowManageCategories(false);
        showNotification('Categories updated successfully!', 'success');
      } else {
        console.error('API Error:', data);
        showNotification(data.message || 'Failed to update categories', 'error');
      }
    } catch (error) {
      console.error('Network Error:', error);
      showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addBulkTag = () => {
    if (!bulkForm.tagInput.trim()) return;
    if (bulkForm.tags.includes(bulkForm.tagInput.trim())) return;
    setBulkForm(prev => ({
      ...prev,
      tags: [...prev.tags, bulkForm.tagInput.trim()],
      tagInput: ''
    }));
  };

  const removeBulkTag = (tagToRemove) => {
    setBulkForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleBulkTagKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addBulkTag();
    }
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

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <motion.div className="admin-sidebar" initial={{ x: -300 }} animate={{ x: 0 }} transition={{ duration: 0.5 }}>
        <div className="sidebar-header">
          <h2 className="sidebar-title">SKILL BRIDGE</h2>
          <p className="sidebar-subtitle">Admin Panel</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            📊 Overview
          </button>
          
          <button
            className={`nav-item ${activeSection === 'users-management' ? 'active' : ''}`}
            onClick={() => setActiveSection('users-management')}
          >
            👥 Users Management
          </button>
          <button
            className={`nav-item ${activeSection === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveSection('skills')}
          >
            🎯 Skills Management
          </button>
          <button
            className={`nav-item ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveSection('reports')}
          >
            📝 Reports
          </button>
          <button
            className={`nav-item ${activeSection === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveSection('categories')}
          >
            📂 Categories
          </button>
          <button
            className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSection('settings')}
          >
            ⚙️ Settings
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </motion.div>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Bar */}
        <motion.div className="admin-topbar" initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}>
          <div className="topbar-left">
            <h1 className="page-title">
              {activeSection === 'overview' && 'Dashboard Overview'}
              {activeSection === 'skills' && 'Skills Management'}
              {activeSection === 'reports' && 'User Reports'}
              {activeSection === 'exchanges' && 'Exchanges'}
              {activeSection === 'verification' && 'Verification Queue'}
              {activeSection === 'categories' && 'Categories Management'}
              {activeSection === 'settings' && 'Settings'}
              {activeSection === 'users-management' && 'Users Management'}
            </h1>
          </div>
          <div className="topbar-right">
            <div className="admin-info">
              <span className="admin-name">Admin</span>
            </div>
          </div>
        </motion.div>

        {/* Notification */}
        {notification && (
          <motion.div
            className={`notification ${notification.type}`}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)}>×</button>
          </motion.div>
        )}

        {/* Content Area */}
        <motion.div
          className="admin-content"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <Overview />
          )}

          {/* Skills Section */}
          {activeSection === 'skills' && (
            <div className="section-content">
              <SkillsManagement />
            </div>
          )}

          {/* Exchanges Section */}
          {activeSection === 'exchanges' && (
            <div className="section-content">
              <motion.div className="placeholder-section" variants={itemVariants}>
                <h2>Exchanges</h2>
                <p>🔄 Exchanges monitoring panel coming soon...</p>
              </motion.div>
            </div>
          )}

          {/* Categories Section */}
          {activeSection === 'categories' && (
            <div className="section-content">

              <motion.div className="categories-management" variants={itemVariants}>
                <div className="section-header row-header custom-categories-header">
                  {/* <h2>Categories Management</h2> */}
                  <div className="search-filter-bar custom-search-bar">
                    <input
                      type="text"
                      className="category-search-input custom-input"
                      placeholder="Search categories..."
                      value={searchTerm || ''}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                    <select
                      className="category-dropdown custom-dropdown"
                      value={filterCategory || ''}
                      onChange={e => setFilterCategory(e.target.value)}
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                    <button className="add-btn outstanding custom-add-btn" onClick={() => setShowManageCategories(true)}>
                      ＋ Add/Manage Categories
                    </button>
                  </div>
                </div>

                <div className="categories-grid">
                  {(categories
                    .filter(cat => (!searchTerm || cat.name.toLowerCase().includes(searchTerm.toLowerCase())) && (!filterCategory || cat._id === filterCategory))
                  ).map((category) => (
                    <div key={category._id} className="category-card custom-category-card">
                      <div className="category-header custom-category-header">
                        <h3 className="custom-category-title">{category.name}</h3>
                      </div>
                      <div className="subcategories-list custom-subcategories-list">
                        {subcategories
                          .filter(sub => sub.category._id === category._id)
                          .map((subcategory) => (
                            <div key={subcategory._id} className="subcategory-item custom-subcategory-item">
                              <div className="subcategory-header custom-subcategory-header">
                                <span className="custom-subcategory-title">{subcategory.name}</span>
                              </div>
                              <div className="tags-list custom-tags-list">
                                {tags
                                  .filter(tag => tag.subcategory._id === subcategory._id)
                                  .map((tag) => (
                                    <span key={tag._id} className="tag-chip custom-tag-chip">
                                      {tag.name}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Manage Categories Modal */}
              {showManageCategories && (
                <div className="custom-modal" onClick={() => setShowManageCategories(false)}>
                  <div className="custom-modal-content" onClick={e => e.stopPropagation()}>
                    <div className="custom-modal-header">
                      <span className="custom-modal-title">Manage Categories</span>
                      <button className="custom-modal-close" onClick={() => setShowManageCategories(false)}>×</button>
                    </div>
                    <form className="custom-modal-form" onSubmit={e => { e.preventDefault(); handleBulkCategorySubmit(); }}>
                      <div className="custom-modal-group">
                        <span className="custom-modal-icon"><i className="fa fa-folder"></i></span>
                        <input
                          type="text"
                          value={bulkForm.categoryName}
                          onChange={e => setBulkForm({...bulkForm, categoryName: e.target.value})}
                          placeholder="Category Name *"
                          className="custom-modal-input"
                          required
                        />
                      </div>
                      <div className="custom-modal-group">
                        <span className="custom-modal-icon"><i className="fa fa-list"></i></span>
                        <input
                          type="text"
                          value={bulkForm.subcategoryName}
                          onChange={e => setBulkForm({...bulkForm, subcategoryName: e.target.value})}
                          placeholder="Subcategory Name *"
                          className="custom-modal-input"
                          required
                        />
                      </div>
                      <div className="custom-modal-group">
                        <span className="custom-modal-icon"><i className="fa fa-tags"></i></span>
                        <input
                          type="text"
                          value={bulkForm.tagInput}
                          onChange={e => setBulkForm({...bulkForm, tagInput: e.target.value})}
                          onKeyPress={handleBulkTagKey}
                          placeholder="Add tags (press Enter to add)"
                          className="custom-modal-input"
                        />
                        <button type="button" onClick={addBulkTag} className="custom-modal-addtag">＋</button>
                      </div>
                      <div className="custom-modal-tags">
                        {bulkForm.tags.map((tag, index) => (
                          <span key={index} className="custom-modal-tagchip">
                            {tag}
                            <button type="button" onClick={() => removeBulkTag(tag)}>&times;</button>
                          </span>
                        ))}
                      </div>
                      <button
                        type="submit"
                        className="custom-modal-submit"
                        disabled={loading || !bulkForm.categoryName.trim() || !bulkForm.subcategoryName.trim()}
                      >
                        {loading ? 'Saving...' : 'Save Categories'}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reports Section */}
          {activeSection === 'reports' && (
            <div className="section-content">
              <motion.div className="section-header row-header custom-categories-header" variants={itemVariants}>
                <div>
                  <h2>User Reports</h2>
                  <p>Review reported issues and update status directly.</p>
                </div>
                <div className="search-filter-bar custom-search-bar">
                  <input
                    type="text"
                    className="category-search-input custom-input"
                    placeholder="Search by title, user, or email..."
                    value={reportSearch}
                    onChange={e => setReportSearch(e.target.value)}
                  />
                  <select
                    className="category-dropdown custom-dropdown"
                    value={reportStatusFilter}
                    onChange={e => setReportStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </motion.div>

              <div className="reports-management-grid">
                {reports.filter((report) => {
                  const matchesStatus = reportStatusFilter === 'all' || report.status === reportStatusFilter;
                  const search = reportSearch.toLowerCase().trim();
                  const matchesSearch = !search ||
                    report.title.toLowerCase().includes(search) ||
                    (report.userName || '').toLowerCase().includes(search) ||
                    (report.userEmail || '').toLowerCase().includes(search);
                  return matchesStatus && matchesSearch;
                }).map((report) => (
                  <div key={report.id} className="report-card admin-report-card">
                    <div className="report-card-top">
                      <div>
                        <h3>{report.title}</h3>
                        <p className="report-user">Reported by {report.userName || report.userEmail}</p>
                      </div>
                      <span className={`status-badge ${report.status}`}>{report.status}</span>
                    </div>
                    <p className="report-description">{report.description}</p>
                    <div className="report-meta-row">
                      <span>Submitted: {new Date(report.submittedAt).toLocaleString()}</span>
                      {report.media && report.media.length > 0 && <span>Attachments: {report.media.length}</span>}
                    </div>
                    <div className="report-actions-row">
                      <label htmlFor={`status-${report.id}`}>Change Status</label>
                      <select
                        id={`status-${report.id}`}
                        value={report.status}
                        onChange={(e) => updateReportStatus(report.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                ))}

                {reports.filter((report) => {
                  const matchesStatus = reportStatusFilter === 'all' || report.status === reportStatusFilter;
                  const search = reportSearch.toLowerCase().trim();
                  const matchesSearch = !search ||
                    report.title.toLowerCase().includes(search) ||
                    (report.userName || '').toLowerCase().includes(search) ||
                    (report.userEmail || '').toLowerCase().includes(search);
                  return matchesStatus && matchesSearch;
                }).length === 0 && (
                  <div className="empty-state report-empty-state">
                    <p>No reports match the current filters.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="section-content">
              <motion.div className="settings-panel" variants={itemVariants}>
                <div className="section-header">
                  <h2>Settings</h2>
                  <div className="header-line"></div>
                </div>
                <p className="settings-description">Change your admin password securely from this panel.</p>

                {passwordMessage && (
                  <div className={`settings-message ${passwordMessage.type}`}>
                    {passwordMessage.text}
                  </div>
                )}

                <form className="settings-form" onSubmit={handlePasswordChange}>
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="settings-input"
                    placeholder="Enter current password"
                    required
                  />

                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="settings-input"
                    placeholder="Enter new password"
                    required
                  />

                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="settings-input"
                    placeholder="Confirm new password"
                    required
                  />

                  <button type="submit" className="settings-submit" disabled={passwordLoading}>
                    {passwordLoading ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}

          {/* Users Management Section */}
          {activeSection === 'users-management' && (
            <div className="section-content">
              <UsersManagement />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;
