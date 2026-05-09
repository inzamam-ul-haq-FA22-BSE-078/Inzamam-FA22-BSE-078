import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import './AddSkill.css';
import './EditProfileForm.css';

const CATEGORIES = [
  {
    id: 'dev',
    label: 'Development & Tech',
    subcategories: ['Frontend Development', 'Backend Development', 'Full Stack Development', 'Mobile App Development', '3D & Creative Development', 'Game Development', 'CMS Development', 'API & Integrations'],
    tags: ['React.js', 'Next.js', 'JavaScript', 'TypeScript', 'Node.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'Firebase', 'Three.js', 'WebGL', 'GLSL', 'WordPress', 'PHP', 'Python', 'REST API', 'GraphQL'],
  },
  {
    id: 'design',
    label: 'Design & Creative',
    subcategories: ['UI/UX Design', 'Web Design', 'Graphic Design', 'Brand Identity', 'Motion Graphics', '3D Design'],
    tags: ['Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Canva', 'Branding', 'Wireframing', 'Prototyping', 'UI Design', 'UX Research', 'Blender', 'After Effects'],
  },
  {
    id: 'teaching',
    label: 'Teaching & Mentorship',
    subcategories: ['Programming Tutoring', 'Design Mentorship', 'Music Lessons', 'Language Teaching', 'Academic Tutoring', 'Career Guidance'],
    tags: ['JavaScript Teaching', 'React Coaching', 'Web Development Mentor', 'UI/UX Mentor', 'English Speaking', 'Guitar Lessons', 'Piano Lessons', 'Career Coaching', 'Interview Preparation'],
  },
  {
    id: 'marketing',
    label: 'Content & Digital Marketing',
    subcategories: ['SEO Optimization', 'Social Media Marketing', 'Content Writing', 'Copywriting', 'Video Marketing', 'Email Marketing'],
    tags: ['SEO', 'On-Page SEO', 'Keyword Research', 'Content Writing', 'Blog Writing', 'Copywriting', 'Social Media Strategy', 'Instagram Marketing', 'YouTube SEO', 'Email Campaigns'],
  },
  {
    id: 'animation',
    label: 'Video & Animation',
    subcategories: ['Video Editing', '2D Animation', '3D Animation', 'Motion Graphics', 'Explainer Videos'],
    tags: ['Video Editing', 'Premiere Pro', 'After Effects', 'DaVinci Resolve', 'Motion Graphics', '2D Animation', '3D Animation', 'Blender', 'Explainer Videos', 'Storyboarding'],
  },
  {
    id: 'ai',
    label: 'AI & Automation',
    subcategories: ['AI Prompt Engineering', 'Automation Scripts', 'Chatbot Development', 'AI Content Creation', 'Workflow Automation'],
    tags: ['Prompt Engineering', 'ChatGPT', 'AI Automation', 'Python Automation', 'Zapier', 'Make.com', 'Chatbot Development', 'OpenAI API', 'AI Tools', 'Workflow Automation'],
  },
  {
    id: 'business',
    label: 'Business & Freelancing Skills',
    subcategories: ['Project Management', 'Client Communication','Proposal Writing', 'Negotiation Skills', 'Freelancing Mentorship', 'Startup Guidance'],
    tags: ['Project Management', 'Agile', 'Scrum', 'Client Handling', 'Proposal Writing', 'Freelancing Tips', 'Negotiation Skills', 'Business Strategy', 'Startup Mentoring'],
  },
  {
    id: 'art',
    label: 'Art & Illustration',
    subcategories: ['Digital Art', 'Illustration', 'Concept Art', 'NFT Art', 'Character Design', 'Traditional Art'],
    tags: ['Digital Art', 'Illustration', 'Concept Art', 'NFT Art', 'Character Design', 'Procreate', 'Photoshop Art', 'Sketching', 'Line Art', 'Coloring'],
  },
];

const toBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const MAX_IMAGE_BYTES = 5000 * 1024;
const MAX_VIDEO_BYTES = 10 * 1024 * 1024;

const EditSkill = ({ skillId: propSkillId }) => {
  const navigate = useNavigate();
  const { skillId } = useParams();
  const id = propSkillId || skillId;
  
  const [serverCategories, setServerCategories] = useState(CATEGORIES);
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [skill, setSkill] = useState(null);
  const [showUnverifiedModal, setShowUnverifiedModal] = useState(false);

  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    category: '',
    subcategory: '',
    tags: [],
    tagInput: '',
    skillImage: null,
    imageGallery: [],
    videos: [],
    skillImageFile: null,
    imageGalleryFiles: [],
    videoFiles: [],
  });

  const [errors, setErrors] = useState({});
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [publishing, setPublishing] = useState(false);

  // Fetch skill on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/skills/categories`);
        const json = await res.json();
        if (json && json.success && Array.isArray(json.categories)) setServerCategories(json.categories);
      } catch (e) {
        console.error('Failed to fetch categories', e);
      }

      try {
        const skillRes = await fetch(`${API_BASE}/api/skills/${id}`);
        if (!skillRes.ok) throw new Error('Failed to fetch skill');
        const skillJson = await skillRes.json();
        if (!skillJson.success || !skillJson.skill) throw new Error('Skill not found');
        const s = skillJson.skill;

        // Check badge status
        if (s.badgeStatus !== 'unverified') {
          setShowUnverifiedModal(true);
          return;
        }

        setSkill(s);
        setForm({
          title: s.title || '',
          shortDescription: s.shortDescription || '',
          fullDescription: s.fullDescription || '',
          category: s.category ? (typeof s.category === 'object' ? (s.category._id || s.category.id || '') : s.category) : '',
          subcategory: s.subcategory ? (typeof s.subcategory === 'object' ? (s.subcategory._id || s.subcategory.id || '') : s.subcategory) : '',
          tags: Array.isArray(s.tags) ? s.tags.map(t => (typeof t === 'object' ? (t.name || t.label || t._id || '') : t)).filter(Boolean) : [],
          tagInput: '',
          skillImage: s.skillImage ? (s.skillImage.startsWith('/') ? `${API_BASE}${s.skillImage}` : s.skillImage) : null,
          imageGallery: Array.isArray(s.imageGallery) ? s.imageGallery.map(g => (g && g.startsWith('/') ? `${API_BASE}${g}` : g)) : [],
          videos: Array.isArray(s.videos) ? s.videos : [],
          skillImageFile: null,
          imageGalleryFiles: [],
          videoFiles: [],
        });
      } catch (err) {
        console.error('Failed to load skill', err);
        setSkill(null);
      }
      setLoading(false);
    })();
  }, [id]);

  useEffect(() => {
    const cat = serverCategories.find(c => c.id === form.category);
    const allowed = cat ? cat.tags : [];
    const q = form.tagInput.trim().toLowerCase();
    if (q) {
      setTagSuggestions(allowed.filter(t => t.toLowerCase().includes(q) && !form.tags.includes(t)));
    } else setTagSuggestions([]);
  }, [form.category, form.tagInput, form.tags, serverCategories]);

  const currentCategory = serverCategories.find(c => c.id === form.category);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: null }));
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, category: value, subcategory: '', tags: [], tagInput: '' }));
    setErrors(prev => ({ ...prev, category: null }));
  };

  const addTag = (tag) => {
    if (!tag || form.tags.includes(tag)) return;
    setForm(prev => ({ ...prev, tags: [...prev.tags, tag], tagInput: '' }));
    setTagSuggestions([]);
  };

  const removeTag = (tag) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleTagKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cat = CATEGORIES.find(c => c.id === form.category);
      const allowed = cat ? cat.tags.map(t => t.toLowerCase()) : [];
      const q = form.tagInput.trim();
      if (q && allowed.includes(q.toLowerCase())) addTag(cat.tags[allowed.indexOf(q.toLowerCase())]);
      else setErrors(prev => ({ ...prev, tags: 'Tag not allowed for selected category' }));
    }
  };

  const handleSkillImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setErrors(prev => ({ ...prev, skillImage: `Image too large (max ${Math.round(MAX_IMAGE_BYTES / 1024)}KB)` }));
      return;
    }
    const data = await toBase64(file);
    setForm(prev => ({ ...prev, skillImage: data, skillImageFile: file }));
  };

  const handleGallery = async (e) => {
    const files = Array.from(e.target.files || []);
    const allowed = files.filter(f => f.size <= MAX_IMAGE_BYTES);
    const rejected = files.filter(f => f.size > MAX_IMAGE_BYTES);
    if (rejected.length > 0) {
      setErrors(prev => ({ ...prev, imageGallery: `Some images too large (max ${Math.round(MAX_IMAGE_BYTES / 1024)}KB)` }));
    }
    if (allowed.length === 0) return;
    const results = await Promise.all(allowed.map(f => toBase64(f)));
    setForm(prev => ({ ...prev, imageGallery: [...prev.imageGallery, ...results], imageGalleryFiles: [...prev.imageGalleryFiles, ...allowed] }));
  };

  const handleVideos = async (e) => {
    const files = Array.from(e.target.files || []);
    const allowed = files.filter(f => f.size <= MAX_VIDEO_BYTES);
    const rejected = files.filter(f => f.size > MAX_VIDEO_BYTES);
    if (rejected.length > 0) {
      setErrors(prev => ({ ...prev, videos: `Some videos too large (max ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)}MB)` }));
    }
    if (allowed.length === 0) return;
    const results = await Promise.all(allowed.map(f => toBase64(f)));
    setForm(prev => ({ ...prev, videos: [...prev.videos, ...results], videoFiles: [...prev.videoFiles, ...allowed] }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.shortDescription.trim()) errs.shortDescription = 'Short description is required';
    if (!form.fullDescription.trim()) errs.fullDescription = 'Full description is required';
    if (!form.category) errs.category = 'Category is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!form.skillImage) errs.skillImage = 'Skill image is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (step === 1 && validateStep1()) setStep(2);
  };

  const back = () => setStep(Math.max(1, step - 1));

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!validateStep2()) return;
    setPublishing(true);

    const token = localStorage.getItem('token');
    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    let uploadedFiles = {};

    try {
      const formData = new FormData();
      if (form.skillImageFile) formData.append('skillImage', form.skillImageFile);
      if (form.imageGalleryFiles && form.imageGalleryFiles.length > 0) form.imageGalleryFiles.forEach(f => formData.append('gallery', f));
      if (form.videoFiles && form.videoFiles.length > 0) form.videoFiles.forEach(f => formData.append('videos', f));

      if ((form.skillImageFile || (form.imageGalleryFiles && form.imageGalleryFiles.length) || (form.videoFiles && form.videoFiles.length)) && token) {
        const res = await fetch(`${apiBase}/api/skills/uploads`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        const json = await res.json();
        if (json.success) uploadedFiles = json.files || {};
      }

      if (token && id) {
        const updateRes = await fetch(`${apiBase}/api/skills/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: form.title,
            shortDescription: form.shortDescription,
            fullDescription: form.fullDescription,
            category: form.category,
            subcategory: form.subcategory,
            tags: form.tags,
            skillImage: uploadedFiles.skillImage || form.skillImage || null,
            imageGallery: uploadedFiles.gallery || form.imageGallery || [],
            videos: uploadedFiles.videos || form.videos || [],
          }),
        });
        if (!updateRes.ok) {
          const body = await updateRes.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to update skill');
        }
        const updateJson = await updateRes.json();
        if (updateJson.success) {
          alert('Skill updated successfully');
          navigate('/dashboard?tab=skills');
          return;
        }
        throw new Error(updateJson.message || 'Update failed');
      }
    } catch (err) {
      console.error('Error updating skill:', err);
      setErrors(prev => ({ ...prev, submit: 'Failed to update skill. ' + (err.message || '') }));
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <motion.div
        className="page-content add-skill-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="loading-spinner">Loading skill...</div>
      </motion.div>
    );
  }

  if (showUnverifiedModal) {
    return (
      <motion.div
        className="page-content add-skill-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="edit-restriction-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => navigate('/dashboard?tab=skills')}
        >
          <motion.div
            className="edit-restriction-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-edit">
              <h3>⚠️ Edit Restricted</h3>
              <button
                className="modal-close-btn-edit"
                onClick={() => navigate('/dashboard?tab=skills')}
              >
                ✕
              </button>
            </div>

            <div className="modal-body-edit">
              <p>You can only edit a skill if it has an <strong>unverified</strong> badge.</p>
              <p>Once a skill is verified, it cannot be edited to maintain data integrity.</p>
            </div>

            <div className="modal-footer-edit">
              <motion.button
                className="modal-btn-ok"
                onClick={() => navigate('/dashboard?tab=skills')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                OK
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  if (!skill) {
    return (
      <motion.div
        className="page-content add-skill-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h3>Skill not found</h3>
          <p>The skill you're trying to edit doesn't exist</p>
          <motion.button
            className="edit-profile-btn-hero"
            onClick={() => navigate('/dashboard?tab=skills')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Skills
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="page-content add-skill-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <h1>Edit Skill</h1>
        <p>Update your skill details</p>
      </div>

      <div className="progress-section">
        <div className="progress-steps">
          <div className={`step ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Details</div>
          </div>
          <div className={`step ${step === 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Media</div>
          </div>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${(step - 1) / 1 * 100}%` }} />
        </div>
      </div>

      <motion.form className="form-content add-skill-form" onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="step-content">
            <h3 className="step-title">Step 1 — Skill Details</h3>

            <div className="form-section">
              <div className="form-group">
                <label>Title *</label>
                <input name="title" value={form.title} onChange={handleChange} />
                {errors.title && <span className="error-message">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label>Short Description *</label>
                <textarea name="shortDescription" value={form.shortDescription} onChange={handleChange} rows="3" />
                {errors.shortDescription && <span className="error-message">{errors.shortDescription}</span>}
              </div>

              <div className="form-group">
                <label>Full Description *</label>
                <textarea name="fullDescription" value={form.fullDescription} onChange={handleChange} rows="5" />
                {errors.fullDescription && <span className="error-message">{errors.fullDescription}</span>}
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select name="category" value={form.category} onChange={handleCategoryChange}>
                  <option value="">Select Category</option>
                  {serverCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                {errors.category && <span className="error-message">{errors.category}</span>}
              </div>

              <div className="form-group">
                <label>Subcategory</label>
                <select name="subcategory" value={form.subcategory} onChange={handleChange} disabled={!currentCategory}>
                  <option value="">Select Subcategory</option>
                  {currentCategory?.subcategories.map(s => {
                    const subId = (typeof s === 'object' ? (s.id || s._id) : s);
                    const subLabel = (typeof s === 'object' ? (s.label || s.name) : s);
                    return <option key={subId || subLabel} value={subId || subLabel}>{subLabel || subId}</option>;
                  })}
                </select>
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div className="tag-input-wrapper">
                  <input
                    type="text"
                    name="tagInput"
                    value={form.tagInput}
                    onChange={handleChange}
                    onKeyDown={handleTagKey}
                    placeholder="Type and press Enter to add tags"
                  />
                  {tagSuggestions.length > 0 && (
                    <div className="tag-suggestions">
                      {tagSuggestions.map(tag => (
                        <div key={tag} className="suggestion-item" onClick={() => addTag(tag)}>
                          {tag}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="tags-display">
                  {form.tags.map(tag => (
                    <span key={tag} className="tag-badge">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="tag-remove">×</button>
                    </span>
                  ))}
                </div>
                {errors.tags && <span className="error-message">{errors.tags}</span>}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/dashboard?tab=skills')} className="cancel-btn">Cancel</button>
              <button type="button" onClick={next} className="next-btn">Next</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h3 className="step-title">Step 2 — Media</h3>

            <div className="form-section">
              <div className="form-group">
                <label>Skill Image *</label>
                <div className="image-upload-box">
                  {form.skillImage && <img src={form.skillImage} alt="preview" className="image-preview" />}
                  <label className="upload-label">
                    <input type="file" accept="image/*" onChange={handleSkillImage} />
                    <span>{form.skillImage ? 'Change Image' : 'Upload Image'}</span>
                  </label>
                </div>
                {errors.skillImage && <span className="error-message">{errors.skillImage}</span>}
              </div>

              <div className="form-group">
                <label>Image Gallery</label>
                <div className="file-upload-box">
                  <label className="upload-label">
                    <input type="file" multiple accept="image/*" onChange={handleGallery} />
                    <span>Upload Images</span>
                  </label>
                </div>
                {form.imageGallery.length > 0 && (
                  <div className="gallery-preview">
                    {form.imageGallery.map((img, idx) => (
                      <img key={idx} src={img} alt="gallery" className="gallery-thumb" />
                    ))}
                  </div>
                )}
                {errors.imageGallery && <span className="error-message">{errors.imageGallery}</span>}
              </div>

              <div className="form-group">
                <label>Videos</label>
                <div className="file-upload-box">
                  <label className="upload-label">
                    <input type="file" multiple accept="video/*" onChange={handleVideos} />
                    <span>Upload Videos</span>
                  </label>
                </div>
                {errors.videos && <span className="error-message">{errors.videos}</span>}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={back} className="back-btn">Back</button>
              <button type="submit" disabled={publishing} className="submit-btn">
                {publishing ? 'Updating...' : 'Update Skill'}
              </button>
            </div>
          </div>
        )}
      </motion.form>
    </motion.div>
  );
};

export default EditSkill;
