const express = require('express');
const c = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { workoutRules, workoutQueryRules, idRule } = require('../utils/validation');

const router = express.Router();
router.use(protect); // is file ke saare routes login maangte hain

router.route('/').post(workoutRules(false), validate, c.createWorkout).get(workoutQueryRules, validate, c.getWorkouts);
router
  .route('/:id')
  .get(idRule, validate, c.getWorkout)
  .put(idRule, workoutRules(true), validate, c.updateWorkout)
  .delete(idRule, validate, c.deleteWorkout);

module.exports = router;
