const express = require('express');
const c = require('../controllers/progressController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { progressRules, idRule } = require('../utils/validation');

const router = express.Router();
router.use(protect);

router.route('/').post(progressRules(false), validate, c.createProgress).get(c.getProgress);
router
  .route('/:id')
  .put(idRule, progressRules(true), validate, c.updateProgress)
  .delete(idRule, validate, c.deleteProgress);

module.exports = router;
