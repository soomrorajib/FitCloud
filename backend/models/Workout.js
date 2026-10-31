const mongoose = require('mongoose');
const { startOfTodayUTC } = require('../utils/queryHelpers');

const workoutSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    planName: { type: String, required: [true, 'Plan name is required'], trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    type: {
      type: String,
      required: [true, 'Workout type is required'],
      enum: { values: ['Strength', 'Cardio', 'Yoga', 'Flexibility', 'HIIT', 'Other'], message: 'Invalid workout type' },
    },
    duration: { type: Number, required: [true, 'Duration is required'], min: [1, 'Duration must be positive'] }, // minutes
    goal: { type: String, trim: true, maxlength: 200, default: '' },
    status: {
      type: String,
      enum: { values: ['Not Started', 'In Progress', 'Completed'], message: 'Invalid status' },
      default: 'Not Started',
    },
    progress: { type: Number, min: [0, 'Progress must be 0 to 100'], max: [100, 'Progress must be 0 to 100'], default: 0 },
    date: { type: Date, default: startOfTodayUTC },
  },
  { timestamps: true }
);

// Indexes: har query pehle userId se filter hoti hai
workoutSchema.index({ userId: 1, createdAt: -1 });
workoutSchema.index({ userId: 1, status: 1 });
workoutSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Workout', workoutSchema);
