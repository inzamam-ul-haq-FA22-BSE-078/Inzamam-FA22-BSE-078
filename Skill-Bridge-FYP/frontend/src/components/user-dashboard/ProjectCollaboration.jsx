import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import './ProjectCollaboration.css';
import AddProjectForm from './AddProjectForm';

const ProjectCollaboration = ({ user }) => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch projects from backend
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search projects
  useEffect(() => {
    let filtered = projects;

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(p => p.status.toLowerCase() === selectedFilter.toLowerCase());
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.title.toLowerCase().includes(term) ||
          p.shortDescription.toLowerCase().includes(term) ||
          p.ownerName.toLowerCase().includes(term)
      );
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, selectedFilter]);

  const handleAddProject = (newProject) => {
    setProjects([newProject, ...projects]);
    setShowAddForm(false);
  };

  const handleUpdateProject = (updatedProject) => {
    setProjects(projects.map(p => p._id === updatedProject._id ? updatedProject : p));
    setEditingProject(null);
    clearProjectEditQuery();
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setProjects(projects.filter(p => p._id !== projectId));
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editProjectId = params.get('editProject');
    if (editProjectId) {
      const projectToEdit = projects.find(p => p._id === editProjectId);
      if (projectToEdit) {
        setEditingProject(projectToEdit);
        setShowAddForm(false);
      }
    } else {
      setEditingProject(null);
    }
  }, [location.search, projects]);

  const clearProjectEditQuery = () => {
    navigate('/dashboard?tab=projects');
  };

  if (loading) {
    return (
      <div className="project-loading">
        <div className="spinner-project"></div>
        <p>Loading your projects...</p>
      </div>
    );
  }

  return (
    <div className="project-collaboration-container">
      {/* Header Section */}
      {/* <motion.div className="project-header" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="header-content">
          <h1 className="header-title">
            <span className="title-icon">🚀</span> Project Collaboration
          </h1>
          <p className="header-subtitle">Manage and collaborate on your projects with your team</p>
        </div>
      </motion.div> */}

      {/* Controls Section */}
      <motion.div
        className="project-controls"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Search Bar */}
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search projects by title, description, or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filters and Button */}
        <div className="controls-row">
          <div className="filters-group">
            <button
              className={`filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              All Projects
            </button>
            <button
              className={`filter-btn ${selectedFilter === 'planning' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('planning')}
            >
              📋 Planning
            </button>
            <button
              className={`filter-btn ${selectedFilter === 'active' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('active')}
            >
              ⚡ Active
            </button>
            <button
              className={`filter-btn ${selectedFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('completed')}
            >
              ✅ Completed
            </button>
          </div>

          <button className="add-project-btn" onClick={() => setShowAddForm(true)}>
            <span className="btn-icon">➕</span>
            <span className="btn-text">New Project</span>
          </button>
        </div>
      </motion.div>

      {/* Projects Grid */}
      <div className="projects-grid-container">
        {filteredProjects.length > 0 ? (
          <motion.div
            className="projects-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, index) => (
                <motion.div
                  key={project._id}
                  className="project-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -8 }}
                >
                  {/* Status Badge */}
                  <div className={`project-status-badge status-${project.status.toLowerCase()}`}>
                    {project.status === 'Planning' && '📋 Planning'}
                    {project.status === 'Active' && '⚡ Active'}
                    {project.status === 'Completed' && '✅ Completed'}
                  </div>

                  {/* Card Header */}
                  <div className="project-card-header">
                    <h3 className="project-title">{project.title}</h3>
                  </div>

                  {/* Card Body */}
                  <div className="project-card-body">
                    <p className="project-owner">
                      <span className="owner-label">Owner:</span>
                      <span className="owner-name">{project.ownerName}</span>
                    </p>
                    <p className="project-description">{project.shortDescription}</p>

                    {/* Team Info */}
                    <div className="team-info">
                      <span className="team-label">👥 Team Members:</span>
                      <span className="team-count">{project.team.length}</span>
                    </div>
                  </div>

                  {/* Card Footer with Buttons */}
                  <div className="project-card-footer">
                    <button
                      className="btn-view-detail"
                      onClick={() => navigate(`/project/${project._id}`)}
                    >
                      View Detail
                    </button>
                    <button
                      className="btn-edit-project"
                      onClick={() => setEditingProject(project)}
                    >
                      Edit
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            className="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="empty-icon">🎯</div>
            <h3>No projects found</h3>
            <p>
              {searchTerm ? 'Try adjusting your search filters' : 'Start by creating your first project'}
            </p>
            <button className="empty-state-btn" onClick={() => setShowAddForm(true)}>
              Create Your First Project
            </button>
          </motion.div>
        )}
      </div>

      {/* Add/Edit Project Form Modal */}
      <AnimatePresence>
        {(showAddForm || editingProject) && (
          <AddProjectForm
            user={user}
            project={editingProject}
            onClose={() => {
              setShowAddForm(false);
              setEditingProject(null);
              clearProjectEditQuery();
            }}
            onSave={editingProject ? handleUpdateProject : handleAddProject}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProjectCollaboration;
