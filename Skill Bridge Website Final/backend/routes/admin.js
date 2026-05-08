const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Tag = require('../models/Tag');
const { authenticateToken } = require('../middleware/auth');
const User = require('../models/User');
const Skill = require('../models/Skill');

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    // Check if it's the hardcoded admin user
    if (req.user.id === 'admin-001' && req.user.isAdmin) {
      return next();
    }

    // For regular users, check database
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      console.log('Admin check failed for user:', req.user);
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Categories CRUD

// GET /api/admin/categories - Get all categories
router.get('/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/categories - Create new category
router.post('/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = new Category({ name, description });
    await category.save();
    res.status(201).json({ success: true, category });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Category name already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// PUT /api/admin/categories/:id - Update category
router.put('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, updatedAt: Date.now() },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ success: true, category });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Category name already exists' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// DELETE /api/admin/categories/:id - Delete category
router.delete('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has subcategories
    const subcategories = await Subcategory.find({ category: req.params.id });
    if (subcategories.length > 0) {
      return res.status(400).json({ message: 'Cannot delete category with existing subcategories' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Subcategories CRUD

// GET /api/admin/subcategories - Get all subcategories with category info
router.get('/subcategories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const subcategories = await Subcategory.find().populate('category', 'name').sort({ name: 1 });
    res.json({ success: true, subcategories });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/subcategories - Create new subcategory
router.post('/subcategories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, category, description } = req.body;
    const subcategory = new Subcategory({ name, category, description });
    await subcategory.save();
    await subcategory.populate('category', 'name');
    res.status(201).json({ success: true, subcategory });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Subcategory name already exists in this category' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// PUT /api/admin/subcategories/:id - Update subcategory
router.put('/subcategories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, category, description } = req.body;
    const subcategory = await Subcategory.findByIdAndUpdate(
      req.params.id,
      { name, category, description, updatedAt: Date.now() },
      { new: true }
    ).populate('category', 'name');
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    res.json({ success: true, subcategory });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Subcategory name already exists in this category' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// DELETE /api/admin/subcategories/:id - Delete subcategory
router.delete('/subcategories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const subcategory = await Subcategory.findById(req.params.id);
    if (!subcategory) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }

    // Check if subcategory has tags
    const tags = await Tag.find({ subcategory: req.params.id });
    if (tags.length > 0) {
      return res.status(400).json({ message: 'Cannot delete subcategory with existing tags' });
    }

    await Subcategory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Subcategory deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Tags CRUD

// GET /api/admin/tags - Get all tags with subcategory and category info
router.get('/tags', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tags = await Tag.find()
      .populate({
        path: 'subcategory',
        populate: { path: 'category', select: 'name' }
      })
      .sort({ name: 1 });
    res.json({ success: true, tags });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/tags - Create new tag
router.post('/tags', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, subcategory, description } = req.body;
    const tag = new Tag({ name, subcategory, description });
    await tag.save();
    await tag.populate({
      path: 'subcategory',
      populate: { path: 'category', select: 'name' }
    });
    res.status(201).json({ success: true, tag });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Tag name already exists in this subcategory' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// PUT /api/admin/tags/:id - Update tag
router.put('/tags/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, subcategory, description } = req.body;
    const tag = await Tag.findByIdAndUpdate(
      req.params.id,
      { name, subcategory, description, updatedAt: Date.now() },
      { new: true }
    ).populate({
      path: 'subcategory',
      populate: { path: 'category', select: 'name' }
    });
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    res.json({ success: true, tag });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Tag name already exists in this subcategory' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

// DELETE /api/admin/tags/:id - Delete tag
router.delete('/tags/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    await Tag.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Tag deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/categories/bulk - Create/update category hierarchy
router.post('/categories/bulk', authenticateToken, async (req, res) => {
  try {
    const { categoryName, subcategoryName, tags } = req.body;
    console.log('Bulk category request received:', { categoryName, subcategoryName, tags, user: req.user });

    if (!categoryName || !subcategoryName) {
      console.log('Validation failed: missing categoryName or subcategoryName');
      return res.status(400).json({ message: 'Category name and subcategory name are required' });
    }

    // Find or create category
    let category = await Category.findOne({ name: categoryName });
    console.log('Category lookup result:', category);
    if (!category) {
      category = new Category({ name: categoryName });
      await category.save();
      console.log('New category created:', category);
    }

    // Find or create subcategory
    let subcategory = await Subcategory.findOne({ name: subcategoryName, category: category._id });
    console.log('Subcategory lookup result:', subcategory);
    if (!subcategory) {
      subcategory = new Subcategory({ name: subcategoryName, category: category._id });
      await subcategory.save();
      console.log('New subcategory created:', subcategory);
    }

    // Handle tags - add new ones if they don't exist
    const createdTags = [];
    if (tags && Array.isArray(tags)) {
      console.log('Processing tags:', tags);
      for (const tagName of tags) {
        if (tagName && tagName.trim()) {
          const existingTag = await Tag.findOne({ name: tagName.trim(), subcategory: subcategory._id });
          console.log(`Tag "${tagName.trim()}" lookup result:`, existingTag);
          if (!existingTag) {
            const newTag = new Tag({ name: tagName.trim(), subcategory: subcategory._id });
            await newTag.save();
            createdTags.push(newTag);
            console.log('New tag created:', newTag);
          }
        }
      }
    }

    console.log('Bulk operation completed successfully');
    res.status(201).json({
      success: true,
      message: `Successfully processed: ${createdTags.length > 0 ? `${createdTags.length} new tags` : 'no new tags'} added`,
      category,
      subcategory,
      tags: createdTags
    });
  } catch (error) {
    console.error('Bulk category creation error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Duplicate entry found' });
    } else {
      res.status(500).json({ message: 'Server error: ' + error.message });
    }
  }
});

// Users management

// GET /api/admin/users - Get all users for admin
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('name email status createdAt');
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status,
      joined: user.createdAt.toISOString().split('T')[0], // Format as YYYY-MM-DD
      lastSeen: user.lastSeen ? user.lastSeen.toISOString() : null,
    }));
    res.json({ success: true, users: formattedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/users/:id/status - Update user status
router.patch('/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Skills management

// GET /api/admin/skills - Get all skills for admin with user info
router.get('/skills', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const skills = await Skill.find()
      .populate('owner', 'name email')
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('tags', 'name')
      .sort({ createdAt: -1 });
    
    const formattedSkills = skills.map(skill => {
      const owner = skill.owner || {};
      const ownerName = owner.name || owner.fullName || 'Unknown';
      const ownerEmail = owner.email || '';
      const ownerId = owner._id || owner.id || String(owner) || '';

      const categoryName = typeof skill.category === 'string'
        ? skill.category
        : (skill.category && skill.category.name) || 'N/A';

      const subcategoryName = typeof skill.subcategory === 'string'
        ? skill.subcategory
        : (skill.subcategory && skill.subcategory.name) || 'N/A';

      const tagNames = Array.isArray(skill.tags)
        ? skill.tags.map(tag => (typeof tag === 'string' ? tag : tag.name || '')).filter(Boolean)
        : [];

      const rawDocs = skill.verificationDocs;
      const verificationDocs = Array.isArray(rawDocs)
        ? rawDocs
        : rawDocs
        ? [rawDocs]
        : [];

      return {
        id: skill._id,
        title: skill.title || 'Untitled Skill',
        shortDescription: skill.shortDescription || '',
        owner: {
          id: ownerId,
          name: ownerName,
          email: ownerEmail,
        },
        category: categoryName,
        subcategory: subcategoryName,
        tags: tagNames,
        verificationDocs,
        badgeStatus: typeof skill.badgeStatus === 'string' && skill.badgeStatus !== '' ? skill.badgeStatus : 'unverified',
        createdAt: skill.createdAt ? skill.createdAt.toISOString().split('T')[0] : '',
      };
    });
    
    res.json({ success: true, skills: formattedSkills });
  } catch (error) {
    console.error('Error fetching skills:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/admin/skills/:id/verification - Update skill verification status
router.patch('/skills/:id/verification', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { badgeStatus } = req.body;

    if (!['verified', 'unverified'].includes(badgeStatus)) {
      return res.status(400).json({ message: 'Invalid badge status value' });
    }

    const skill = await Skill.findByIdAndUpdate(id, { badgeStatus }, { new: true });

    if (!skill) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    res.json({ success: true, skill });
  } catch (error) {
    console.error('Error updating skill verification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;