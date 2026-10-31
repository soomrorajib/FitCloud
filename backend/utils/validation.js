// Backend validation rules (express-validator).
// Frontend par bhi same rules hain (frontend/src/utils/validators.js),
// lekin asli hifazat yehi hai kyunki frontend ko koi bhi bypass kar sakta hai.
const { body, param, query } = require('express-validator');

const FITNESS_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const WORKOUT_TYPES = ['Strength', 'Cardio', 'Yoga', 'Flexibility', 'HIIT', 'Other'];
const WORKOUT_STATUSES = ['Not Started', 'In Progress', 'Completed'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const EXERCISE_TYPES = ['Strength', 'Cardio', 'Yoga', 'Flexibility', 'Other'];

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter and a number';

// Create ke waqt field zaroori hai, update ke waqt optional
const field = (name, isUpdate) => (isUpdate ? body(name).optional() : body(name));

const passwordChain = () =>
  body('password')
    .isString().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage(PASSWORD_MESSAGE)
    .matches(/[A-Z]/).withMessage(PASSWORD_MESSAGE)
    .matches(/[a-z]/).withMessage(PASSWORD_MESSAGE)
    .matches(/\d/).withMessage(PASSWORD_MESSAGE);

const nameChain = (isUpdate) =>
  field('name', isUpdate)
    .isString().withMessage('Name is required')
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2 to 50 characters');

const emailChain = (isUpdate) =>
  field('email', isUpdate)
    .isString().withMessage('Email is required')
    .trim().toLowerCase()
    .isEmail().withMessage('Please enter a valid email address');

const fitnessLevelChain = () =>
  body('fitnessLevel').optional().isIn(FITNESS_LEVELS).withMessage('Fitness level must be Beginner, Intermediate or Advanced');

const optionalText = (name, max) =>
  body(name).optional().isString().withMessage(`${name} must be text`).trim().isLength({ max }).withMessage(`${name} must be at most ${max} characters`);

const optionalDate = () =>
  body('date').optional().isISO8601().withMessage('Date must be a valid date');

// ---------- Auth ----------
const registerRules = [
  nameChain(false),
  emailChain(false),
  passwordChain(),
  body('confirmPassword')
    .custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
  fitnessLevelChain(),
];

const loginRules = [
  body('email').isString().trim().toLowerCase().isEmail().withMessage('Please enter a valid email address'),
  body('password').isString().notEmpty().withMessage('Password is required'),
];

const updateProfileRules = [nameChain(true), emailChain(true), fitnessLevelChain()];

// ---------- Workout ----------
const workoutRules = (isUpdate) => [
  field('planName', isUpdate).isString().trim().notEmpty().withMessage('Plan name is required').isLength({ max: 100 }).withMessage('Plan name must be at most 100 characters'),
  field('type', isUpdate).isIn(WORKOUT_TYPES).withMessage(`Workout type must be one of: ${WORKOUT_TYPES.join(', ')}`),
  field('duration', isUpdate).isFloat({ gt: 0 }).withMessage('Duration must be a positive number'),
  body('progress').optional().isFloat({ min: 0, max: 100 }).withMessage('Progress must be between 0 and 100'),
  body('status').optional().isIn(WORKOUT_STATUSES).withMessage(`Status must be one of: ${WORKOUT_STATUSES.join(', ')}`),
  optionalText('description', 500),
  optionalText('goal', 200),
  optionalDate(),
];

// ---------- Diet ----------
const dietRules = (isUpdate) => [
  field('mealName', isUpdate).isString().trim().notEmpty().withMessage('Meal name is required').isLength({ max: 100 }).withMessage('Meal name must be at most 100 characters'),
  field('mealType', isUpdate).isIn(MEAL_TYPES).withMessage(`Meal type must be one of: ${MEAL_TYPES.join(', ')}`),
  field('calories', isUpdate).isFloat({ gt: 0 }).withMessage('Calories must be a positive number'),
  optionalText('description', 500),
  optionalDate(),
];

// ---------- Exercise ----------
const exerciseRules = (isUpdate) => [
  field('name', isUpdate).isString().trim().notEmpty().withMessage('Exercise name is required').isLength({ max: 100 }).withMessage('Exercise name must be at most 100 characters'),
  field('type', isUpdate).isIn(EXERCISE_TYPES).withMessage(`Exercise type must be one of: ${EXERCISE_TYPES.join(', ')}`),
  field('duration', isUpdate).isFloat({ gt: 0 }).withMessage('Duration must be a positive number'),
  optionalText('description', 500),
];

// ---------- Progress ----------
const progressRules = (isUpdate) => [
  field('weight', isUpdate).isFloat({ gt: 0 }).withMessage('Weight must be a positive number'),
  body('workoutCompleted').optional().isFloat({ min: 0 }).withMessage('Workouts completed cannot be negative'),
  body('calories').optional().isFloat({ min: 0 }).withMessage('Calories cannot be negative'),
  body('progressPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Progress percentage must be between 0 and 100'),
  optionalDate(),
];

// ---------- Contact ----------
const contactRules = [
  body('name').isString().trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name must be at most 100 characters'),
  body('email').isString().trim().toLowerCase().isEmail().withMessage('Please enter a valid email address'),
  body('phone').optional().isString().trim().matches(/^[0-9+\-()\s]{0,20}$/).withMessage('Please enter a valid phone number'),
  body('subject').isString().trim().notEmpty().withMessage('Subject is required').isLength({ max: 150 }).withMessage('Subject must be at most 150 characters'),
  body('message').isString().trim().notEmpty().withMessage('Message is required').isLength({ max: 2000 }).withMessage('Message must be at most 2000 characters'),
];

// ---------- URL params / query strings ----------
const idRule = [param('id').isMongoId().withMessage('Invalid ID')];

const dateQueryRule = query('date').optional().matches(DATE_ONLY).withMessage('Date must be in YYYY-MM-DD format');

const workoutQueryRules = [
  query('type').optional().isIn(WORKOUT_TYPES).withMessage('Invalid workout type filter'),
  query('status').optional().isIn(WORKOUT_STATUSES).withMessage('Invalid status filter'),
];
const dietQueryRules = [
  query('mealType').optional().isIn(MEAL_TYPES).withMessage('Invalid meal type filter'),
  dateQueryRule,
];
const exerciseQueryRules = [query('type').optional().isIn(EXERCISE_TYPES).withMessage('Invalid exercise type filter')];

const reportRules = [
  query('format').optional().isIn(['csv', 'xlsx']).withMessage('Format must be csv or xlsx'),
  query('type').optional().isIn(['workouts', 'diet', 'exercises', 'progress', 'all']).withMessage('Type must be workouts, diet, exercises, progress or all'),
];

module.exports = {
  registerRules, loginRules, updateProfileRules,
  workoutRules, dietRules, exerciseRules, progressRules, contactRules,
  idRule, dateQueryRule, workoutQueryRules, dietQueryRules, exerciseQueryRules, reportRules,
};
