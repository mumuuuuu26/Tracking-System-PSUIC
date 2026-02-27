require("../config/env");
const transporter = require("../config/nodemailer");

const EMAIL_ADDRESS_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") return defaultValue;
  return String(value).toLowerCase() === "true";
}

function maskEmail(email) {
  if (!email || !email.includes("@")) return "(not set)";
  const [local, domain] = email.split("@");
  const maskedLocal = local.length <= 2 ? `${local[0] || "*"}*` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

async function main() {
  const verifyOnly =
    process.argv.includes("--verify-only") ||
    parseBoolean(process.env.SMTP_VERIFY_ONLY, false);
  const cliRecipient = process.argv.find((arg) => EMAIL_ADDRESS_REGEX.test(arg));
  const envRecipients = String(process.env.SMTP_TEST_TO || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const recipients = [
    ...new Set(
      [cliRecipient, ...envRecipients, process.env.MAIL_USER]
        .filter(Boolean)
        .map((value) => String(value).trim())
        .filter((value) => EMAIL_ADDRESS_REGEX.test(value))
    ),
  ];

  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("MAIL_USER/MAIL_PASS are not configured.");
  }

  console.log(`[SMTP] NODE_ENV=${process.env.NODE_ENV || "development"}`);
  console.log(`[SMTP] MAIL_USER=${maskEmail(process.env.MAIL_USER)}`);

  await transporter.verify();
  console.log("[SMTP] Verify succeeded.");

  if (verifyOnly) {
    console.log("[SMTP] verify-only mode, no test email sent.");
    return;
  }

  if (recipients.length === 0) {
    throw new Error("No valid recipient found. Set SMTP_TEST_TO or pass recipient as CLI arg.");
  }

  const info = await transporter.sendMail({
    from: `"PSUIC Help Desk" <${process.env.MAIL_USER}>`,
    to: recipients.join(", "),
    subject: `[SMTP TEST] PSUIC ${new Date().toISOString()}`,
    text: "SMTP test email from PSUIC Tracking System.",
    html: "<p>SMTP test email from PSUIC Tracking System.</p>",
  });

  console.log(`[SMTP] Test email sent: ${info.messageId}`);
  console.log(
    `[SMTP] Recipients: ${recipients.map((email) => maskEmail(email)).join(", ")}`
  );
}

main().catch((error) => {
  console.error(`[SMTP] FAILED: ${error.message}`);
  process.exitCode = 1;
});
