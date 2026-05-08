const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const config = require('../config');
const { generateOTP, sendOTPEmail, sendVerificationSuccessEmail } = require('../utils/emailService');

const ADMIN_EMAIL = config.ADMIN_EMAIL;

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    },
    config.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Register User - Step 1: Send OTP
const sendRegistrationOTP = async (req, res) => {
  try {
    const { name, email, password, repeatPassword } = req.body;

    // Validation
    if (!name || !email || !password || !repeatPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (password !== repeatPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if admin email
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered',
      });
    }

    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      if (user.isEmailVerified && user.status === 'Active') {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }
      if (user.status === 'Inactive') {
        return res.status(400).json({
          success: false,
          message: 'This email is associated with an inactive account. Please contact support.',
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    // If user exists but not verified, update. Otherwise create new
    if (user) {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      user.name = name;
      user.password = password;
      await user.save();
    } else {
      user = new User({
        name,
        email: email.toLowerCase(),
        password,
        otp,
        otpExpiry,
      });
      await user.save();
    }

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, name);

    // Log OTP in development mode for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`\n========== OTP FOR TESTING ==========`);
      console.log(`Email: ${email}`);
      console.log(`OTP: ${otp}`);
      console.log(`Valid for 10 minutes`);
      console.log(`=====================================\n`);
    }

    if (emailResult.success) {
      return res.status(200).json({
        success: true,
        message: 'OTP sent to your email. Please verify within 10 minutes.',
        tempUserId: user._id,
        // In development, return OTP in response for testing (remove in production)
        ...(process.env.NODE_ENV === 'development' && { otp }),
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.',
      });
    }
  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP sending',
      error: error.message,
    });
  }
};

// Register User - Step 2: Verify OTP and complete registration
const verifyRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required',
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp +otpExpiry');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if OTP is valid
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Check if OTP is expired
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Send verification success email
    await sendVerificationSuccessEmail(email, user.name);

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully! Registration complete.',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
      error: error.message,
    });
  }
};

// Resend OTP
const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified',
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, user.name);

    if (emailResult.success) {
      return res.status(200).json({
        success: true,
        message: 'OTP resent successfully. Please check your email.',
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to resend OTP. Please try again.',
      });
    }
  } catch (error) {
    console.error('Resend OTP error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during OTP resending',
      error: error.message,
    });
  }
};

// Register User (Legacy - without OTP)
const register = async (req, res) => {
  try {
    const { name, email, password, repeatPassword } = req.body;

    // Validation
    if (!name || !email || !password || !repeatPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (password !== repeatPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if admin email
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered',
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create new user
    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
    });

    await user.save();

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// Login User
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Admin Login
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      // Compare with pre-hashed admin password from config
      const passwordMatch = await bcrypt.compare(password, config.ADMIN_PASSWORD_HASH);

      if (passwordMatch) {
        const adminUser = {
          id: 'admin-001',
          email: ADMIN_EMAIL,
          isAdmin: true,
          name: 'Admin',
        };

        const token = jwt.sign(adminUser, config.JWT_SECRET, { expiresIn: '7d' });

        return res.status(200).json({
          success: true,
          message: 'Admin login successful',
          token,
          user: {
            id: 'admin-001',
            email: ADMIN_EMAIL,
            isAdmin: true,
            name: 'Admin',
          },
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials',
        });
      }
    }

    // Regular User Login
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.status !== 'Active') {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Please contact support.',
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user);

    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userResponse,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message,
    });
  }
};

// Get Current User
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Update User Profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      fullName,
      dateOfBirth,
      bio,
      phoneNo,
      country,
      address,
      availabilityStatus,
      gender,
      skillsDescription,
      portfolioLinks,
      socialMediaLinks,
      education,
      achievements,
      profilePicture,
    } = req.body;

    // Handle socialMediaLinks - keep as object but filter empty values
    let processedSocialLinks = {
      instagram: '',
      facebook: '',
      tiktok: '',
      linkedin: '',
      fiverr: '',
    };

    if (typeof socialMediaLinks === 'object' && !Array.isArray(socialMediaLinks)) {
      // Filter out empty values but keep structure
      Object.keys(socialMediaLinks).forEach(key => {
        if (socialMediaLinks[key] && socialMediaLinks[key].trim()) {
          processedSocialLinks[key] = socialMediaLinks[key].trim();
        }
      });
    } else if (Array.isArray(socialMediaLinks)) {
      // If it's array, convert back to object
      socialMediaLinks.forEach(link => {
        if (link && link.trim()) {
          processedSocialLinks['custom'] = link.trim();
        }
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        dateOfBirth,
        bio,
        phoneNo,
        country,
        address,
        availabilityStatus,
        gender,
        skillsDescription,
        portfolioLinks: portfolioLinks?.filter(link => link && link.trim()),
        socialMediaLinks: processedSocialLinks,
        education: education?.filter(edu => edu.degree || edu.institute),
        achievements,
        profilePicture,
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during profile update',
      error: error.message,
    });
  }
};

module.exports = {
  register,
  sendRegistrationOTP,
  verifyRegistrationOTP,
  resendOTP,
  login,
  getCurrentUser,
  updateProfile,
};
