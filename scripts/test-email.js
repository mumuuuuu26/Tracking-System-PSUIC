// scripts/test-email.js
require("dotenv").config();
const transporter = require("./config/nodemailer");

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: "your-test-email@gmail.com", // ใส่ email ทดสอบ
      subject: "Test Email from PSUIC System",
      text: "If you receive this, email is working!",
    });

    console.log("✅ Test email sent:", info.messageId);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testEmail();
