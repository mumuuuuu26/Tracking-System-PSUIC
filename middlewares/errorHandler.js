const { ZodError } = require("zod");
const { logger } = require("../utils/logger");
const { Prisma } = require("@prisma/client");

const errorHandler = (err, req, res, next) => {
  // Log the error for debugging (PM2 will capture this to error.log)
  // Skip logging in test environment to keep test output clean
  if (process.env.NODE_ENV !== 'test') {
    logger.error("❌ Global Error Handler:", err);
  }

  // Handle Prisma Database Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    logger.error(`[Prisma Error] code: ${err.code}, message: ${err.message}`);
    
    if (err.code === 'P2002') {
      return res.status(400).json({ message: "Duplicate record found. A record with this value already exists." });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ message: "Record not found" });
    }
    if (err.code === 'P2003') {
        return res.status(400).json({ message: "Foreign key constraint failed. Related record not found." });
    }
    return res.status(400).json({ message: "Database Error", code: err.code });
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    const errors = err.issues || err.errors || [];
    return res.status(400).json({
      message: "Validation Error",
      errors: errors.map(e => ({
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
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  // Default Server Error
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    message: statusCode === 500 ? "Internal Server Error" : err.message,
    // stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};

module.exports = errorHandler;
