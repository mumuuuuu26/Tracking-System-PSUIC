require("dotenv").config(); // Load from CWD (server/.env)

const nodemailer = require("nodemailer");

console.log("Testing Email Configuration...");
console.log("User:", process.env.MAIL_USER || "NOT SET");
console.log("Pass (Length):", process.env.MAIL_PASS ? process.env.MAIL_PASS.length : "NOT SET");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

const mailOptions = {
    from: process.env.MAIL_USER,
    to: process.env.MAIL_USER, // Send to self
    subject: "Test Email from PSUIC System",
    text: "If you receive this, your email configuration is correct!",
};

transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
        console.error("Error sending email:", err);
    } else {
        console.log("Email sent successfully:", info.response);
    }
});
