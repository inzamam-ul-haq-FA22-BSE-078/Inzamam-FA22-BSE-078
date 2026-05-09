const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const Skill = require('../models/Skill');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Tag = require('../models/Tag');

const router = express.Router();

// ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'skills');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

// Allow up to 50MB per file (for backend uploads) but you can tune this
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/uploads - accept files and return their public URLs
router.post('/uploads', authenticateToken, upload.fields([
  { name: 'skillImage', maxCount: 1 },
  { name: 'gallery', maxCount: 10 },
  { name: 'videos', maxCount: 5 },
  { name: 'verificationDocs', maxCount: 10 }
]), async (req, res) => {
  try {
    const fileUrls = {};
    if (req.files['skillImage'] && req.files['skillImage'][0]) {
      fileUrls.skillImage = `/uploads/skills/${req.files['skillImage'][0].filename}`;
    }
    if (req.files['gallery']) {
      fileUrls.gallery = req.files['gallery'].map(f => `/uploads/skills/${f.filename}`);
    }
    if (req.files['videos']) {
      fileUrls.videos = req.files['videos'].map(f => `/uploads/skills/${f.filename}`);
    }
    if (req.files['verificationDocs']) {
      fileUrls.verificationDocs = req.files['verificationDocs'].map(f => `/uploads/skills/${f.filename}`);
    }
    return res.json({ success: true, files: fileUrls });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ success: false, message: 'File upload failed', error: err.message });
  }
});

// GET /api/skills/categories - return available categories with subcategories and tags
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    const result = await Promise.all(categories.map(async (cat) => {
      const subcategories = await Subcategory.find({ category: cat._id }).sort({ name: 1 });
      const subcatsWithTags = await Promise.all(subcategories.map(async (sub) => {
        const tags = await Tag.find({ subcategory: sub._id }).sort({ name: 1 });
        return {
          id: sub._id.toString(),
          label: sub.name,
          tags: tags.map(tag => tag.name),
        };
      }));
      return {
        id: cat._id.toString(),
        label: cat.name,
        subcategories: subcatsWithTags,
        tags: [], // tags are now under subcategories
      };
    }));
    return res.json({ success: true, categories: result });
  } catch (err) {
    console.error('Categories error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch categories', error: err.message });
  }
});

// GET /api/skills - list skills with optional filters (category, search)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};
    if (category) {
      // Check if category is ObjectId or name
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        filter.category = category;
      } else {
        const cat = await Category.findOne({ name: category });
        if (cat) filter.category = cat._id;
      }
    }
    if (search) filter.title = { $regex: search, $options: 'i' };
    const skills = await Skill.find(filter)
      .populate('owner', 'email fullName profilePicture')
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('tags', 'name')
      .sort({ createdAt: -1 });
    return res.json({ success: true, skills });
  } catch (err) {
    console.error('List skills error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list skills', error: err.message });
  }
});

// POST /api/skills - create a new skill record
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, shortDescription, fullDescription, category, subcategory, tags, skillImage, imageGallery, videos, verificationDocs, badgeStatus, badgeLevel, badgeEmail } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    // Convert category name to ObjectId
    let categoryId = null;
    if (category) {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        categoryId = category;
      } else {
        const cat = await Category.findOne({ name: category });
        if (cat) categoryId = cat._id;
      }
    }

    // Convert subcategory name to ObjectId
    let subcategoryId = null;
    if (subcategory) {
      if (subcategory.match(/^[0-9a-fA-F]{24}$/)) {
        subcategoryId = subcategory;
      } else {
        const sub = await Subcategory.findOne({ name: subcategory, category: categoryId });
        if (sub) subcategoryId = sub._id;
      }
    }

    // Convert tag names to ObjectIds
    let tagIds = [];
    if (tags && Array.isArray(tags)) {
      for (const tagName of tags) {
        if (tagName.match(/^[0-9a-fA-F]{24}$/)) {
          tagIds.push(tagName);
        } else {
          const tag = await Tag.findOne({ name: tagName, subcategory: subcategoryId });
          if (tag) tagIds.push(tag._id);
        }
      }
    }

    const skill = new Skill({
      owner: req.user.id,
      title,
      shortDescription,
      fullDescription,
      category: categoryId,
      subcategory: subcategoryId,
      tags: tagIds,
      skillImage: skillImage || null,
      imageGallery: Array.isArray(imageGallery) ? imageGallery : (imageGallery ? [imageGallery] : []),
      videos: Array.isArray(videos) ? videos : (videos ? [videos] : []),
      verificationDocs: Array.isArray(verificationDocs) ? verificationDocs : (verificationDocs ? [verificationDocs] : []),
      badgeStatus: badgeStatus || null,
      badgeLevel: badgeLevel || '',
      badgeEmail: badgeEmail || '',
    });
    await skill.save();
    return res.status(201).json({ success: true, skill });
  } catch (err) {
    console.error('Create skill error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create skill', error: err.message });
  }
});

