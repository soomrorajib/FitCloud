// Report banane ka service layer:
//  1) MongoDB se sirf logged-in user ka data nikalta hai
//  2) Data ko simple rows mein badalta hai
//  3) Asli file banane ka kaam Worker Thread (workers/reportWorker.js) ko deta hai
//
// Worker pool: ek waqt mein sirf MAX_WORKERS threads chalte hain. Zyada requests
// aayein to wo queue mein intezar karti hain, taake server par threads ka toofan na aaye.
const path = require('path');
const { Worker } = require('worker_threads');
const Workout = require('../models/Workout');
const Diet = require('../models/Diet');
const Exercise = require('../models/Exercise');
const Progress = require('../models/Progress');
const AppError = require('../utils/AppError');

const MAX_WORKERS = 2;
const WORKER_TIMEOUT_MS = 30000;
const WORKER_FILE = path.join(__dirname, '..', 'workers', 'reportWorker.js');

const toDay = (date) => (date ? new Date(date).toISOString().slice(0, 10) : '');

// Har dataset: sheet ka naam, columns aur data nikalne ka function
const DATASETS = {
  workouts: {
    name: 'Workouts',
    columns: [
      { header: 'Plan Name', key: 'planName', width: 28 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Duration (min)', key: 'duration', width: 16 },
      { header: 'Goal', key: 'goal', width: 28 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Progress (%)', key: 'progress', width: 14 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Description', key: 'description', width: 40 },
    ],
    load: async (userId) =>
      (await Workout.find({ userId }).sort({ date: -1 }).lean()).map((w) => ({ ...w, date: toDay(w.date) })),
  },
  diet: {
    name: 'Diet',
    columns: [
      { header: 'Meal Name', key: 'mealName', width: 28 },
      { header: 'Meal Type', key: 'mealType', width: 14 },
      { header: 'Calories', key: 'calories', width: 12 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Description', key: 'description', width: 40 },
    ],
    load: async (userId) =>
      (await Diet.find({ userId }).sort({ date: -1 }).lean()).map((d) => ({ ...d, date: toDay(d.date) })),
  },
  exercises: {
    name: 'Exercises',
    columns: [
      { header: 'Exercise Name', key: 'name', width: 28 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Duration (min)', key: 'duration', width: 16 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Created', key: 'createdAt', width: 14 },
    ],
    load: async (userId) =>
      (await Exercise.find({ userId }).sort({ createdAt: -1 }).lean()).map((e) => ({ ...e, createdAt: toDay(e.createdAt) })),
  },
  progress: {
    name: 'Progress',
    columns: [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Weight (kg)', key: 'weight', width: 14 },
      { header: 'Workouts Completed', key: 'workoutCompleted', width: 20 },
      { header: 'Calories', key: 'calories', width: 12 },
      { header: 'Progress (%)', key: 'progressPercentage', width: 14 },
    ],
    load: async (userId) =>
      (await Progress.find({ userId }).sort({ date: -1 }).lean()).map((p) => ({ ...p, date: toDay(p.date) })),
  },
};

// ---------- Worker pool ----------
let activeWorkers = 0;
const waitingJobs = [];

const startNextJob = () => {
  while (activeWorkers < MAX_WORKERS && waitingJobs.length > 0) {
    runJob(waitingJobs.shift());
  }
};

const runJob = ({ payload, resolve, reject }) => {
  activeWorkers += 1;
  const worker = new Worker(WORKER_FILE, { workerData: payload });
  let finished = false;

  const finish = (error, result) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    worker.terminate();
    activeWorkers -= 1;
    error ? reject(error) : resolve(result);
    startNextJob(); // queue mein agla kaam
  };

  const timer = setTimeout(() => finish(new AppError('Report generation timed out', 504)), WORKER_TIMEOUT_MS);

  worker.on('message', (message) => {
    if (message.ok) finish(null, { ...message, buffer: Buffer.from(message.buffer) });
    else finish(new AppError(`Report generation failed: ${message.error}`, 500));
  });
  worker.on('error', (error) => finish(new AppError(`Report worker error: ${error.message}`, 500)));
  worker.on('exit', (code) => {
    if (code !== 0) finish(new AppError(`Report worker stopped (exit code ${code})`, 500));
  });
};

const runInWorker = (payload) =>
  new Promise((resolve, reject) => {
    waitingJobs.push({ payload, resolve, reject });
    startNextJob();
  });

// types: ['workouts'] ya ['workouts','diet','exercises','progress']
const generateReport = async ({ userId, types, format }) => {
  const sheets = [];
  for (const type of types) {
    const dataset = DATASETS[type];
    sheets.push({ name: dataset.name, columns: dataset.columns, rows: await dataset.load(userId) });
  }
  const totalRows = sheets.reduce((sum, sheet) => sum + sheet.rows.length, 0);

  const result = await runInWorker({ format, sheets });
  return { ...result, totalRows };
};

module.exports = { generateReport, ALL_TYPES: Object.keys(DATASETS) };
