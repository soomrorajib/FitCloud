// Workout CRUD. Har query mein userId lagta hai, is liye user sirf apna data dekh/badal sakta hai.
const Workout = require('../models/Workout');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, pickFields } = require('../utils/queryHelpers');

const FIELDS = ['planName', 'description', 'type', 'duration', 'goal', 'status', 'progress', 'date'];

// Status aur progress ek dusre se match rakhne ke rules
const syncStatusAndProgress = (data) => {
  if (data.progress !== undefined) data.progress = Number(data.progress);

  if (data.status === 'Completed') {
    data.progress = 100;
  } else if (data.status === 'Not Started' && data.progress === undefined) {
    data.progress = 0;
  } else if (data.progress === 100) {
    data.status = 'Completed';
  } else if (data.progress > 0 && (!data.status || data.status === 'Not Started')) {
    data.status = 'In Progress';
  }
};

// POST /api/workouts
const createWorkout = asyncHandler(async (req, res) => {
  const data = pickFields(req.body, FIELDS);
  syncStatusAndProgress(data);

  const workout = await Workout.create({ ...data, userId: req.user._id });
  res.status(201).json({ success: true, message: 'Workout created successfully', data: workout });
});

// GET /api/workouts?search=&type=&status=
const getWorkouts = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.search) filter.planName = { $regex: escapeRegex(req.query.search), $options: 'i' };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.status) filter.status = req.query.status;

  const workouts = await Workout.find(filter).sort({ date: -1, createdAt: -1 }).limit(500);
  res.status(200).json({ success: true, message: 'Workouts loaded', count: workouts.length, data: workouts });
});

// GET /api/workouts/:id
const getWorkout = asyncHandler(async (req, res) => {
  const workout = await Workout.findOne({ _id: req.params.id, userId: req.user._id });
  if (!workout) throw new AppError('Workout not found', 404);
  res.status(200).json({ success: true, message: 'Workout loaded', data: workout });
});

// PUT /api/workouts/:id
const updateWorkout = asyncHandler(async (req, res) => {
  const data = pickFields(req.body, FIELDS);
  if (Object.keys(data).length === 0) throw new AppError('No valid fields to update', 400);
  syncStatusAndProgress(data);

  const workout = await Workout.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id }, // doosre user ka workout yahan nahi milega
    data,
    { new: true, runValidators: true }
  );
  if (!workout) throw new AppError('Workout not found', 404);
  res.status(200).json({ success: true, message: 'Workout updated successfully', data: workout });
});

// DELETE /api/workouts/:id
const deleteWorkout = asyncHandler(async (req, res) => {
  const workout = await Workout.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!workout) throw new AppError('Workout not found', 404);
  res.status(200).json({ success: true, message: 'Workout deleted successfully', data: { id: workout._id } });
});

module.exports = { createWorkout, getWorkouts, getWorkout, updateWorkout, deleteWorkout };
