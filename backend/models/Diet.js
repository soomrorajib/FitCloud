const mongoose = require('mongoose');
const { startOfTodayUTC } = require('../utils/queryHelpers');

const dietSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mealName: { type: String, required: [true, 'Meal name is required'], trim: true, maxlength: 100 },
    mealType: {
      type: String,
      required: [true, 'Meal type is required'],
      enum: { values: ['Breakfast', 'Lunch', 'Dinner', 'Snack'], message: 'Invalid meal type' },
    },
    calories: {
      type: Number,
      required: [true, 'Calories are required'],
      validate: { validator: (value) => value > 0, message: 'Calories must be positive' },
    },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    date: { type: Date, default: startOfTodayUTC },
  },
  { timestamps: true }
);

dietSchema.index({ userId: 1, date: -1 });
dietSchema.index({ userId: 1, mealType: 1 });

module.exports = mongoose.model('Diet', dietSchema);
