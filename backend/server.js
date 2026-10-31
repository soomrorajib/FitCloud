// FitCloud backend ka entry point.
// Is file mein sirf setup hai: middleware, routes mount karna aur server start.
// Asli logic controllers, models aur services mein hai (MVC).
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const connectDB = require('./config/database');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const workoutRoutes = require('./routes/workoutRoutes');
const dietRoutes = require('./routes/dietRoutes');
const exerciseRoutes = require('./routes/exerciseRoutes');
const progressRoutes = require('./routes/progressRoutes');
const contactRoutes = require('./routes/contactRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Zaroori environment variables na hon to server shuru hi nahi hoga
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((name) => !process.env[name]);
if (missingEnv.length > 0) {
  console.error(`Missing environment variables in .env: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const app = express();

// EC2 par Nginx ke peeche chalte hain, to asli client IP (rate limit ke liye) X-Forwarded-For se lete hain
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

// ---------- Security middleware ----------
app.use(helmet()); // secure HTTP headers
const allowedOrigins = (process.env.CLIENT_URL || '').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins, // sirf hamara frontend allowed hai (comma se kai origins ho sakte hain)
    credentials: true,
    // Browser ko report download ke custom headers padhne dene ke liye
    exposedHeaders: ['Content-Disposition', 'X-Report-Generated-By', 'X-Worker-Thread-Id', 'X-Worker-Time-Ms', 'X-Total-Time-Ms', 'X-Report-Rows'],
  })
);
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minute
    max: Number(process.env.RATE_LIMIT_MAX) || 300, // har IP se 300 requests
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Please try again later.' },
  })
);

// ---------- Body parsing ----------
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize()); // { "$gt": "" } jaise MongoDB injection operators hata deta hai

// ---------- Routes ----------
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FitCloud API is running',
    data: { environment: process.env.NODE_ENV, time: new Date().toISOString() },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ---------- Error handling (hamesha sab se aakhir mein) ----------
app.use(notFound);
app.use(errorHandler);

// ---------- Start ----------
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`FitCloud API running on port ${PORT} (${process.env.NODE_ENV})`);
  });
});

module.exports = app;
