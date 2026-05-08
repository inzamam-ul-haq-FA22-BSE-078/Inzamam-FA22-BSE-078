const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a project title'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title must not exceed 100 characters'],
    },
    shortDescription: {
      type: String,
      required: [true, 'Please provide a short description'],
      maxlength: [200, 'Short description must not exceed 200 characters'],
    },
    fullDescription: {
      type: String,
      default: '',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
    },
    status: {
      type: String,
      enum: ['Planning', 'Active', 'Completed'],
      default: 'Planning',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Project must have an owner'],
    },
    ownerName: {
      type: String,
      required: true,
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide a start date'],
    },
    deadline: {
      type: Date,
      required: [true, 'Please provide a deadline date'],
    },
    team: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        email: {
          type: String,
          required: true,
        },
        name: {
          type: String,
        },
        role: {
          type: String,
          required: [true, 'Please specify a role'],
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    files: [
      {
        fileName: String,
        fileType: {
          type: String,
          enum: ['pdf', 'ppt', 'docx', 'doc'],
        },
        fileUrl: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
projectSchema.index({ owner: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ category: 1 });
projectSchema.index({ 'team.email': 1 });

module.exports = mongoose.model('Project', projectSchema);
