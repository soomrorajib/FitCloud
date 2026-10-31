const mongoose = require('mongoose');
const { startOfTodayUTC } = require('../utils/queryHelpers');

const progressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      validate: { validator: (value) => value > 0, message: 'Weight must be positive' },
    }, // kg
    workoutCompleted: { type: Number, min: [0, 'Workouts completed cannot be negative'], default: 0 }, // is din kitne workouts hue
    calories: { type: Number, min: [0, 'Calories cannot be negative'], default: 0 },
    progressPercentage: { type: Number, min: [0, 'Progress must be 0 to 100'], max: [100, 'Progress must be 0 to 100'], default: 0 },
    date: { type: Date, default: startOfTodayUTC },
  },
  { timestamps: true }
);

progressSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Progress', progressSchema);
