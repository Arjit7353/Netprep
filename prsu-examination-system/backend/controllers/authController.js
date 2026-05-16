const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
};

// @desc    Register user (For initial setup / super admin)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { userId, password, role, email, phone, fullName } = req.body;

    const userExists = await User.findOne({ userId });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      userId,
      password: hashedPassword,
      role,
      email,
      phone,
      fullName
    });

    if (user) {
      res.status(201).json({
        success: true,
        _id: user._id,
        userId: user.userId,
        role: user.role,
        fullName: user.fullName,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { userId, password } = req.body;

    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is locked or inactive' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      user.lastLogin = Date.now();
      user.failedAttempts = 0;
      await user.save();

      res.json({
        success: true,
        _id: user._id,
        userId: user.userId,
        role: user.role,
        fullName: user.fullName,
        collegeId: user.collegeId,
        token: generateToken(user._id),
      });
    } else {
      user.failedAttempts += 1;
      if (user.failedAttempts >= 5) {
        user.isActive = false;
      }
      await user.save();
      
      res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials',
        attemptsLeft: 5 - user.failedAttempts
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile
};
