const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");

exports.getHealth = async (req, res) => {
  try {
    // Check Database Connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      uptime: process.uptime()
    });
  } catch (error) {
    logger.error("Health Check Failed:", error);
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
      error: error.message
    });
  }
};
