// Dashboard ka saara data ek hi API call mein (GET /api/dashboard?date=YYYY-MM-DD).
// Sab kuch MongoDB se aata hai, koi number hardcode nahi.
const Workout = require('../models/Workout');
const Diet = require('../models/Diet');
const Exercise = require('../models/Exercise');
const Progress = require('../models/Progress');
const asyncHandler = require('../utils/asyncHandler');
const { dayRange, todayString } = require('../utils/queryHelpers');
const { getNutritionSummary } = require('../services/nutritionService');

const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  // "Aaj" ka din browser bhejta hai (user ki local date), warna server ki UTC date
  const today = dayRange(req.query.date || todayString());

  const [
    totalWorkouts, activeGoals, completedGoals, totalMeals, totalExercises,
    todaysWorkouts, todaysMeals, todaysNutrition,
    recentWorkouts, recentMeals, recentExercises,
    progressEntries, statusGroups,
  ] = await Promise.all([
    Workout.countDocuments({ userId }),
    Workout.countDocuments({ userId, status: 'In Progress' }),
    Workout.countDocuments({ userId, status: 'Completed' }),
    Diet.countDocuments({ userId }),
    Exercise.countDocuments({ userId }),
    Workout.find({ userId, date: today }).sort({ createdAt: -1 }),
    Diet.find({ userId, date: today }).sort({ createdAt: 1 }),
    getNutritionSummary(userId, today),
    Workout.find({ userId }).sort({ date: -1, createdAt: -1 }).limit(5),
    Diet.find({ userId }).sort({ date: -1, createdAt: -1 }).limit(5),
    Exercise.find({ userId }).sort({ createdAt: -1 }).limit(5),
    Progress.find({ userId }).sort({ date: -1, createdAt: -1 }).limit(30),
    Workout.aggregate([{ $match: { userId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  // Progress summary (progressEntries abhi naye se purane order mein hain)
  const chronological = [...progressEntries].reverse();
  const latest = progressEntries[0] || null;
  const first = chronological[0] || null;
  const averageProgress = progressEntries.length
    ? Math.round(progressEntries.reduce((sum, e) => sum + e.progressPercentage, 0) / progressEntries.length)
    : 0;

  const statusBreakdown = { 'Not Started': 0, 'In Progress': 0, Completed: 0 };
  statusGroups.forEach((group) => { statusBreakdown[group._id] = group.count; });

  res.status(200).json({
    success: true,
    message: 'Dashboard loaded',
    data: {
      stats: { totalWorkouts, activeGoals, completedGoals, totalMeals, totalExercises },
      todaysWorkouts,
      todaysDiet: { meals: todaysMeals, summary: todaysNutrition },
      progressSummary: {
        entries: progressEntries.length,
        latestWeight: latest ? latest.weight : null,
        weightChange: latest && first ? Number((latest.weight - first.weight).toFixed(1)) : 0,
        latestProgress: latest ? latest.progressPercentage : 0,
        averageProgress,
        totalWorkoutsLogged: progressEntries.reduce((sum, e) => sum + e.workoutCompleted, 0),
      },
      charts: {
        workoutProgress: recentWorkouts.slice().reverse().map((w) => ({ name: w.planName, progress: w.progress })),
        statusBreakdown,
        weightTrend: chronological.map((e) => ({ date: e.date, weight: e.weight, progress: e.progressPercentage })),
      },
      recent: { workouts: recentWorkouts, meals: recentMeals, exercises: recentExercises },
    },
  });
});

module.exports = { getDashboard };
