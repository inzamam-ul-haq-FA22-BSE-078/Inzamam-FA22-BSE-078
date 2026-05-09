import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './AddSkill.css';
import './EditProfileForm.css';

// Constants for file size limits
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_VERIFICATION_DOC_BYTES = 5 * 1024 * 1024; // 5MB per document

// Utility function to convert file to base64
const toBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

const AddSkill = ({ user: propUser }) => {
  const navigate = useNavigate();
  const userData = propUser || (localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null);
  const [serverCategories, setServerCategories] = useState([]);
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // try to fetch authoritative categories from server (fallback to local CATEGORIES)
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/skills/categories`);
        const json = await res.json();
        if (json && json.success && Array.isArray(json.categories)) setServerCategories(json.categories);
      } catch (e) {
        // ignore, fallback to local CATEGORIES
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    shortDescription: '',
    fullDescription: '',
    category: '',
    subcategory: '',
    tags: [],
    tagInput: '',
    // previews (data URLs) for UI
    skillImage: null,
    imageGallery: [],
    videos: [],
    verificationDocs: [],
    // file objects for upload
    skillImageFile: null,
    imageGalleryFiles: [],
    videoFiles: [],
    verificationDocFiles: [],
  });

  const [errors, setErrors] = useState({});
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [showLegalWarning, setShowLegalWarning] = useState(false);

  useEffect(() => {
    const cat = serverCategories.find(c => c.id === form.category);
    const sub = cat?.subcategories?.find(s => s.id === form.subcategory);
    const allowed = sub ? sub.tags : [];
    const q = form.tagInput.trim().toLowerCase();
    if (q) {
      setTagSuggestions(allowed.filter(t => t.toLowerCase().includes(q) && !form.tags.includes(t)));
    } else setTagSuggestions([]);
  }, [form.category, form.subcategory, form.tagInput, form.tags, serverCategories]);

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

  const handleSubcategoryChange = (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, subcategory: value, tags: [], tagInput: '' }));
    setErrors(prev => ({ ...prev, subcategory: null }));
  };

  const addTag = (tag) => {
    if (!tag) return;
    if (form.tags.includes(tag)) return;
    setForm(prev => ({ ...prev, tags: [...prev.tags, tag], tagInput: '' }));
    setTagSuggestions([]);
    setErrors(prev => ({ ...prev, tags: null }));
  };

  const removeTag = (tag) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleTagKey = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cat = serverCategories.find(c => c.id === form.category);
      const sub = cat?.subcategories?.find(s => s.id === form.subcategory);
      const allowed = sub ? sub.tags.map(t => t.toLowerCase()) : [];
      const q = form.tagInput.trim();
      if (q && allowed.includes(q.toLowerCase())) addTag(sub.tags[allowed.indexOf(q.toLowerCase())]);
      else setErrors(prev => ({ ...prev, tags: 'Tag not allowed for selected subcategory' }));
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
    setErrors(prev => ({ ...prev, skillImage: null }));
  };

  const handleGallery = async (e) => {
    const files = Array.from(e.target.files || []);
    const allowed = files.filter(f => f.size <= MAX_IMAGE_BYTES);
    const rejected = files.filter(f => f.size > MAX_IMAGE_BYTES);
    if (rejected.length > 0) {
      setErrors(prev => ({ ...prev, imageGallery: `Some images were too large and were skipped (max ${Math.round(MAX_IMAGE_BYTES / 1024)}KB)` }));
    }
    if (allowed.length === 0) return;
    const results = await Promise.all(allowed.map(f => toBase64(f)));
    setForm(prev => ({ ...prev, imageGallery: [...prev.imageGallery, ...results], imageGalleryFiles: [...prev.imageGalleryFiles, ...allowed] }));
    setErrors(prev => ({ ...prev, imageGallery: null }));
  };

  const handleVideos = async (e) => {
    const files = Array.from(e.target.files || []);
    const allowed = files.filter(f => f.size <= MAX_VIDEO_BYTES);
    const rejected = files.filter(f => f.size > MAX_VIDEO_BYTES);
    if (rejected.length > 0) {
      setErrors(prev => ({ ...prev, videos: `Some videos were too large and were skipped (max ${Math.round(MAX_VIDEO_BYTES / 1024 / 1024)}MB)` }));
    }
    if (allowed.length === 0) return;
    const results = await Promise.all(allowed.map(f => toBase64(f)));
    setForm(prev => ({ ...prev, videos: [...prev.videos, ...results], videoFiles: [...prev.videoFiles, ...allowed] }));
    setErrors(prev => ({ ...prev, videos: null }));
  };

  const handleVerificationDocs = async (e) => {
    const files = Array.from(e.target.files || []);
    const allowed = files.filter(f => f.size <= MAX_VERIFICATION_DOC_BYTES);
    const rejected = files.filter(f => f.size > MAX_VERIFICATION_DOC_BYTES);
    if (rejected.length > 0) {
      setErrors(prev => ({ ...prev, verificationDocs: `Some documents were too large and were skipped (max ${Math.round(MAX_VERIFICATION_DOC_BYTES / 1024 / 1024)}MB each)` }));
    }
    if (allowed.length === 0) return;
    const results = await Promise.all(allowed.map(async (f) => ({ name: f.name, data: await toBase64(f) })));
    setForm(prev => ({
      ...prev,
      verificationDocs: [...prev.verificationDocs, ...results],
      verificationDocFiles: [...prev.verificationDocFiles, ...allowed]
    }));
    setErrors(prev => ({ ...prev, verificationDocs: null }));
  };

  const removeVerificationDoc = (index) => {
    setForm(prev => ({
      ...prev,
      verificationDocs: prev.verificationDocs.filter((_, i) => i !== index),
      verificationDocFiles: prev.verificationDocFiles.filter((_, i) => i !== index)
    }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.shortDescription.trim()) errs.shortDescription = 'Short description is required';
    if (!form.fullDescription.trim()) errs.fullDescription = 'Full description is required';
    if (!form.category) errs.category = 'Category is required';
    // subcategory and tags are optional now
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }; 

  const validateStep2 = () => {
    const errs = {};
    if (!form.skillImage) errs.skillImage = 'Skill image is required';
    if (!form.verificationDocs || form.verificationDocs.length === 0) errs.verificationDocs = 'At least one verification document is required';
    // image gallery and videos are optional now
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }; 

  const next = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    }
  };

  const back = () => setStep(Math.max(1, step - 1));

  const handleSubmit = (e) => {
    e && e.preventDefault();
    if (!validateStep2()) return;
    setShowLegalWarning(true);
  };

  const proceedWithSubmit = async () => {
    setShowLegalWarning(false);
    setPublishing(true);

    setErrors(prev => ({ ...prev, submit: null }));

    const token = localStorage.getItem('token');
    const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    // If files exist, upload them to server first
    let uploadedFiles = {};

    try {
      const formData = new FormData();
      if (form.skillImageFile) formData.append('skillImage', form.skillImageFile);
      if (form.imageGalleryFiles && form.imageGalleryFiles.length > 0) form.imageGalleryFiles.forEach(f => formData.append('gallery', f));
      if (form.videoFiles && form.videoFiles.length > 0) form.videoFiles.forEach(f => formData.append('videos', f));
      if (form.verificationDocFiles && form.verificationDocFiles.length > 0) form.verificationDocFiles.forEach(f => formData.append('verificationDocs', f));

      if ((form.skillImageFile || (form.imageGalleryFiles && form.imageGalleryFiles.length) || (form.videoFiles && form.videoFiles.length) || (form.verificationDocFiles && form.verificationDocFiles.length)) && token) {
        const res = await fetch(`${apiBase}/api/skills/uploads`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) throw new Error('Upload failed');
        const json = await res.json();
        if (json.success) uploadedFiles = json.files || {};
      }

      // Create skill record on server
      if (token) {
        const createRes = await fetch(`${apiBase}/api/skills`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            title: form.title,
            shortDescription: form.shortDescription,
            fullDescription: form.fullDescription,
            category: form.category,
            subcategory: form.subcategory,
            tags: form.tags,
            skillImage: uploadedFiles.skillImage || null,
            imageGallery: uploadedFiles.gallery || [],
            videos: uploadedFiles.videos || [],
            verificationDocs: uploadedFiles.verificationDocs || [],
            badgeStatus: 'unverified',
            badgeLevel: '',
          }),
        });
        if (!createRes.ok) throw new Error('Failed to create skill on server');
        const createJson = await createRes.json();
        if (createJson.success) {
          alert('Skill uploaded successfully');
          setPublishing(false);
          navigate('/dashboard');
          return;
        }
        throw new Error(createJson.message || 'Create failed');
      }

      // Fallback: no token or server unreachable - store locally (keep existing behavior)
      const skills = JSON.parse(localStorage.getItem(`skills_${userData?.email}`) || '[]');
      const newSkill = {
        id: Date.now(),
        title: form.title,
        shortDescription: form.shortDescription,
        fullDescription: form.fullDescription,
        category: form.category,
        subcategory: form.subcategory,
        tags: form.tags,
        skillImage: form.skillImage,
        imageGallery: form.imageGallery,
        videos: form.videos,
        verificationDocs: form.verificationDocs,
        createdAt: new Date().toISOString(),
        badgeStatus: 'unverified',
        badgeLevel: '',
      };
      skills.push(newSkill);
      localStorage.setItem(`skills_${userData?.email}`, JSON.stringify(skills));
      alert('Skill saved locally (offline mode)');
      setPublishing(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Error creating skill:', err);
      setErrors(prev => ({ ...prev, submit: 'Failed to upload skill. ' + (err.message || '') }));
      // attempt fallback local save but warn user
      try {
        const skills = JSON.parse(localStorage.getItem(`skills_${userData?.email}`) || '[]');
        const newSkill = {
          id: Date.now(),
          title: form.title,
          shortDescription: form.shortDescription,
          fullDescription: form.fullDescription,
          category: form.category,
          subcategory: form.subcategory,
          tags: form.tags,
          skillImage: form.skillImage,
          imageGallery: form.imageGallery,
          videos: form.videos,
          verificationDocs: form.verificationDocs,
          createdAt: new Date().toISOString(),
          badgeStatus: 'unverified',
          badgeLevel: '',
        };
        skills.push(newSkill);
        localStorage.setItem(`skills_${userData?.email}`, JSON.stringify(skills));
        alert('Upload failed — saved locally as fallback. Reduce file sizes and try uploading again when online.');
        setPublishing(false);
        navigate('/dashboard');
      } catch (err2) {
        console.error('Fallback save failed:', err2);
        setPublishing(false);
        alert('Upload failed and fallback save was unsuccessful. Reduce file sizes or try again later.');
      }
    }
  };

  return (
    <motion.div
      className="page-content add-skill-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="page-header">
        <h1>Add New Skill</h1>
        <p>Share your expertise with the community</p>
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
                <select name="subcategory" value={form.subcategory} onChange={handleSubcategoryChange} disabled={!currentCategory}>
                  <option value="">Select Subcategory</option>
                  {currentCategory?.subcategories?.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div className="tags-input">
                  {form.tags.map(t => (
                    <span className="tag" key={t}>
                      {t} <button type="button" className="tag-remove" onClick={() => removeTag(t)}>✕</button>
                    </span>
                  ))}
                  <input
                    placeholder={currentCategory ? 'Type tag and press Enter (choose recommended tags)' : 'Choose a category first'}
                    value={form.tagInput}
                    onChange={(e) => setForm(prev => ({ ...prev, tagInput: e.target.value }))}
                    onKeyDown={handleTagKey}
                    disabled={!currentCategory}
                  />
                </div>
                <div className="tag-suggestions">
                  {tagSuggestions.map(s => (
                    <button type="button" key={s} className="suggestion" onClick={() => addTag(s)}>{s}</button>
                  ))}
                </div>
                {errors.tags && <span className="error-message">{errors.tags}</span>}
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => navigate('/profile')}>Cancel</button>
                <button type="button" className="upload-btn" onClick={next}>Next</button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h3 className="step-title">Step 2 — Media Uploads</h3>

            <div className="form-section">
              <div className="form-group profile-upload-container">
                <div className="profile-upload-preview">
                  {form.skillImage ? (
                    <img src={form.skillImage} alt="preview" className="preview-image" />
                  ) : (
                    <div className="preview-image" style={{display:'flex',alignItems:'center',justifyContent:'center',color:'#b8a7ff'}}>No image</div>
                  )}
                </div>
                <div className="upload-controls">
                  <label className="file-upload-label upload-btn">
                    <input type="file" accept="image/*" onChange={handleSkillImage} className="file-input" />
                    Upload Skill Image
                  </label>
                  {errors.skillImage && <span className="error-message">{errors.skillImage}</span>}
                </div>
              </div>

              <div className="form-group">
                <label>Image Gallery</label>
                <input type="file" accept="image/*" multiple onChange={handleGallery} />
                <div className="gallery-preview">
                  {form.imageGallery.map((img, idx) => (
                    <img key={idx} src={img} alt={`gallery-${idx}`} className="preview-thumb" />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Short Videos</label>
                <input type="file" accept="video/*" multiple onChange={handleVideos} />
                <div className="gallery-preview">
                  {form.videos.map((v, idx) => (
                    <video key={idx} src={v} className="preview-thumb" controls />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Verification Documents (PDF/JPG/PNG) *</label>
                <input type="file" accept="application/pdf,image/*" multiple onChange={handleVerificationDocs} />
                {errors.verificationDocs && <span className="error-message">{errors.verificationDocs}</span>}
                <div className="verification-docs-list">
                  {form.verificationDocs.map((doc, idx) => (
                    <div key={idx} className="verification-doc-item">
                      <span>{doc.name || `Document ${idx + 1}`}</span>
                      <button type="button" className="remove-btn" onClick={() => removeVerificationDoc(idx)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={back}>Back</button>
                <button type="button" className="upload-btn" onClick={handleSubmit}>{publishing ? 'Submitting...' : 'Submit Skill'}</button>
              </div>
            </div>
          </div>
        )}
      </motion.form>



      {/* Legal Warning Modal */}
      {showLegalWarning && (
        <div className="modal-overlay" onClick={() => setShowLegalWarning(false)}>
          <div className="modal-content legal-warning-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                <span className="warning-icon">⚠️</span>
                Attention
              </h2>
              <button className="modal-close" onClick={() => setShowLegalWarning(false)}>×</button>
            </div>
            <div className="modal-body">
              <h3>⚠️ Legal Warning</h3>
              <ul className="warning-list">
                <li>• All submitted information and documents must be authentic and legally owned by you.</li>
                <li>• Providing false information or forged documents is strictly prohibited.</li>
                <li>• Any misrepresentation, fraud, or scam activity may result in permanent account suspension.</li>
                <li>• Verified status may be revoked without notice if submitted information is found to be false.</li>
                <li>• Serious violations may lead to legal consequences and reporting to relevant authorities.</li>
              </ul>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={proceedWithSubmit}>I Understand, Proceed</button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default AddSkill;
