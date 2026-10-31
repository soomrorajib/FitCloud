// Progress tracking CRUD. (Aapki list mein GET /:id nahi tha, isliye nahi banaya.)
const Progress = require('../models/Progress');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { pickFields } = require('../utils/queryHelpers');

const FIELDS = ['weight', 'workoutCompleted', 'calories', 'progressPercentage', 'date'];

// POST /api/progress
const createProgress = asyncHandler(async (req, res) => {
  const entry = await Progress.create({ ...pickFields(req.body, FIELDS), userId: req.user._id });
  res.status(201).json({ success: true, message: 'Progress recorded successfully', data: entry });
});

// GET /api/progress?sort=asc|desc   (charts ke liye asc, table ke liye desc)
const getProgress = asyncHandler(async (req, res) => {
  const direction = req.query.sort === 'asc' ? 1 : -1;
  const entries = await Progress.find({ userId: req.user._id }).sort({ date: direction, createdAt: direction }).limit(1000);
  res.status(200).json({ success: true, message: 'Progress loaded', count: entries.length, data: entries });
});

// PUT /api/progress/:id
const updateProgress = asyncHandler(async (req, res) => {
  const data = pickFields(req.body, FIELDS);
  if (Object.keys(data).length === 0) throw new AppError('No valid fields to update', 400);

  const entry = await Progress.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, data, {
    new: true,
    runValidators: true,
  });
  if (!entry) throw new AppError('Progress entry not found', 404);
  res.status(200).json({ success: true, message: 'Progress updated successfully', data: entry });
});

// DELETE /api/progress/:id
const deleteProgress = asyncHandler(async (req, res) => {
  const entry = await Progress.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!entry) throw new AppError('Progress entry not found', 404);
  res.status(200).json({ success: true, message: 'Progress deleted successfully', data: { id: entry._id } });
});

module.exports = { createProgress, getProgress, updateProgress, deleteProgress };
