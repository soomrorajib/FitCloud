// Diet (meals) CRUD aur calories summary.
const Diet = require('../models/Diet');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { pickFields, dayRange } = require('../utils/queryHelpers');
const { getNutritionSummary } = require('../services/nutritionService');

const FIELDS = ['mealName', 'mealType', 'calories', 'description', 'date'];

// POST /api/diet
const createMeal = asyncHandler(async (req, res) => {
  const meal = await Diet.create({ ...pickFields(req.body, FIELDS), userId: req.user._id });
  res.status(201).json({ success: true, message: 'Meal created successfully', data: meal });
});

// GET /api/diet?mealType=&date=YYYY-MM-DD
const getMeals = asyncHandler(async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.mealType) filter.mealType = req.query.mealType;
  if (req.query.date) filter.date = dayRange(req.query.date);

  const meals = await Diet.find(filter).sort({ date: -1, createdAt: -1 }).limit(500);
  res.status(200).json({ success: true, message: 'Meals loaded', count: meals.length, data: meals });
});

// GET /api/diet/summary?date=YYYY-MM-DD   (date na do to saare din ka total)
const getSummary = asyncHandler(async (req, res) => {
  const range = req.query.date ? dayRange(req.query.date) : null;
  const summary = await getNutritionSummary(req.user._id, range);
  res.status(200).json({ success: true, message: 'Nutrition summary loaded', data: summary });
});

// GET /api/diet/:id
const getMeal = asyncHandler(async (req, res) => {
  const meal = await Diet.findOne({ _id: req.params.id, userId: req.user._id });
  if (!meal) throw new AppError('Meal not found', 404);
  res.status(200).json({ success: true, message: 'Meal loaded', data: meal });
});

// PUT /api/diet/:id
const updateMeal = asyncHandler(async (req, res) => {
  const data = pickFields(req.body, FIELDS);
  if (Object.keys(data).length === 0) throw new AppError('No valid fields to update', 400);

  const meal = await Diet.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, data, {
    new: true,
    runValidators: true,
  });
  if (!meal) throw new AppError('Meal not found', 404);
  res.status(200).json({ success: true, message: 'Meal updated successfully', data: meal });
});

// DELETE /api/diet/:id
const deleteMeal = asyncHandler(async (req, res) => {
  const meal = await Diet.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!meal) throw new AppError('Meal not found', 404);
  res.status(200).json({ success: true, message: 'Meal deleted successfully', data: { id: meal._id } });
});

module.exports = { createMeal, getMeals, getSummary, getMeal, updateMeal, deleteMeal };
