const mongoose = require('mongoose');

// Contact form public hai, isliye userId nahi hai
const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    email: { type: String, required: [true, 'Email is required'], lowercase: true, trim: true },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    subject: { type: String, required: [true, 'Subject is required'], trim: true, maxlength: 150 },
    message: { type: String, required: [true, 'Message is required'], trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
