// config/nodemailer.js
const nodemailer = require("nodemailer");

// ตรวจสอบ config
if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
  console.warn("⚠️ WARNING: Email configuration is missing!");
  console.log("MAIL_USER:", process.env.MAIL_USER || "NOT SET");
  console.log("MAIL_PASS:", process.env.MAIL_PASS ? "SET" : "NOT SET");
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
    console.error("❌ Email service error:", error.message);
  } else {
    console.log("✅ Email service is ready");
  }
});

module.exports = transporter;
