const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  shortDescription: { type: String, default: '' },
  fullDescription: { type: String, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
  skillImage: { type: String, default: null },
  imageGallery: [String],
  videos: [String],
  verificationDocs: [String],
  badgeStatus: { type: String, enum: ['unverified', 'verified'], default: null },
  badgeLevel: { type: String, default: '' },
  badgeEmail: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Skill', skillSchema);