import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProjectDetail.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/projects/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || 'Failed to load project');
        }
        setProject(data.project);
      } catch (err) {
        setError(err.message || 'Unable to load project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleBack = () => {
    navigate('/dashboard?tab=projects');
  };

  const handleEdit = () => {
    navigate(`/dashboard?tab=projects&editProject=${id}`);
  };

  const handleGroupChat = async () => {
    if (!project) return;
    setChatLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/chat/conversations/project/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success || !data.conversation?._id) {
        throw new Error(data.message || 'Unable to open group chat');
      }
      navigate(`/dashboard?tab=inbox&conv=${data.conversation._id}`);
    } catch (err) {
      setError(err.message || 'Unable to open group chat');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="project-detail-loading">
        <div className="loader-pulse">
          <div className="loader-core"></div>
        </div>
        <p>Loading your project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-detail-error">
        <div className="error-icon">⚠️</div>
        <p className="error-message">{error}</p>
        <button className="error-button" onClick={handleBack}>← Return to Projects</button>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const statusColor = {
    'Planning': '#8B5CF6',
    'Active': '#10B981',
    'Completed': '#3B82F6',
  }[project.status] || '#6B7280';

  const statusBg = {
    'Planning': 'rgba(139, 92, 246, 0.1)',
    'Active': 'rgba(16, 185, 129, 0.1)',
    'Completed': 'rgba(59, 130, 246, 0.1)',
  }[project.status] || 'rgba(107, 114, 128, 0.1)';

  const teamRows = project.team && project.team.length > 0 ? project.team.map((member, index) => {
    const user = member.userId || {};
    const skills = Array.isArray(user.skills) && user.skills.length > 0
      ? user.skills.map(skill => skill.skill).filter(Boolean).join(', ')
      : '—';

    return (
      <tr key={index} className="team-row">
        <td className="member-cell">
          <div className="member-avatar">{user.name ? user.name[0]?.toUpperCase() : '?'}</div>
          <span>{user.name || member.name || member.email || 'Unknown'}</span>
        </td>
        <td className="role-cell">{member.role || '—'}</td>
      </tr>
    );
  }) : (
    <tr>
      <td colSpan="3" className="empty-row">No team members assigned</td>
    </tr>
  );

  return (
    <div className="project-detail-page">
      {/* Header Section */}
      <div className="detail-header">
        <div className="header-left">
          <h1 className="detail-title">{project.title}</h1>
          <div className="detail-status-badge" style={{ color: statusColor, backgroundColor: statusBg }}>
            {project.status === 'Planning' && '📋'}
            {project.status === 'Active' && '⚡'}
            {project.status === 'Completed' && '✅'}
            {' '}{project.status}
          </div>
        </div>
        <div className="header-right">
          <button className="action-btn edit-btn" onClick={handleEdit}>
            <span>✏️</span> Edit
          </button>
          <button
            className="action-btn chat-btn1"
            onClick={handleGroupChat}
            disabled={chatLoading || !Array.isArray(project.team) || project.team.length === 0}
          >
            <span>{chatLoading ? '⏳' : '💬'}</span> {chatLoading ? 'Opening...' : 'Group Chat'}
          </button>
          <button className="action-btn back-btn" onClick={handleBack}>
            <span>←</span> Back
          </button>
        </div>
      </div>
      {/* Info Cards Section */}
      <div className="info-grid">
        <div className="info-card owner-card">
          <div className="info-icon">👤</div>
          <div className="info-content">
            <span className="info-label">Project Owner</span>
            <span className="info-value">{project.ownerName || project.owner?.name || 'Unknown'}</span>
          </div>
        </div>

        <div className="info-card status-card">
          <div className="info-icon">🎯</div>
          <div className="info-content">
            <span className="info-label">Status</span>
            <span className="info-value" style={{ color: statusColor }}>{project.status}</span>
          </div>
        </div>

        <div className="info-card date-card">
          <div className="info-icon">📅</div>
          <div className="info-content">
            <span className="info-label">Duration</span>
            <span className="info-value">{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} — {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>

        <div className="info-card team-card">
          <div className="info-icon">👥</div>
          <div className="info-content">
            <span className="info-label">Team Members</span>
            <span className="info-value">{project.team?.length || 0} Members</span>
          </div>
        </div>
      </div>

      {/* Team Note */}
      {(!Array.isArray(project.team) || project.team.length === 0) && (
        <div className="detail-note">
          <span>ℹ️</span> Add at least one team member to enable the project group chat.
        </div>
      )}

      {/* Description Section */}
      <div className="section-container">
        <div className="section-header">
          <h2>📝 Project Overview</h2>
          <div className="header-line"></div>
        </div>
        <div className="description-content">
          <div className="description-block">
            <h3>Short Description</h3>
            <p>{project.shortDescription || 'No short description provided.'}</p>
          </div>
          <div className="description-block">
            <h3>Full Description</h3>
            <p>{project.fullDescription || 'No full description provided.'}</p>
          </div>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="section-container">
        <div className="section-header">
          <h2>👥 Team Members & Skills</h2>
          <div className="header-line"></div>
        </div>
        <div className="table-wrapper">
          <table className="team-table">
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {teamRows}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents Section */}
      <div className="section-container">
        <div className="section-header">
          <h2>📎 Project Documents</h2>
          <div className="header-line"></div>
        </div>
        {Array.isArray(project.files) && project.files.length > 0 ? (
          <div className="documents-grid">
            {project.files.map((file, index) => (
              <a
                key={index}
                href={`${API_BASE}${file.fileUrl}`}
                target="_blank"
                rel="noreferrer"
                download={file.fileName}
                className="document-card"
              >
                <div className="doc-icon">📄</div>
                <div className="doc-info">
                  <div className="doc-name">{file.fileName || `Document ${index + 1}`}</div>
                  <div className="doc-type">{file.fileType?.toUpperCase() || 'FILE'}</div>
                </div>
                <div className="doc-download">⬇️ Download</div>
              </a>
            ))}
          </div>
        ) : (
          <div className="empty-documents">
            <div className="empty-icon">📭</div>
            <p>No documents uploaded for this project yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;
