import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './EditProfileForm.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const EditProfileForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    profilePicture: null,
    fullName: '',
    email: '',
    dateOfBirth: '',
    bio: '',
    gender: 'other',
    phoneNo: '',
    country: '',
    address: '',
    skillsDescription: '',
    portfolioLinks: [''],
    socialMediaLinks: {
      instagram: '',
      facebook: '',
      tiktok: '',
      linkedin: '',
      fiverr: '',
    },

    education: [{ degree: '', institute: '', completedYear: new Date().getFullYear() }],
    achievements: '',

    agreeToTerms: false,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data && data.success) {
          setUser(data.user);
          setFormData((prev) => ({
            ...prev,
            email: data.user.email,
            name: data.user.name || data.user.fullName || '',
            fullName: data.user.fullName || data.user.name || '',
            ...data.user,
          }));
          if (data.user.profilePicture) {
            setImagePreview(data.user.profilePicture);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data', error);
      }
    };

    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setFormData((prev) => ({
        ...prev,
        email: parsedUser.email,
        fullName: parsedUser.name || '',
      }));

      const savedProfile = localStorage.getItem(`profile_${parsedUser.email}`);
      if (savedProfile) {
        const existing = JSON.parse(savedProfile);
        setFormData((prev) => ({
          ...prev,
          ...existing,
        }));
        if (existing.profilePicture) {
          setImagePreview(existing.profilePicture);
        }
      } else {
        fetchUserData();
      }
    } else {
      fetchUserData();
    }
  }, [navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          profilePicture: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleArrayInputChange = (e, index, arrayName) => {
    const newArray = [...formData[arrayName]];
    newArray[index] = e.target.value;
    setFormData((prev) => ({
      ...prev,
      [arrayName]: newArray,
    }));
  };

  const addArrayItem = (arrayName) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: [...prev[arrayName], ''],
    }));
  };

  const removeArrayItem = (index, arrayName) => {
    setFormData((prev) => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index),
    }));
  };

  const handleEducationChange = (e, index, field) => {
    const newEducation = [...formData.education];
    newEducation[index][field] = e.target.value;
    setFormData((prev) => ({
      ...prev,
      education: newEducation,
    }));
  };

  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        { degree: '', institute: '', completedYear: new Date().getFullYear() },
      ],
    }));
  };

  const removeEducation = (index) => {
    setFormData((prev) => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.phoneNo.trim()) newErrors.phoneNo = 'Phone number is required';
      if (!formData.country.trim()) newErrors.country = 'Country is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
    }

    if (step === 2) {
      if (formData.education.length === 0)
        newErrors.education = 'At least one education entry is required';
      formData.education.forEach((edu, idx) => {
        if (!edu.degree) newErrors[`degree_${idx}`] = 'Degree is required';
        if (!edu.institute) newErrors[`institute_${idx}`] = 'Institute is required';
      });
    }

    if (step === 3) {
      if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    console.log('Save button clicked');
    console.log('Current step:', currentStep);
    console.log('agreeToTerms:', formData.agreeToTerms);
    
    if (validateStep(currentStep)) {
      try {
        const token = localStorage.getItem('token');
        console.log('Token:', token);
        console.log('Sending formData:', formData);
        
        const response = await fetch('http://localhost:5000/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
          // Also save to localStorage for offline access
          localStorage.setItem(`profile_${user?.email}`, JSON.stringify(formData));
          alert('Profile saved successfully!');
          // Navigate back to dashboard profile tab
          navigate('/dashboard');
        } else {
          alert('Failed to update profile: ' + data.message);
        }
      } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile: ' + error.message);
      }
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="edit-profile-container">
      <div className="edit-profile-header">
        <button className="cancel-btn" onClick={handleCancel}>
          ✕ Cancel
        </button>
        <h1>Complete Your Profile</h1>
        <div style={{ width: '100px' }} />
      </div>

      <div className="progress-section">
        <div className="progress-steps">
          {[1, 2, 3].map((step) => (
            <motion.div
              key={step}
              className={`step ${currentStep === step ? 'active' : ''} ${
                currentStep > step ? 'completed' : ''
              }`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: step * 0.1 }}
            >
              <div className="step-number">{currentStep > step ? '✓' : step}</div>
              <span className="step-label">
                {step === 1 ? 'Basic Info' : step === 2 ? 'Education' : 'Agreement'}
              </span>
            </motion.div>
          ))}
        </div>

        <div className="progress-bar-container">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <motion.div
        className="form-content"
        key={currentStep}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {currentStep === 1 && (
          <div className="step-content">
            <h2 className="step-title">📋 Basic Information</h2>

            <div className="form-section">
              <h3>Profile Picture</h3>
              <div className="profile-upload-container">
                <div className="profile-upload-preview">
                  <img
                    src={
                      imagePreview ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'user'}`
                    }
                    alt="Profile Preview"
                    className="preview-image"
                  />
                </div>
                <div className="upload-controls">
                  <label className="file-upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="file-input"
                    />
                    <span className="upload-btn">Choose Photo</span>
                  </label>
                  <p className="upload-hint">JPG, PNG up to 5MB</p>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>Basic Details</h3>
              <div className="form-group-2col">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className={errors.fullName ? 'error' : ''}
                  />
                  {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="disabled-input"
                  />
                </div>

                <div className="form-group">
                  <label>Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="date-input"
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number *</label>
                  <input
                    type="tel"
                    name="phoneNo"
                    value={formData.phoneNo}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                    className={errors.phoneNo ? 'error' : ''}
                  />
                  {errors.phoneNo && <span className="error-message">{errors.phoneNo}</span>}
                </div>

                <div className="form-group">
                  <label>Country *</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Enter your country"
                    className={errors.country ? 'error' : ''}
                  />
                  {errors.country && <span className="error-message">{errors.country}</span>}
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="select-input"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Address *</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    className={errors.address ? 'error' : ''}
                  />
                  {errors.address && <span className="error-message">{errors.address}</span>}
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3>About You</h3>
              <div className="form-group">
                <label>Bio / Description</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  rows="4"
                  className="textarea-input"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>🎯 Skills & Expertise</h3>
              <div className="form-group">
                <label>Skills Title & Description</label>
                <textarea
                  name="skillsDescription"
                  value={formData.skillsDescription}
                  onChange={handleInputChange}
                  placeholder="Describe your skills and expertise..."
                  rows="4"
                  className="textarea-input"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>🔗 Portfolio Links</h3>
              {formData.portfolioLinks.map((link, idx) => (
                <div key={idx} className="dynamic-input-group">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => handleArrayInputChange(e, idx, 'portfolioLinks')}
                    placeholder="https://example.com/portfolio"
                    className="dynamic-input"
                  />
                  {formData.portfolioLinks.length > 1 && (
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeArrayItem(idx, 'portfolioLinks')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="add-btn"
                onClick={() => addArrayItem('portfolioLinks')}
              >
                + Add Portfolio Link
              </button>
            </div>

            <div className="form-section">
              <h3>📱 Social Media Links</h3>
              <p className="section-description">Add your social media profiles (optional)</p>
              
              <div className="social-media-grid">
                {[
                  { platform: 'instagram', label: 'Instagram', icon: '/instagram logo.jpg', placeholder: 'https://instagram.com/username' },
                  { platform: 'facebook', label: 'Facebook', icon: '/facebook logo.jpg', placeholder: 'https://facebook.com/username' },
                  { platform: 'tiktok', label: 'TikTok', icon: '/tiktok logo.png', placeholder: 'https://tiktok.com/@username' },
                  { platform: 'linkedin', label: 'LinkedIn', icon: '/linkedIn logo.png', placeholder: 'https://linkedin.com/in/username' },
                  { platform: 'fiverr', label: 'Fiverr', icon: '/fiverr logo.png', placeholder: 'https://fiverr.com/username' },
                ].map(({ platform, label, icon, placeholder }) => (
                  <div key={platform} className="form-group social-media-input">
                    <label>
                      <img src={icon} alt={label} className="social-media-label-icon" />
                      {label}
                    </label>
                    <input
                      type="url"
                      value={formData.socialMediaLinks[platform]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        socialMediaLinks: {
                          ...prev.socialMediaLinks,
                          [platform]: e.target.value
                        }
                      }))}
                      placeholder={placeholder}
                      className="social-input"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="step-content">
            <h2 className="step-title">🎓 Education & Achievements</h2>

            <div className="form-section">
              <h3>Educational Details</h3>
              {formData.education.map((edu, idx) => (
                <motion.div
                  key={idx}
                  className="education-block"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="education-header">
                    <h4>Education {idx + 1}</h4>
                    {formData.education.length > 1 && (
                      <button
                        type="button"
                        className="remove-education-btn"
                        onClick={() => removeEducation(idx)}
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  <div className="form-group-2col">
                    <div className="form-group">
                      <label>Degree *</label>
                      <select
                        value={edu.degree}
                        onChange={(e) => handleEducationChange(e, idx, 'degree')}
                        className={errors[`degree_${idx}`] ? 'error' : ''}
                      >
                        <option value="">Select Degree</option>
                        <option value="Bachelor's Degree">Bachelor's Degree</option>
                        <option value="Master's Degree">Master's Degree</option>
                        <option value="Associate Degree / Diploma">Associate Degree / Diploma</option>
                        <option value="Matriculation">Matriculation</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="PhD / Doctoral Degree">PhD / Doctoral Degree</option>
                        <option value="Other">Other</option>
                      </select>
                      {errors[`degree_${idx}`] && (
                        <span className="error-message">{errors[`degree_${idx}`]}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Institute *</label>
                      <input
                        type="text"
                        value={edu.institute}
                        onChange={(e) => handleEducationChange(e, idx, 'institute')}
                        placeholder="Name of your institute"
                        className={errors[`institute_${idx}`] ? 'error' : ''}
                      />
                      {errors[`institute_${idx}`] && (
                        <span className="error-message">{errors[`institute_${idx}`]}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Completed Year</label>
                      <input
                        type="number"
                        value={edu.completedYear}
                        onChange={(e) => handleEducationChange(e, idx, 'completedYear')}
                        placeholder="2024"
                        min="1950"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}

              <button type="button" className="add-btn" onClick={addEducation}>
                + Add Another Education
              </button>
            </div>

            <div className="form-section">
              <h3>🏆 Achievements & Certifications</h3>
              <div className="form-group">
                <label>Achievements</label>
                <textarea
                  name="achievements"
                  value={formData.achievements}
                  onChange={handleInputChange}
                  placeholder="List your achievements, certifications, awards, etc."
                  rows="5"
                  className="textarea-input"
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="step-content">
            <h2 className="step-title">📜 Terms & Agreements</h2>

            <div className="agreement-section">
              <div className="agreement-content">
                <h3>Data Usage & Privacy Agreement</h3>

                <div className="agreement-text">
                  <p>
                    <strong>
                      By completing this profile, you agree to grant Skill Bridge all rights to use
                      the information you provide, including:
                    </strong>
                  </p>

                  <p>
                    <strong>1. Profile Information Usage:</strong> You hereby grant Skill Bridge the right to 
                    display, store, and manage all profile information you provide including your name, email, 
                    profile picture, bio, contact details, education history, skills, achievements, and portfolio 
                    links. This information will be used to help other users discover your skills and connect with you 
                    for skill exchange opportunities.
                  </p>

                  <p>
                    <strong>2. Data Processing and Storage:</strong> Your personal data will be processed and stored 
                    on secure servers operated by Skill Bridge. We implement industry-standard security measures to 
                    protect your information from unauthorized access, alteration, disclosure, or destruction. Your data 
                    may be stored, backed up, and accessed by authorized personnel only for the purpose of maintaining 
                    and improving our services.
                  </p>

                  <p>
                    <strong>3. Privacy and Confidentiality:</strong> We commit to maintaining the confidentiality of your 
                    personal information. Your profile data will only be visible to registered users of Skill Bridge. We 
                    will not sell, trade, or rent your personal information to third parties without your explicit consent. 
                    Any data sharing with third-party service providers will only occur under strict confidentiality agreements.
                  </p>

                  <p>
                    <strong>4. Communication and Marketing:</strong> By agreeing to these terms, you consent to receive 
                    communications from Skill Bridge including platform updates, skill exchange opportunities, notifications 
                    about potential matches, and service announcements. You may opt out of marketing communications at any time 
                    by updating your notification preferences in your account settings.
                  </p>

                  <p>
                    <strong>5. Intellectual Property Rights:</strong> You retain ownership of all content and information you 
                    provide. By uploading content to your profile, you grant Skill Bridge a non-exclusive, worldwide, royalty-free 
                    license to use, display, and distribute your profile information for the purpose of operating the platform.
                  </p>

                  <p>
                    <strong>6. Code of Conduct:</strong> You agree to use Skill Bridge responsibly and ethically. You will not 
                    engage in harassment, discrimination, illegal activities, or any behavior that violates the rights of other users. 
                    Skill Bridge reserves the right to suspend or terminate accounts that violate these terms.
                  </p>

                  <p>
                    <strong>7. Disclaimer of Warranties:</strong> Skill Bridge is provided on an "as-is" and "as-available" basis. 
                    We make no warranties, express or implied, regarding the platform's reliability, accuracy, or fitness for a 
                    particular purpose. Users assume all risks associated with using the platform.
                  </p>

                  <p>
                    <strong>8. Limitation of Liability:</strong> Skill Bridge shall not be liable for any indirect, incidental, 
                    special, consequential, or punitive damages resulting from your use of or inability to use the platform, even if 
                    we have been advised of the possibility of such damages.
                  </p>

                  <p>
                    <strong>9. Modifications to Terms:</strong> Skill Bridge reserves the right to modify these terms and conditions 
                    at any time. We will notify users of significant changes via email or by posting an updated version on our platform. 
                    Your continued use of the platform constitutes acceptance of the modified terms.
                  </p>

                  <p>
                    <strong>10. Account Termination:</strong> Skill Bridge may terminate or suspend your account immediately and without 
                    notice if we determine that you have violated these terms or engaged in conduct that is harmful to the platform or other users. 
                    Upon termination, you lose the right to access your profile and use the platform.
                  </p>

                  <p>
                    <strong>11. Dispute Resolution:</strong> Any disputes arising from the use of Skill Bridge will be subject to binding 
                    arbitration. Both parties agree to resolve disagreements through good-faith negotiation before pursuing legal action.
                  </p>

                  <p>
                    <strong>12. Entire Agreement:</strong> These terms and conditions constitute the entire agreement between you and 
                    Skill Bridge regarding the use of the platform. If any provision is found to be invalid or unenforceable, the remaining 
                    provisions shall continue in full force and effect.
                  </p>
                </div>
              </div>

              <div className="agreement-checkbox">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleInputChange}
                    className={errors.agreeToTerms ? 'error' : ''}
                  />
                  <span className="checkbox-label">
                    I agree to all terms and conditions and grant Skill Bridge the rights mentioned
                    above
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <span className="error-message">{errors.agreeToTerms}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <div className="button-group">
        {currentStep > 1 && (
          <motion.button
            className="btn btn-secondary"
            onClick={handleBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Back
          </motion.button>
        )}

        {currentStep < 3 ? (
          <motion.button
            className="btn btn-primary"
            onClick={handleNext}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Next →
          </motion.button>
        ) : (
          <motion.button
            className="btn btn-success"
            onClick={handleSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ✓ Finish & Save Profile
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default EditProfileForm;