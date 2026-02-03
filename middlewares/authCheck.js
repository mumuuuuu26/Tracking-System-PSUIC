// middlewares/authCheck.js
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");

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

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Token Invalid" });
  }
};

exports.adminCheck = async (req, res, next) => {
  try {
    const { id } = req.user;
    const adminUsers = await prisma.user.findUnique({
      where: { id: id },
    });
    if (!adminUsers || adminUsers.role !== "admin") {
      return res.status(403).json({ message: "Access Denied: Admin Only" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error Admin access denied" });
  }
};

exports.itCheck = async (req, res, next) => {
  try {
    const { id } = req.user;
    const itUser = await prisma.user.findUnique({
      where: { id: id },
    });

    // อนุญาตให้ทั้ง it_support และ admin เข้าถึงส่วนนี้ได้
    if (!itUser || (itUser.role !== "it_support" && itUser.role !== "admin")) {
      return res
        .status(403)
        .json({ message: "Access Denied: IT Support Only" });
    }

    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error IT access denied" });
  }
};

