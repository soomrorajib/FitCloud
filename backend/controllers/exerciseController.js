// Exercise CRUD.
const Exercise = require('../models/Exercise');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, pickFields } = require('../utils/queryHelpers');

const FIELDS = ['name', 'type', 'duration', 'description'];

// POST /api/exercises
const createExercise = asyncHandler(async (req, res) => {
  const exercise = await Exercise.create({ ...pickFields(req.body, FIELDS), userId: req.user._id });
  res.status(201).json({ success: true, message: 'Exercise created successfully', data: exercise });
});

// GET /api/exercises?search=&type=
const getExercises = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.search) filter.name = { $regex: escapeRegex(req.query.search), $options: 'i' };
  if (req.query.type) filter.type = req.query.type;

  const exercises = await Exercise.find(filter).sort({ createdAt: -1 }).limit(500);
  res.status(200).json({ success: true, message: 'Exercises loaded', count: exercises.length, data: exercises });
});

// GET /api/exercises/:id
const getExercise = asyncHandler(async (req, res) => {
  const exercise = await Exercise.findOne({ _id: req.params.id, userId: req.user._id });
  if (!exercise) throw new AppError('Exercise not found', 404);
  res.status(200).json({ success: true, message: 'Exercise loaded', data: exercise });
});

// PUT /api/exercises/:id
const updateExercise = asyncHandler(async (req, res) => {
  const data = pickFields(req.body, FIELDS);
  if (Object.keys(data).length === 0) throw new AppError('No valid fields to update', 400);

  const exercise = await Exercise.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, data, {
    new: true,
    runValidators: true,
  });
  if (!exercise) throw new AppError('Exercise not found', 404);
  res.status(200).json({ success: true, message: 'Exercise updated successfully', data: exercise });
});

// DELETE /api/exercises/:id
const deleteExercise = asyncHandler(async (req, res) => {
  const exercise = await Exercise.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!exercise) throw new AppError('Exercise not found', 404);
  res.status(200).json({ success: true, message: 'Exercise deleted successfully', data: { id: exercise._id } });
});

module.exports = { createExercise, getExercises, getExercise, updateExercise, deleteExercise };
