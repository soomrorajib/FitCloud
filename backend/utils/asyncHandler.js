// Async controllers ko wrap karta hai taake har jagah try/catch na likhna pade.
// Koi error aaye to wo seedha errorMiddleware ke paas chali jati hai.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
