import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './SkillsManagement.css';

const SkillsManagement = () => {
  const [skills, setSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showDocsModal, setShowDocsModal] = useState(false);

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/skills`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch skills (${response.status}): ${text}`);
      }
      const data = await response.json();
      setSkills(data.skills || []);
    } catch (error) {
      console.error('Error fetching skills:', error);
      setError('Unable to load skills. Please check your admin access and try again.');
      setSkills([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationChange = async (skillId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/admin/skills/${skillId}/verification`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ badgeStatus: newStatus }),
      });
      if (!response.ok) {
        throw new Error('Failed to update skill verification');
      }
      const updatedSkill = await response.json();
      setSkills((prevSkills) =>
        prevSkills.map((skill) =>
          skill.id === skillId
            ? { ...skill, badgeStatus: updatedSkill.skill.badgeStatus }
            : skill
        )
      );
    } catch (error) {
      console.error('Error updating skill verification:', error);
    }
  };

  const filteredSkills = skills.filter((skill) => {
    const searchLower = searchTerm.toLowerCase();
    const ownerName = skill.owner?.name || '';
    const ownerEmail = skill.owner?.email || '';
    const categoryName = skill.category || '';

    const matchesSearch =
      (skill.title || '').toLowerCase().includes(searchLower) ||
      ownerName.toLowerCase().includes(searchLower) ||
      ownerEmail.toLowerCase().includes(searchLower) ||
      categoryName.toLowerCase().includes(searchLower);

    const matchesFilter =
      verificationFilter === 'all' ||
      (skill.badgeStatus || 'unverified') === verificationFilter;

    return matchesSearch && matchesFilter;
  });

  const openDocsModal = (skill) => {
    setSelectedSkill(skill);
    setShowDocsModal(true);
  };

  const closeDocsModal = () => {
    setShowDocsModal(false);
    setSelectedSkill(null);
  };

  const selectedDocs = selectedSkill
    ? Array.isArray(selectedSkill.verificationDocs)
      ? selectedSkill.verificationDocs
      : selectedSkill.verificationDocs
      ? [selectedSkill.verificationDocs]
      : []
    : [];

  return (
    <div className="skills-management-container">
      <motion.div
        className="skills-management"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="section-header">
          <h2>All Skills</h2>
          <div className="filters-bar">
            <input
              type="text"
              placeholder="Search skills, users, or categories..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="badge-filter">
              <button
                className={`filter-btn ${verificationFilter === 'all' ? 'active' : ''}`}
                onClick={() => setVerificationFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${verificationFilter === 'verified' ? 'active' : ''}`}
                onClick={() => setVerificationFilter('verified')}
              >
                Verified
              </button>
              <button
                className={`filter-btn ${verificationFilter === 'unverified' ? 'active' : ''}`}
                onClick={() => setVerificationFilter('unverified')}
              >
                Unverified
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading skills...</div>
        ) : error ? (
          <div className="no-results">{error}</div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Owner</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSkills.map((skill) => (
                  <tr key={skill.id}>
                    <td>
                      <div className="skill-title-cell">
                        <button
                          className="skill-title-button"
                          onClick={() => openDocsModal(skill)}
                        >
                          {skill.title}
                        </button>
                      </div>
                    </td>
                    <td>
                      <div className="owner-info">
                        <div className="owner-name">{skill.owner?.name || 'Unknown'}</div>
                        <div className="owner-email">{skill.owner?.email || 'No email'}</div>
                      </div>
                    </td>
                    <td>{skill.category || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${skill.badgeStatus}`}>
                        {skill.badgeStatus === 'verified' ? '✓ Verified' : '○ Unverified'}
                      </span>
                    </td>
                    <td>{skill.createdAt}</td>
                    <td>
                      <button
                        className={`action-btn ${skill.badgeStatus === 'verified' ? 'unverify' : 'verify'}`}
                        onClick={() =>
                          handleVerificationChange(
                            skill.id,
                            skill.badgeStatus === 'verified' ? 'unverified' : 'verified'
                          )
                        }
                      >
                        {skill.badgeStatus === 'verified' ? 'Unverify' : 'Verify'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSkills.length === 0 && (
              <div className="no-results">No skills found matching your criteria.</div>
            )}
          </div>
        )}

        {showDocsModal && selectedSkill && (
          <div className="docs-modal" onClick={closeDocsModal}>
            <div className="docs-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="docs-modal-header">
                <div>
                  <h3>Skill Verification Documents</h3>
                  <p className="docs-modal-subtitle">{selectedSkill.title}</p>
                </div>
                <button className="docs-modal-close" onClick={closeDocsModal}>
                  ×
                </button>
              </div>
              <div className="docs-modal-body">
                {selectedDocs.length > 0 ? (
                  <ul className="docs-modal-list">
                    {selectedDocs.map((doc, index) => {
                      const docPath = typeof doc === 'string' ? doc : '';
                      const docUrl = docPath.startsWith('http')
                        ? docPath
                        : `${API_BASE}${docPath.startsWith('/') ? '' : '/'}${docPath}`;
                      const docName = docPath.split('/').pop() || `document-${index + 1}`;
                      return (
                        <li key={`${docName}-${index}`} className="docs-modal-item">
                          <span className="doc-name">{docName}</span>
                          <a
                            className="doc-download-btn"
                            href={docUrl}
                            download
                            target="_blank"
                            rel="noreferrer"
                          >
                            Download
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="docs-modal-empty">No verification documents available for this skill.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SkillsManagement;
