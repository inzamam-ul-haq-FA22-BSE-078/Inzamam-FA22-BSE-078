import React from 'react';
import './MySkills.css';

const formatCategoryLabel = (cat) => {
  if (!cat) return '-';
  if (typeof cat === 'string') return cat;
  if (typeof cat === 'object') return cat.name || cat.label || cat.id || cat._id || '-';
  return String(cat);
};

const formatTagLabel = (tag) => {
  if (!tag) return '';
  if (typeof tag === 'string') return tag;
  if (typeof tag === 'object') return tag.name || tag.label || tag.id || tag._id || '';
  return String(tag);
};

const MySkills = ({ skills, onEdit, onReadMore, getMediaUrl, truncateWords }) => {
  return (
    <div className="user-skills-section">
      <div className="user-skills-grid">
        {skills.map((skill) => (
          <div key={skill.id} className="skill-box">
            <div className="skill-image">
              <img 
                src={getMediaUrl(skill.skillImage) || '/placeholder.png'} 
                alt={skill.title} 
                onError={(e) => { 
                  e.currentTarget.onerror = null; 
                  e.currentTarget.src = '/placeholder.png'; 
                }} 
              />
              {skill.badgeStatus && (
                <span className={`skill-badge ${skill.badgeStatus === 'verified' ? 'verified' : 'unverified'}`}>
                  {skill.badgeStatus === 'verified' ? 'Verified' : 'Unverified'}
                </span>
              )}
            </div>
            <div className="skill-body">
              <h4 className="skill-title">{skill.title}</h4>
              <p className="skill-desc">{truncateWords(skill.shortDescription, 20)}</p>
              <div className="skill-actions split">
                <button className="btn-primary left-btn" onClick={() => onReadMore(skill)}>View Details</button>
                {skill.badgeStatus === 'unverified' && (
                  <button className="btn-secondary right-btn" onClick={() => onEdit(skill)}>Edit</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MySkills;