// GET /api/skills/my - get skills for current user
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const skills = await Skill.find({ owner: req.user.id }).sort({ createdAt: -1 });
    return res.json({ success: true, skills });
  } catch (err) {
    console.error('Fetch my skills error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch skills', error: err.message });
  }
});

// GET /api/skills/:id - get a skill by id
router.get('/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id)
      .populate('owner', 'email fullName profilePicture')
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .populate('tags', 'name');
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });
    return res.json({ success: true, skill });
  } catch (err) {
    console.error('Fetch skill error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch skill', error: err.message });
  }
});

// PUT /api/skills/:id - update a skill (owner only) -- only allowed when badgeStatus is 'unverified'
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) return res.status(404).json({ success: false, message: 'Skill not found' });

    // only owner may update
    if (String(skill.owner) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You are not the owner of this skill' });
    }

    // only allow edits if badgeStatus is explicitly 'unverified'
    if (skill.badgeStatus !== 'unverified') {
      return res.status(403).json({ success: false, message: 'You can edit a skill only if it has an unverified badge' });
    }

    const { title, shortDescription, fullDescription, category, subcategory, tags, skillImage, imageGallery, videos, verificationDocs, badgeStatus, badgeLevel, badgeEmail } = req.body;

    if (typeof title !== 'undefined') skill.title = title;
    if (typeof shortDescription !== 'undefined') skill.shortDescription = shortDescription;
    if (typeof fullDescription !== 'undefined') skill.fullDescription = fullDescription;

    if (typeof category !== 'undefined') {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        skill.category = category;
      } else {
        const cat = await Category.findOne({ name: category });
        if (cat) skill.category = cat._id;
      }
    }

    if (typeof subcategory !== 'undefined') {
      if (subcategory.match(/^[0-9a-fA-F]{24}$/)) {
        skill.subcategory = subcategory;
      } else {
        const sub = await Subcategory.findOne({ name: subcategory, category: skill.category });
        if (sub) skill.subcategory = sub._id;
      }
    }

    if (typeof tags !== 'undefined') {
      let tagIds = [];
      const tagNames = Array.isArray(tags) ? tags : (tags ? String(tags).split(',').map(t => t.trim()).filter(Boolean) : []);
      for (const tagName of tagNames) {
        if (tagName.match(/^[0-9a-fA-F]{24}$/)) {
          tagIds.push(tagName);
        } else {
          const tag = await Tag.findOne({ name: tagName, subcategory: skill.subcategory });
          if (tag) tagIds.push(tag._id);
        }
      }
      skill.tags = tagIds;
    }

    if (typeof skillImage !== 'undefined') skill.skillImage = skillImage || null;
    if (typeof imageGallery !== 'undefined') skill.imageGallery = Array.isArray(imageGallery) ? imageGallery : (imageGallery ? [imageGallery] : []);
    if (typeof videos !== 'undefined') skill.videos = Array.isArray(videos) ? videos : (videos ? [videos] : []);
    if (typeof verificationDocs !== 'undefined') skill.verificationDocs = Array.isArray(verificationDocs) ? verificationDocs : (verificationDocs ? [verificationDocs] : []);
    // preserve badgeStatus unless explicitly provided
    if (typeof badgeStatus !== 'undefined') skill.badgeStatus = badgeStatus || null;
    if (typeof badgeLevel !== 'undefined') skill.badgeLevel = badgeLevel || '';
    if (typeof badgeEmail !== 'undefined') skill.badgeEmail = badgeEmail || '';

    await skill.save();
    return res.json({ success: true, skill });
  } catch (err) {
    console.error('Update skill error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update skill', error: err.message });
  }
});

module.exports = router;