const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, minlength: 2, maxlength: 50 },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // unique index bhi banata hai
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false }, // bcrypt hash, query mein default nahi aata
    fitnessLevel: {
      type: String,
      enum: { values: ['Beginner', 'Intermediate', 'Advanced'], message: 'Invalid fitness level' },
      default: 'Beginner',
    },
    profileImage: { type: String, default: '' }, // S3 URL (image MongoDB mein store nahi hoti)
    profileImageKey: { type: String, default: '' }, // S3 key, delete karne ke kaam aati hai
  },
  { timestamps: true } // createdAt aur updatedAt khud ban jate hain
);

// Response mein kabhi password na jaye
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
