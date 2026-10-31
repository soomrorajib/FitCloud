// MongoDB Atlas se connection yahan hota hai.
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Atlas na mile to 10 second baad error
    });
    console.log(`MongoDB Atlas connected: ${connection.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1); // DB ke baghair server chalane ka koi faida nahi
  }
};

// Connection ke baad ki problems (jaise internet band hona) ka log
mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

module.exports = connectDB;
