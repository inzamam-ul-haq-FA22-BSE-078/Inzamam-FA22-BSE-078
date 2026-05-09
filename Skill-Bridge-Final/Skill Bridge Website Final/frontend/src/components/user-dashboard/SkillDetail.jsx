import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Skills.css';

// Helper: find skill by id across all users' skills stored in localStorage
const findSkillByIdLocal = (id) => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('skills_')) continue;
    try {
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      const found = arr.find(s => String(s.id) === String(id));
      if (found) return found;
    } catch (e) {}
  }
  return null;
};

const SkillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);

  const getEntityLabel = (entity) => {
    if (!entity) return '';
    if (typeof entity === 'string') return entity;
    if (typeof entity === 'object') {
      if (entity.name) return entity.name;
      if (entity.label) return entity.label;
      if (entity._id) return String(entity._id);
      return JSON.stringify(entity);
    }
    return String(entity);
  };

  const getSkillTags = (tags = []) => {
    if (!Array.isArray(tags)) return [];
    return tags
      .map(tag => {
        if (!tag) return '';
        if (typeof tag === 'string') return tag;
        if (typeof tag === 'object') return tag.name || tag.label || (tag._id ? String(tag._id) : '');
        return String(tag);
      })
      .filter(Boolean);
  };

  useEffect(() => {
    const load = async () => {
      // try server first
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      try {
        const res = await fetch(`${apiBase}/api/skills/${id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.skill) {
            setSkill(json.skill);
            return;
          }
        }
      } catch (e) {
        // ignore server errors and fallback to local
      }

      // fallback to localStorage
      const s = findSkillByIdLocal(id);
      if (s) setSkill(s);
    };
    load();
  }, [id]);

  if (!skill) {
    return (
      <div className="page-content skill-detail-page">
        <div className="empty-state">
          <h3>Skill not found</h3>
          <p>This skill may have been removed or is not accessible.</p>
          <button className="btn" onClick={() => navigate(-1)}>Go back</button>
        </div>
      </div>
    );
  }

  const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const resolveUrl = (p) => {
    if (!p) return null;
    if (p.startsWith('data:') || p.startsWith('http')) return p;
    if (p.startsWith('/')) return `${apiBase}${p}`;
    return p;
  };

  const resolvedCategoryLabel = getEntityLabel(skill.category);
  const resolvedSubcategoryLabel = getEntityLabel(skill.subcategory);
  const resolvedTagList = getSkillTags(skill.tags);

  // Start a conversation with the skill owner and open Inbox (same behavior as Skills page)
  const handleChatWithOwner = async (owner) => {
    const ownerId = owner && (owner._id || owner.id || owner);
    if (!ownerId) {
      // fallback: just open inbox
      navigate('/dashboard?tab=inbox');
      return;
    }

    const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const token = localStorage.getItem('token');

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

  return (
    <div className='skill-detail-imp'>
    <motion.div className="page-content skill-detail-page" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
      <div className="skill-detail-card">
        {/* Top: full-width cover image */}
        <div className="skill-detail-media">
          <img src={resolveUrl(skill.skillImage) || '/placeholder.png'} alt={skill.title} onError={(e) => { try { e.currentTarget.onerror = null; e.currentTarget.src = '/placeholder.png'; } catch (err) {} }} />
          {skill.badgeStatus && (
            <span className={`skill-badge detail-badge ${skill.badgeStatus === 'verified' ? 'verified' : 'unverified'}`}>
              {skill.badgeStatus === 'verified' ? 'Verified' : 'Unverified'}{skill.badgeLevel ? ` • ${skill.badgeLevel}` : ''}
            </span>
          )}
          <span className="created-at">Added: {new Date(skill.createdAt).toLocaleString()}</span>

        </div>


        <div className="skill-detail-body">
          {/* Tags */}
          {resolvedTagList.length > 0 && (
            <div className="skill-detail-tags">
              <span className="tag-heading">Tags:</span>
              {resolvedTagList.map((t) => (<span key={t} className="tag">{t}</span>))}
            </div>
          )}

          {/* Title */}
          <h1 className="skill-detail-title">{skill.title}</h1>

          {/* Category & Subcategory */}
          <p className="skill-detail-meta">
            <strong>Category:</strong> {resolvedCategoryLabel || '-'}
            {resolvedSubcategoryLabel ? <><span className="meta-sep">·</span> <strong>{resolvedSubcategoryLabel}</strong></> : null}
          </p>

          {/* Short description */}
          {skill.shortDescription && (
            <div className="skill-shortdesc-section">
              <h3 className="section-heading">Short Description</h3>
              <p className="skill-shortdesc">{skill.shortDescription}</p>
            </div>
          )}

          {/* Full (long) description */}
          {skill.fullDescription && (
            <div className="skill-detail-desc">
              <h3 className="section-heading">Long Description</h3>
              <p>{skill.fullDescription}</p>
            </div>
          )}

          {/* Image gallery */}
          {skill.imageGallery && skill.imageGallery.length > 0 && (
            <div className="skill-gallery-section">
              <h3 className="section-heading">Image Gallery</h3>
              <div className="skill-gallery">
                {skill.imageGallery.map((src, idx) => (
                  <img key={idx} src={resolveUrl(src)} alt={`gallery-${idx}`} className="gallery-thumb" onError={(e)=>{ try{ e.currentTarget.onerror=null; e.currentTarget.src='/placeholder.png'; }catch(err){} }} />
                ))}
              </div>
            </div>
          )}

          {/* Videos */}
          {skill.videos && skill.videos.length > 0 && (
            <div className="skill-videos-section">
              <h3 className="section-heading">Videos</h3>
              <div className="skill-videos">
                {skill.videos.map((src, idx) => (
                  <video key={idx} className="skill-video" controls src={resolveUrl(src)} />
                ))}
              </div>
            </div>
          )}

          <div className="skill-detail-footer">
            <button className="btn chat-btn" onClick={() => handleChatWithOwner(skill.owner)}>Chat</button>
          </div>
        </div>
      </div>
    </motion.div>
    </div>
  );
};

export default SkillDetail;
