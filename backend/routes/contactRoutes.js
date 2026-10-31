const express = require('express');
const rateLimit = require('express-rate-limit');
const { createContactMessage } = require('../controllers/contactController');
const validate = require('../middleware/validationMiddleware');
const { contactRules } = require('../utils/validation');

const router = express.Router();

// Public route hai, isliye spam se bachne ke liye har IP se ghante mein 10 messages
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.CONTACT_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many messages. Please try again later.' },
});

router.post('/', contactLimiter, contactRules, validate, createContactMessage);

module.exports = router;
