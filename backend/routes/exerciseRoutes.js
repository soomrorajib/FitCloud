const express = require('express');
const c = require('../controllers/exerciseController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { exerciseRules, exerciseQueryRules, idRule } = require('../utils/validation');

const router = express.Router();
router.use(protect);

router.route('/').post(exerciseRules(false), validate, c.createExercise).get(exerciseQueryRules, validate, c.getExercises);
router
  .route('/:id')
  .get(idRule, validate, c.getExercise)
  .put(idRule, exerciseRules(true), validate, c.updateExercise)
  .delete(idRule, validate, c.deleteExercise);

module.exports = router;
