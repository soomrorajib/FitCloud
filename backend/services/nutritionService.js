// Calories ka summary (MongoDB aggregation). Diet page aur Dashboard dono use karte hain.
const Diet = require('../models/Diet');

const getNutritionSummary = async (userId, dateRange) => {
  const match = { userId };
  if (dateRange) match.date = dateRange;

  const groups = await Diet.aggregate([
    { $match: match },
    { $group: { _id: '$mealType', calories: { $sum: '$calories' }, meals: { $sum: 1 } } },
  ]);

  const summary = { totalCalories: 0, totalMeals: 0, Breakfast: 0, Lunch: 0, Dinner: 0, Snack: 0 };
  groups.forEach((group) => {
    summary[group._id] = group.calories;
    summary.totalCalories += group.calories;
    summary.totalMeals += group.meals;
  });
  return summary;
};

module.exports = { getNutritionSummary };
