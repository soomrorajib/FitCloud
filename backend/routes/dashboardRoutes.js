const express = require('express');
const { getDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { dateQueryRule } = require('../utils/validation');

const router = express.Router();
router.get('/', protect, dateQueryRule, validate, getDashboard);

module.exports = router;
