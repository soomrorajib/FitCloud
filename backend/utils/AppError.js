// Apni errors ke liye class. Controller mein likhein:
//   throw new AppError('Workout not found', 404);
// errorMiddleware isay pakad kar sahi status code ke saath JSON bhej deta hai.
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // yani ye hamari expected error hai
  }
}

module.exports = AppError;
