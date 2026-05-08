import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AddProjectForm.css';

const AddProjectForm = ({ user, project, onClose, onSave }) => {
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [userSuggestions, setUserSuggestions] = useState([]);
  const searchTimeout = useRef(null);

  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    status: 'Planning',
    ownerName: user?.name || '',
    startDate: '',
    deadline: '',
    team: [],
    teamEmailInput: '',
    selectedTeamUser: null,
    teamRoleInput: '',
    files: [],
    fileInputs: [],
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);


  // Pre-fill form if editing
  useEffect(() => {
    if (project) {
      setForm({
        title: project.title || '',
        shortDescription: project.shortDescription || '',
        fullDescription: project.fullDescription || '',
        
        status: project.status || 'Planning',
        ownerName: project.ownerName || '',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        deadline: project.deadline ? project.deadline.split('T')[0] : '',
        team: project.team || [],
        teamEmailInput: '',
        selectedTeamUser: null,
        teamRoleInput: '',
        files: project.files || [],
        fileInputs: [],
      });
    }
  }, [project]);

  const handleTeamSearchChange = (value) => {
    setForm(prev => ({
      ...prev,
      teamEmailInput: value,
      selectedTeamUser:
        prev.selectedTeamUser &&
        (value.toLowerCase() === prev.selectedTeamUser.email.toLowerCase() ||
          value.toLowerCase() === (prev.selectedTeamUser.name || '').toLowerCase())
          ? prev.selectedTeamUser
          : null,
      teamRoleInput:
        prev.selectedTeamUser &&
        (value.toLowerCase() === prev.selectedTeamUser.email.toLowerCase() ||
          value.toLowerCase() === (prev.selectedTeamUser.name || '').toLowerCase())
          ? prev.teamRoleInput
          : '',
    }));
    if (errors.teamEmailInput) {
      setErrors(prev => ({ ...prev, teamEmailInput: null }));
    }
  };

  // Handle user search input and suggestions
  useEffect(() => {
    const query = form.teamEmailInput.trim();
    if (!query || form.selectedTeamUser) {
      setUserSuggestions([]);
      return;
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/users?search=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json && json.success && Array.isArray(json.users)) {
          const suggestions = json.users.filter(
            u => !form.team.find(t => t.email === u.email)
          );
          setUserSuggestions(suggestions);
        } else {
          setUserSuggestions([]);
        }
      } catch (e) {
        console.error('Error searching users:', e);
        setUserSuggestions([]);
      }
    }, 250);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [form.teamEmailInput, form.team, form.selectedTeamUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleAddTeamMember = () => {
    const selectedUser = form.selectedTeamUser;
    const role = form.teamRoleInput.trim();

    if (!selectedUser) {
      setErrors(prev => ({ ...prev, teamEmailInput: 'Please select a user from the list' }));
      return;
    }
    if (!role) {
      setErrors(prev => ({ ...prev, teamRoleInput: 'Please enter a role' }));
      return;
    }

    const newMember = {
      email: selectedUser.email,
      name: selectedUser.name || selectedUser.email,
      role,
      userId: selectedUser._id || null,
    };

    // Check if already in team
    if (form.team.find(t => t.email === newMember.email)) {
      setErrors(prev => ({ ...prev, teamEmailInput: 'User already in team' }));
      return;
    }

    setForm(prev => ({
      ...prev,
      team: [...prev.team, newMember],
      teamEmailInput: '',
      selectedTeamUser: null,
      teamRoleInput: '',
    }));
  };

  const handleRemoveTeamMember = (index) => {
    setForm(prev => ({
      ...prev,
      team: prev.team.filter((_, i) => i !== index),
    }));
  };

  const handleSelectUserSuggestion = (suggestedUser) => {
    setForm(prev => ({
      ...prev,
      teamEmailInput: suggestedUser.name,
      selectedTeamUser: suggestedUser,
    }));
    setUserSuggestions([]);
  };

  const handleFileUpload = (e) => {
    const uploadedFiles = Array.from(e.target.files || []);
    const validFiles = uploadedFiles.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase();
      return ['pdf', 'ppt', 'pptx', 'doc', 'docx'].includes(ext);
    });

    if (validFiles.length !== uploadedFiles.length) {
      setErrors(prev => ({
        ...prev,
        files: 'Only PDF, PPT, and Word files are allowed',
      }));
    }

    setForm(prev => ({
      ...prev,
      fileInputs: [...prev.fileInputs, ...validFiles],
    }));
  };

  const handleRemoveFile = (index) => {
    setForm(prev => ({
      ...prev,
      fileInputs: prev.fileInputs.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.shortDescription.trim()) newErrors.shortDescription = 'Short description is required';
    if (!form.ownerName.trim()) newErrors.ownerName = 'Owner name is required';
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.deadline) newErrors.deadline = 'Deadline is required';

    if (new Date(form.startDate) > new Date(form.deadline)) {
      newErrors.deadline = 'Deadline must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      formData.append('title', form.title);
      formData.append('shortDescription', form.shortDescription);
      formData.append('fullDescription', form.fullDescription);
      formData.append('status', form.status);
      formData.append('ownerName', form.ownerName);
      formData.append('startDate', form.startDate);
      formData.append('deadline', form.deadline);
      formData.append('team', JSON.stringify(form.team));

      form.fileInputs.forEach(file => {
        formData.append('files', file);
      });

      const url = project ? `${API_BASE}/api/projects/${project._id}` : `${API_BASE}/api/projects`;
      const method = project ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onSave(data.project);
      } else {
        setErrors({ submit: data.message || 'Error saving project' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ submit: 'Error submitting form. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="form-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="form-modal-content"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="form-modal-header">
          <h2>{project ? 'Edit Project' : 'Create New Project'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="form-modal-body">
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="form-section">
              <h3 className="section-title">📝 Basic Information</h3>

              <div className="form-group">
                <label>Project Title *</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Enter project title"
                  className={errors.title ? 'error' : ''}
                />
                {errors.title && <span className="error-msg">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label>Short Description *</label>
                <textarea
                  name="shortDescription"
                  value={form.shortDescription}
                  onChange={handleChange}
                  placeholder="Brief description of your project"
                  maxLength="200"
                  className={errors.shortDescription ? 'error' : ''}
                  rows="3"
                />
                <span className="char-count">{form.shortDescription.length}/200</span>
                {errors.shortDescription && <span className="error-msg">{errors.shortDescription}</span>}
              </div>

              <div className="form-group">
                <label>Full Description</label>
                <textarea
                  name="fullDescription"
                  value={form.fullDescription}
                  onChange={handleChange}
                  placeholder="Detailed description (optional)"
                  rows="4"
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="form-section">
              <h3 className="section-title">⚙️ Project Details</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="status"
                        value="Planning"
                        checked={form.status === 'Planning'}
                        onChange={handleChange}
                      />
                      <span>📋 Planning</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="status"
                        value="Active"
                        checked={form.status === 'Active'}
                        onChange={handleChange}
                      />
                      <span>⚡ Active</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="status"
                        value="Completed"
                        checked={form.status === 'Completed'}
                        onChange={handleChange}
                      />
                      <span>✅ Completed</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Dates & Owner */}
            <div className="form-section">
              <h3 className="section-title">📅 Timeline & Owner</h3>

              <div className="form-row">
                <div className="form-group">
                  <label>Project Owner *</label>
                  <input
                    type="text"
                    name="ownerName"
                    value={form.ownerName}
                    onChange={handleChange}
                    placeholder="Owner name"
                    className={errors.ownerName ? 'error' : ''}
                  />
                  {errors.ownerName && <span className="error-msg">{errors.ownerName}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    className={errors.startDate ? 'error' : ''}
                  />
                  {errors.startDate && <span className="error-msg">{errors.startDate}</span>}
                </div>

                <div className="form-group">
                  <label>Deadline *</label>
                  <input
                    type="date"
                    name="deadline"
                    value={form.deadline}
                    onChange={handleChange}
                    className={errors.deadline ? 'error' : ''}
                  />
                  {errors.deadline && <span className="error-msg">{errors.deadline}</span>}
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="form-section">
              <h3 className="section-title">👥 Team Members</h3>

              <div className="team-input-group">
                <div className="team-input-wrapper">
                  <input
                    type="text"
                    value={form.teamEmailInput}
                    onChange={(e) => handleTeamSearchChange(e.target.value)}
                    placeholder="Search team members by name or email"
                    className={errors.teamEmailInput ? 'error' : ''}
                  />
                  {errors.teamEmailInput && <span className="error-msg">{errors.teamEmailInput}</span>}

                  {/* User Suggestions Dropdown */}
                  <AnimatePresence>
                    {userSuggestions.length > 0 && (
                      <motion.div
                        className="suggestions-dropdown"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {userSuggestions.map(u => (
                          <div
                            key={u._id}
                            className="suggestion-item"
                            onClick={() => handleSelectUserSuggestion(u)}
                          >
                            <div className="suggestion-name">{u.name}</div>
                            <div className="suggestion-email">{u.email}</div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="form-row team-role-row">
                  <input
                    type="text"
                    value={form.teamRoleInput}
                    onChange={(e) => setForm(prev => ({ ...prev, teamRoleInput: e.target.value }))}
                    placeholder={form.selectedTeamUser ? 'Role (e.g., Developer, Designer)' : 'Select a team member first'}
                    disabled={!form.selectedTeamUser}
                    className={(errors.teamRoleInput ? 'error' : '') + (!form.selectedTeamUser ? ' disabled' : '')}
                  />
                  <button
                    type="button"
                    className="add-member-btn"
                    onClick={handleAddTeamMember}
                    disabled={!form.selectedTeamUser || !form.teamRoleInput.trim()}
                  >
                    ➕ Add Member
                  </button>
                </div>
              </div>

              {/* Team List */}
              {form.team.length > 0 && (
                <div className="team-list">
                  <h4>Team Members ({form.team.length})</h4>
                  {form.team.map((member, index) => (
                    <motion.div
                      key={index}
                      className="team-member-item"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <div className="member-info">
                        <div className="member-name">{member.name || member.email}</div>
                        <div className="member-role">{member.role}</div>
                        <div className="member-email">{member.email}</div>
                      </div>
                      <button
                        type="button"
                        className="remove-member-btn"
                        onClick={() => handleRemoveTeamMember(index)}
                      >
                        🗑️
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* File Upload */}
            <div className="form-section">
              <h3 className="section-title">📎 Project Files</h3>
              <p className="file-hint">Upload project files (PDF, PPT, Word only)</p>

              <div className="file-upload-area">
                <input
                  type="file"
                  id="file-input"
                  multiple
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="file-input" className="file-upload-label">
                  <div className="file-upload-icon">📁</div>
                  <div>Click to upload or drag files here</div>
                  <div className="file-upload-hint">PDF, PPT, WORD</div>
                </label>
              </div>

              {errors.files && <span className="error-msg">{errors.files}</span>}

              {/* Files List */}
              {form.fileInputs.length > 0 && (
                <div className="files-list">
                  <h4>Files ({form.fileInputs.length})</h4>
                  {form.fileInputs.map((file, index) => (
                    <motion.div
                      key={index}
                      className="file-item"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => handleRemoveFile(index)}
                      >
                        ✕
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {errors.submit && <div className="error-alert">{errors.submit}</div>}

            {/* Form Actions */}
            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddProjectForm;
