const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET /api/users?search=term
router.get('/', authenticateToken, async (req, res) => {
  try {
    const q = (req.query.search || '').trim();
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    if (!q) return res.json({ success: true, users: [] });

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const users = await User.find({
      $and: [
        { _id: { $ne: userId } },
        { $or: [{ name: regex }, { email: regex }] },
      ],
    }).limit(limit).select('name email profilePicture');

    return res.json({ success: true, users });
  } catch (err) {
    console.error('users search error:', err);
    return res.status(500).json({ success: false, message: 'Failed to search users', error: err.message });
  }
});

// GET /api/users/:id - get user detail by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -otp -otpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    return res.json({ success: true, user });
  } catch (err) {
    console.error('user detail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch user details', error: err.message });
  }
});

module.exports = router;