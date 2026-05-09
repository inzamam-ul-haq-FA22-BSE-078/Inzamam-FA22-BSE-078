const express = require('express');
const { 
  register, 
  login, 
  getCurrentUser,
  updateProfile 
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;
