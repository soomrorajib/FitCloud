const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { uploadProfileImage } = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validationMiddleware');
const { registerRules, loginRules, updateProfileRules } = require('../utils/validation');

const router = express.Router();

// Login/Register par zyada sakht limit (brute-force password guessing rokne ke liye)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again after 15 minutes.' },
});

router.post('/register', authLimiter, uploadProfileImage, registerRules, validate, register);
router.post('/login', authLimiter, loginRules, validate, login);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, uploadProfileImage, updateProfileRules, validate, updateProfile);

module.exports = router;
