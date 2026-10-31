// express-validator ke rules chalne ke baad errors yahan check hoti hain.
const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  // Pehli error ko main message banate hain, baqi `errors` array mein
  return res.status(400).json({ success: false, message: errors[0].message, errors });
};

module.exports = validate;
