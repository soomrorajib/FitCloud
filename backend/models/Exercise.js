const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: [true, 'Exercise name is required'], trim: true, maxlength: 100 },
    type: {
      type: String,
      required: [true, 'Exercise type is required'],
      enum: { values: ['Strength', 'Cardio', 'Yoga', 'Flexibility', 'Other'], message: 'Invalid exercise type' },
    },
    duration: { type: Number, required: [true, 'Duration is required'], min: [1, 'Duration must be positive'] }, // minutes
    description: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

exerciseSchema.index({ userId: 1, createdAt: -1 });
exerciseSchema.index({ userId: 1, type: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);
