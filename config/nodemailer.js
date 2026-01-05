const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER, // e.g. defined in .env
        pass: process.env.MAIL_PASS, // e.g. defined in .env
    },
});

module.exports = transporter;
