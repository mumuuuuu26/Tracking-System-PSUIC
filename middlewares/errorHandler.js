const { ZodError } = require("zod");
const { logger } = require("../utils/logger");

const errorHandler = (err, req, res, next) => {
  // Log the error for debugging (PM2 will capture this to error.log)
  // Skip logging in test environment to keep test output clean
  if (process.env.NODE_ENV !== 'test') {
    logger.error("❌ Global Error Handler:", err);
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation Error",
      errors: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Handle Syntax Errors (e.g. invalid JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }

  // Handle JWT Error
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: "Invalid Token" });
  }

  // Default Server Error
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    message: statusCode === 500 ? "Internal Server Error" : err.message,
    // stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack // Hide stack in production
  });
};

module.exports = errorHandler;
