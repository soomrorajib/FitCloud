// Frontend validation (backend par bhi yehi rules hain, asli hifazat wahan hai).
// Har function { fieldName: 'error message' } wala object deta hai. Khali object = sab theek.
export const WORKOUT_TYPES = ['Strength', 'Cardio', 'Yoga', 'Flexibility', 'HIIT', 'Other'];
export const WORKOUT_STATUSES = ['Not Started', 'In Progress', 'Completed'];
export const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
export const EXERCISE_TYPES = ['Strength', 'Cardio', 'Yoga', 'Flexibility', 'Other'];
export const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_MESSAGE = 'Use at least 8 characters with an uppercase letter, a lowercase letter and a number';
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

export const isPositive = (value) => value !== '' && value !== null && !Number.isNaN(Number(value)) && Number(value) > 0;
export const isStrongPassword = (password) => password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password);

export const passwordStrength = (password) =>
  [password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /\d/.test(password)].filter(Boolean).length;

export const validateImage = (file) => {
  if (!file) return '';
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return 'Only JPG, PNG or WEBP images are allowed';
  if (file.size > MAX_IMAGE_SIZE) return 'File size is too large. Maximum size is 2 MB.';
  return '';
};

export const validateLogin = (v) => {
  const e = {};
  if (!EMAIL_PATTERN.test(v.email.trim())) e.email = 'Please enter a valid email address';
  if (!v.password) e.password = 'Password is required';
  return e;
};

export const validateRegister = (v, file) => {
  const e = {};
  if (v.name.trim().length < 2 || v.name.trim().length > 50) e.name = 'Name must be 2 to 50 characters';
  if (!EMAIL_PATTERN.test(v.email.trim())) e.email = 'Please enter a valid email address';
  if (!isStrongPassword(v.password)) e.password = PASSWORD_MESSAGE;
  if (v.confirmPassword !== v.password || !v.confirmPassword) e.confirmPassword = 'Passwords do not match';
  if (!FITNESS_LEVELS.includes(v.fitnessLevel)) e.fitnessLevel = 'Please choose a fitness level';
  const imageError = validateImage(file);
  if (imageError) e.profileImage = imageError;
  return e;
};

export const validateProfile = (v, file) => {
  const e = {};
  if (v.name.trim().length < 2 || v.name.trim().length > 50) e.name = 'Name must be 2 to 50 characters';
  if (!EMAIL_PATTERN.test(v.email.trim())) e.email = 'Please enter a valid email address';
  if (!FITNESS_LEVELS.includes(v.fitnessLevel)) e.fitnessLevel = 'Please choose a fitness level';
  const imageError = validateImage(file);
  if (imageError) e.profileImage = imageError;
  return e;
};

export const validateWorkout = (v) => {
  const e = {};
  if (!v.planName.trim()) e.planName = 'Plan name is required';
  if (!WORKOUT_TYPES.includes(v.type)) e.type = 'Please choose a workout type';
  if (!isPositive(v.duration)) e.duration = 'Duration must be a positive number';
  if (v.progress === '' || Number(v.progress) < 0 || Number(v.progress) > 100) e.progress = 'Progress must be between 0 and 100';
  if (!v.date) e.date = 'Date is required';
  return e;
};

export const validateMeal = (v) => {
  const e = {};
  if (!v.mealName.trim()) e.mealName = 'Meal name is required';
  if (!MEAL_TYPES.includes(v.mealType)) e.mealType = 'Please choose a meal type';
  if (!isPositive(v.calories)) e.calories = 'Calories must be a positive number';
  if (!v.date) e.date = 'Date is required';
  return e;
};

export const validateExercise = (v) => {
  const e = {};
  if (!v.name.trim()) e.name = 'Exercise name is required';
  if (!EXERCISE_TYPES.includes(v.type)) e.type = 'Please choose an exercise type';
  if (!isPositive(v.duration)) e.duration = 'Duration must be a positive number';
  return e;
};

export const validateProgress = (v) => {
  const e = {};
  if (!isPositive(v.weight)) e.weight = 'Weight must be a positive number';
  if (v.workoutCompleted === '' || Number(v.workoutCompleted) < 0) e.workoutCompleted = 'Workouts completed cannot be negative';
  if (v.calories === '' || Number(v.calories) < 0) e.calories = 'Calories cannot be negative';
  if (v.progressPercentage === '' || Number(v.progressPercentage) < 0 || Number(v.progressPercentage) > 100) e.progressPercentage = 'Progress must be between 0 and 100';
  if (!v.date) e.date = 'Date is required';
  return e;
};

export const validateContact = (v) => {
  const e = {};
  if (!v.name.trim()) e.name = 'Name is required';
  if (!EMAIL_PATTERN.test(v.email.trim())) e.email = 'Please enter a valid email address';
  if (v.phone && !/^[0-9+\-()\s]{0,20}$/.test(v.phone)) e.phone = 'Please enter a valid phone number';
  if (!v.subject.trim()) e.subject = 'Subject is required';
  if (!v.message.trim()) e.message = 'Message is required';
  else if (v.message.length > 2000) e.message = 'Message must be at most 2000 characters';
  return e;
};
