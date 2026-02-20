// middlewares/authCheck.js
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");

exports.authCheck = async (req, res, next) => {
  try {
    //code
    const headerToken = req.headers.authorization;
    if (!headerToken) {
      return res.status(401).json({ message: "No Token, Authorization " });
    }

    const token = headerToken.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No Token" });
    }

    const decode = jwt.verify(token, process.env.SECRET);

    req.user = decode;

    const user = await prisma.user.findFirst({
      where: {
        id: req.user.id,
      },
    });

    if (!user || !user.enabled) {
      return res.status(400).json({ message: "This account cannot access" });
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

