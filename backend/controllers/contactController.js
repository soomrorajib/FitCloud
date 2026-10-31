// Public contact form. Login ki zaroorat nahi, lekin rate limit lagi hai (contactRoutes mein).
const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../utils/asyncHandler');
const { pickFields } = require('../utils/queryHelpers');

// POST /api/contact
const createContactMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.create(pickFields(req.body, ['name', 'email', 'phone', 'subject', 'message']));
  res.status(201).json({
    success: true,
    message: 'Thank you! Your message has been sent.',
    data: { id: message._id },
  });
});

module.exports = { createContactMessage };
