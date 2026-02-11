// config/nodemailer.js
const nodemailer = require("nodemailer");
const { logger } = require("../utils/logger");

// ตรวจสอบ config
if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  logger.warn("⚠️ WARNING: Email configuration is missing!");
  logger.info(`MAIL_USER: ${process.env.MAIL_USER || "NOT SET"}`);
  logger.info(`MAIL_PASS: ${process.env.MAIL_PASS ? "SET" : "NOT SET"}`);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// ทดสอบการเชื่อมต่อ
transporter.verify((error, success) => {
  if (error) {
    logger.error(`❌ Email service error: ${error.message}`);
  } else {
    logger.info("✅ Email service is ready");
  }
});

module.exports = transporter;
