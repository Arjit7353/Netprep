const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser); // Typically restricted or removed in production
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);

module.exports = router;
