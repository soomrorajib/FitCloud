const express = require('express');
const c = require('../controllers/dietController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { dietRules, dietQueryRules, dateQueryRule, idRule } = require('../utils/validation');

const router = express.Router();
router.use(protect);

router.route('/').post(dietRules(false), validate, c.createMeal).get(dietQueryRules, validate, c.getMeals);
router.get('/summary', dateQueryRule, validate, c.getSummary); // /:id se pehle hona zaroori hai
router
  .route('/:id')
  .get(idRule, validate, c.getMeal)
  .put(idRule, dietRules(true), validate, c.updateMeal)
  .delete(idRule, validate, c.deleteMeal);

module.exports = router;
