// Protected routes ke liye: Authorization: Bearer <token> verify karta hai.
// Token sahi ho to req.user mein logged-in user aa jata hai,
// aur controllers hamesha req.user._id se hi data filter karte hain.
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const protect = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    throw new AppError('Not authorized. Please login first.', 401);
  }

  const token = header.split(' ')[1];
  // Galat ya expire token par jwt.verify error phenkta hai, jo errorMiddleware 401 bana deta hai
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new AppError('User no longer exists. Please login again.', 401);
  }

  req.user = user;
  next();
});

module.exports = { protect };
