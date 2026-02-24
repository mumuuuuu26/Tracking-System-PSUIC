// middlewares/authCheck.js
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");

exports.authCheck = async (req, res, next) => {
  try {
    const jwtSecret = String(process.env.SECRET || "").trim();
    if (!jwtSecret) {
      logger.error("[authCheck] SECRET is missing in server environment");
      return res.status(503).json({ message: "Server authentication is not configured" });
    }

    const headerToken = req.headers.authorization;
    if (!headerToken) {
      return res.status(401).json({ message: "Authorization token is required" });
    }
    const tokenParts = String(headerToken).trim().split(" ");
    if (tokenParts.length !== 2 || tokenParts[0].toLowerCase() !== "bearer") {
      return res.status(401).json({ message: "Invalid Authorization header format" });
    }
    const token = tokenParts[1];

    if (!token) {
      return res.status(401).json({ message: "Authorization token is required" });
    }

    const decode = jwt.verify(token, jwtSecret);

    req.user = decode;

    const user = await prisma.user.findFirst({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      logger.warn(`[authCheck] token user not found in DB (id=${req.user?.id})`);
      return res.status(401).json({ message: "Session is invalid. Please log in again." });
    }

    if (!user.enabled) {
      logger.warn(`[authCheck] disabled user attempted access (id=${user.id}, email=${user.email})`);
      return res.status(403).json({ message: "This account is disabled" });
    }

    req.user = user; // Attach full user data to request
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError' || err.name === 'NotBeforeError') {
      return res.status(401).json({ message: "Token Invalid or Expired" });
    }
    logger.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.adminCheck = async (req, res, next) => {
  try {
    // Rely on authCheck to provide req.user
    if (!req.user || req.user.role !== "admin") {
      return res.status(403).json({ message: "Access Denied: Admin Only" });
    }

    next();
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Error Admin access denied" });
  }
};

exports.itCheck = async (req, res, next) => {
  try {
    // อนุญาตให้ทั้ง it_support และ admin เข้าถึงส่วนนี้ได้
    if (!req.user || (req.user.role !== "it_support" && req.user.role !== "admin")) {
      return res
        .status(403)
        .json({ message: "Access Denied: IT Support Only" });
    }

    next();
  } catch (err) {
    logger.error(err);
    res.status(500).json({ message: "Error IT access denied" });
  }
};
