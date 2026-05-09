import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    repeatPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.repeatPassword) {
      newErrors.repeatPassword = 'Please confirm your password';
    } else if (formData.password !== formData.repeatPassword) {
      newErrors.repeatPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/register',
        {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          repeatPassword: formData.repeatPassword,
        }
      );

      if (response.data.success) {
        setSuccess(response.data.message);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setTimeout(() => {
          navigate('/skills');
        }, 1500);
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || 'Registration failed. Please try again.';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const inputVariants = {
    focus: { scale: 1.02 },
    blur: { scale: 1 },
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="auth-container">
      {/* Background Animation */}
      <div className="auth-bg">
        <div className="auth-orb orb-1"></div>
        <div className="auth-orb orb-2"></div>
      </div>

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="auth-header"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 className="auth-title" variants={itemVariants}>
            Create Account
          </motion.h1>
          <motion.p className="auth-subtitle" variants={itemVariants}>
            Join Skill Bridge Community
          </motion.p>
        </motion.div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Name Input */}
          <motion.div
            className="form-group"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <label htmlFor="name">Full Name</label>
            <motion.div
              className="input-wrapper"
              variants={inputVariants}
              whileFocus="focus"
              whileBlur="blur"
            >
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={errors.name ? 'input-error' : ''}
              />
            </motion.div>
            {errors.name && (
              <motion.span
                className="error-message"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.name}
              </motion.span>
            )}
          </motion.div>

          {/* Email Input */}
          <motion.div
            className="form-group"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <label htmlFor="email">Email Address</label>
            <motion.div
              className="input-wrapper"
              variants={inputVariants}
              whileFocus="focus"
              whileBlur="blur"
            >
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={errors.email ? 'input-error' : ''}
              />
            </motion.div>
            {errors.email && (
              <motion.span
                className="error-message"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.email}
              </motion.span>
            )}
          </motion.div>

          {/* Password Input */}
          <motion.div
            className="form-group"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <label htmlFor="password">Password</label>
            <motion.div
              className="input-wrapper password-wrapper"
              variants={inputVariants}
              whileFocus="focus"
              whileBlur="blur"
            >
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password (minimum 6 characters)"
                className={errors.password ? 'input-error' : ''}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </motion.div>
            {errors.password && (
              <motion.span
                className="error-message"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.password}
              </motion.span>
            )}
          </motion.div>

          {/* Repeat Password Input */}
          <motion.div
            className="form-group"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <label htmlFor="repeatPassword">Confirm Password</label>
            <motion.div
              className="input-wrapper password-wrapper"
              variants={inputVariants}
              whileFocus="focus"
              whileBlur="blur"
            >
              <input
                type={showRepeatPassword ? 'text' : 'password'}
                id="repeatPassword"
                name="repeatPassword"
                value={formData.repeatPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={errors.repeatPassword ? 'input-error' : ''}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowRepeatPassword(!showRepeatPassword)}
              >
                {showRepeatPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </motion.div>
            {errors.repeatPassword && (
              <motion.span
                className="error-message"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {errors.repeatPassword}
              </motion.span>
            )}
          </motion.div>

          {/* Submit Error */}
          {errors.submit && (
            <motion.div
              className="error-box"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.submit}
            </motion.div>
          )}

          {/* Success Message */}
          {success && (
            <motion.div
              className="success-box"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ✓ {success}
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="submit-btn"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </motion.button>
        </form>

        <motion.div
          className="auth-footer"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Log In
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Register;

