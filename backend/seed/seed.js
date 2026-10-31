// Demo data (OPTIONAL): npm run seed
// Ek demo user aur uska realistic data banata hai. Production mein tab tak nahi chalta jab tak --force na do.
// Demo login:  demo@fitcloud.com  /  Demo@1234
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Workout = require('../models/Workout');
const Diet = require('../models/Diet');
const Exercise = require('../models/Exercise');
const Progress = require('../models/Progress');

const DEMO_EMAIL = 'demo@fitcloud.com';

const daysAgo = (days) => {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date;
};

const seed = async () => {
  if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
    console.error('Refusing to seed in production. Use: node seed/seed.js --force');
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is missing in .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  // Purana demo data hata do (sirf demo user ka)
  const oldUser = await User.findOne({ email: DEMO_EMAIL });
  if (oldUser) {
    await Promise.all([Workout, Diet, Exercise, Progress].map((Model) => Model.deleteMany({ userId: oldUser._id })));
    await oldUser.deleteOne();
  }

  const user = await User.create({
    name: 'Demo User',
    email: DEMO_EMAIL,
    password: await bcrypt.hash('Demo@1234', 10),
    fitnessLevel: 'Intermediate',
  });
  const userId = user._id;

  await Workout.insertMany([
    { planName: 'Full Body Strength', type: 'Strength', duration: 60, goal: 'Build muscle', status: 'In Progress', progress: 60, date: daysAgo(0), description: 'Squats, bench press and rows.' },
    { planName: 'Morning Run', type: 'Cardio', duration: 30, goal: 'Improve stamina', status: 'Completed', progress: 100, date: daysAgo(1), description: '5 km easy pace run.' },
    { planName: 'Sunrise Yoga Flow', type: 'Yoga', duration: 45, goal: 'Flexibility and calm', status: 'Completed', progress: 100, date: daysAgo(2), description: 'Sun salutations and breathing.' },
    { planName: 'HIIT Burner', type: 'HIIT', duration: 25, goal: 'Burn fat', status: 'In Progress', progress: 40, date: daysAgo(3), description: '30s on, 30s off intervals.' },
    { planName: 'Upper Body Day', type: 'Strength', duration: 50, goal: 'Strong arms and chest', status: 'Completed', progress: 100, date: daysAgo(4) },
    { planName: 'Mobility and Stretching', type: 'Flexibility', duration: 20, goal: 'Recovery', status: 'Not Started', progress: 0, date: daysAgo(-1) },
    { planName: 'Cycling Endurance', type: 'Cardio', duration: 70, goal: 'Build endurance', status: 'Not Started', progress: 0, date: daysAgo(-2) },
    { planName: 'Leg Day', type: 'Strength', duration: 55, goal: 'Stronger legs', status: 'Completed', progress: 100, date: daysAgo(6) },
  ].map((w) => ({ ...w, userId })));

  const meals = [];
  const menu = {
    Breakfast: [['Oats with banana', 350], ['Egg omelette and toast', 420], ['Greek yogurt and berries', 280]],
    Lunch: [['Grilled chicken and rice', 650], ['Lentil curry with roti', 580], ['Tuna salad wrap', 480]],
    Dinner: [['Baked fish and vegetables', 520], ['Chicken soup', 380], ['Vegetable stir fry', 450]],
    Snack: [['Almonds and dates', 200], ['Protein shake', 180], ['Apple with peanut butter', 220]],
  };
  for (let day = 0; day < 3; day += 1) {
    Object.entries(menu).forEach(([mealType, options]) => {
      const [mealName, calories] = options[day];
      meals.push({ userId, mealName, mealType, calories, date: daysAgo(day), description: 'Home cooked' });
    });
  }
  await Diet.insertMany(meals);

  await Exercise.insertMany([
    { name: 'Barbell Squat', type: 'Strength', duration: 15, description: '4 sets of 8 reps, keep back straight.' },
    { name: 'Bench Press', type: 'Strength', duration: 15, description: '4 sets of 8 reps with a spotter.' },
    { name: 'Treadmill Run', type: 'Cardio', duration: 30, description: 'Steady pace at 9 km/h.' },
    { name: 'Jump Rope', type: 'Cardio', duration: 10, description: '3 rounds of 3 minutes.' },
    { name: 'Downward Dog', type: 'Yoga', duration: 5, description: 'Hold for 1 minute, breathe slowly.' },
    { name: 'Hamstring Stretch', type: 'Flexibility', duration: 8, description: 'Hold each side for 30 seconds.' },
    { name: 'Plank', type: 'Strength', duration: 5, description: '3 holds of 60 seconds.' },
  ].map((e) => ({ ...e, userId })));

  const weights = [82.4, 82.1, 81.9, 81.6, 81.5, 81.1, 80.9, 80.6, 80.4, 80.1, 79.9, 79.8, 79.5, 79.2];
  await Progress.insertMany(
    weights.map((weight, index) => ({
      userId,
      weight,
      workoutCompleted: index % 3 === 0 ? 0 : 1 + (index % 2),
      calories: 1900 + ((index * 70) % 400),
      progressPercentage: Math.min(100, 20 + index * 6),
      date: daysAgo(weights.length - 1 - index),
    }))
  );

  console.log('Seed complete.');
  console.log(`Demo login -> email: ${DEMO_EMAIL}  password: Demo@1234`);
  await mongoose.disconnect();
};

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
