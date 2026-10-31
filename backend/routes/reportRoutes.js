const express = require('express');
const { exportOne, exportData } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { reportRules } = require('../utils/validation');

const router = express.Router();
router.use(protect);

router.get('/workouts', reportRules, validate, exportOne('workouts'));
router.get('/diet', reportRules, validate, exportOne('diet'));
router.get('/progress', reportRules, validate, exportOne('progress'));
router.get('/exercises', reportRules, validate, exportOne('exercises'));
router.get('/export', reportRules, validate, exportData); // ?type=all|workouts|diet|exercises|progress

module.exports = router;
