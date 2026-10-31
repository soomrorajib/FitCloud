// Centralized error handling: backend ki saari errors yahin se guzarti hain
// aur hamesha ek jaisi shakal mein jati hain: { success: false, message }.
const AppError = require('../utils/AppError');

// Koi route match na ho to 404 banata hai
const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server error';

  // Mongoose validation error (required field, min/max, enum waghera)
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }

  // Galat ObjectId, jaise /api/workouts/abc
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  // Duplicate key (unique email)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = field === 'email' ? 'Email is already registered' : `Duplicate value for ${field}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired. Please login again.';
  }

  // Multer (file upload) errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File size is too large.' : err.message;
  }

  // Galat JSON body
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  // Unexpected (500) errors ki detail sirf server log mein, user ko nahi
  if (statusCode === 500) {
    console.error('Unexpected error:', err);
    if (process.env.NODE_ENV === 'production') message = 'Something went wrong on the server';
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = { notFound, errorHandler };
