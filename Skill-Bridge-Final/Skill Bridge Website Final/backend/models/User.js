const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name must not exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    fullName: {
      type: String,
      default: '',
    },
    dateOfBirth: {
      type: Date,
      default: null,
    },
    phoneNo: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    availabilityStatus: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      default: 'other',
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    bio: {
      type: String,
      default: '',
    },
    skillsDescription: {
      type: String,
      default: '',
    },
    portfolioLinks: [
      {
        type: String,
      },
    ],
    socialMediaLinks: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        instagram: '',
        facebook: '',
        tiktok: '',
        linkedin: '',
        fiverr: '',
      },
    },
    education: [
      {
        degree: String,
        institute: String,
        completedYear: Number,
      },
    ],
    achievements: {
      type: String,
      default: '',
    },
    skills: [
      {
        skill: String,
        proficiency: {
          type: String,
          enum: ['Beginner', 'Intermediate', 'Advanced'],
        },
        description: String,
      },
    ],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
      select: false,
    },
    otpExpiry: {
      type: Date,
      default: null,
      select: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (passwordInput) {
  return await bcrypt.compare(passwordInput, this.password);
};

module.exports = mongoose.model('User', userSchema);
