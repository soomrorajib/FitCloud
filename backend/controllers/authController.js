// Register, Login aur Profile.
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const s3Service = require('../services/s3Service');

const SALT_ROUNDS = 10;

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register  (multipart/form-data, profileImage optional)
const register = asyncHandler(async (req, res) => {
  const { name, email, password, fitnessLevel } = req.body;

  // Duplicate email check: upload se pehle, taake bekaar S3 files na banein
  if (await User.findOne({ email })) {
    throw new AppError('Email is already registered', 409);
  }

  const userId = new mongoose.Types.ObjectId(); // pehle se ID, taake S3 key mein use ho sake
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  let image = { url: '', key: '' };
  if (req.file) {
    image = await s3Service.uploadProfileImage(req.file, userId);
  }

  let user;
  try {
    user = await User.create({
      _id: userId,
      name,
      email,
      password: hashedPassword,
      fitnessLevel,
      profileImage: image.url,
      profileImageKey: image.key,
    });
  } catch (error) {
    await s3Service.deleteFile(image.key); // DB save fail hua to S3 se file hata do
    throw error;
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user, token: signToken(user._id) },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  const passwordMatches = user && (await bcrypt.compare(password, user.password));

  // Email ya password galat: ek hi message, taake attacker ko pata na chale kya galat tha
  if (!passwordMatches) {
    throw new AppError('Invalid email or password', 401);
  }

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { user, token: signToken(user._id) },
  });
});

// GET /api/auth/profile
const getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: 'Profile loaded', data: req.user });
});

// PUT /api/auth/profile  (multipart/form-data)
const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const { name, email, fitnessLevel } = req.body;

  if (email && email !== user.email) {
    if (await User.findOne({ email, _id: { $ne: user._id } })) {
      throw new AppError('Email is already registered', 409);
    }
    user.email = email;
  }
  if (name) user.name = name;
  if (fitnessLevel) user.fitnessLevel = fitnessLevel;

  let oldImageKey = '';
  let newImage = null;
  if (req.file) {
    newImage = await s3Service.uploadProfileImage(req.file, user._id);
    oldImageKey = user.profileImageKey;
    user.profileImage = newImage.url;
    user.profileImageKey = newImage.key;
  }

  try {
    await user.save();
  } catch (error) {
    if (newImage) await s3Service.deleteFile(newImage.key);
    throw error;
  }

  if (oldImageKey) await s3Service.deleteFile(oldImageKey); // purani picture S3 se delete

  res.status(200).json({ success: true, message: 'Profile updated successfully', data: user });
});

module.exports = { register, login, getProfile, updateProfile };
