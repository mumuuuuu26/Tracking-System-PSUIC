const nodemailer = require("nodemailer");
const { logger } = require("../utils/logger");

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === "undefined" || value === null || value === "") {
    return defaultValue;
  }
  return String(value).toLowerCase() === "true";
};

const normalizeMailPassword = (value) => {
  if (typeof value === "undefined" || value === null) {
    return "";
  }

  const raw = String(value);
  const compact = raw.replace(/\s+/g, "");
  const looksLikeSpacedAppPassword =
    raw.includes(" ") &&
    /^[A-Za-z0-9\s]+$/.test(raw) &&
    compact.length >= 16;

  return looksLikeSpacedAppPassword ? compact : raw;
};

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure =
  typeof process.env.SMTP_SECURE === "undefined"
    ? smtpPort === 465
    : parseBoolean(process.env.SMTP_SECURE, false);
const smtpTlsRejectUnauthorized = parseBoolean(
  process.env.SMTP_TLS_REJECT_UNAUTHORIZED,
  true,
);
const smtpPassword = normalizeMailPassword(process.env.MAIL_PASS);

const mailConfigured = Boolean(process.env.MAIL_USER && smtpPassword);
const shouldAttemptSmtp =
  process.env.NODE_ENV !== "test" && process.env.DISABLE_SMTP !== "true";

if (
  typeof process.env.MAIL_PASS === "string" &&
  process.env.MAIL_PASS.trim() &&
  process.env.MAIL_PASS !== smtpPassword
) {
  logger.warn(
    "⚠️ MAIL_PASS contains whitespace. Normalizing to compact app-password format for SMTP auth.",
  );
}

if (!mailConfigured) {
  logger.warn("⚠️ WARNING: Email configuration is missing!");
  logger.info(`MAIL_USER: ${process.env.MAIL_USER ? "SET" : "NOT SET"}`);
  logger.info(`MAIL_PASS: ${smtpPassword ? "SET" : "NOT SET"}`);
}

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.MAIL_USER,
    pass: smtpPassword,
  },
  tls: {
    rejectUnauthorized: smtpTlsRejectUnauthorized,
  },
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 15000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 20000),
});

if (mailConfigured && shouldAttemptSmtp) {
  transporter.verify((error) => {
    if (error) {
      logger.error(`❌ Email service error: ${error.message}`);
    } else {
      logger.info(
        `✅ Email service is ready (${smtpHost}:${smtpPort}, secure=${smtpSecure})`,
      );
    }
  });
} else if (mailConfigured && !shouldAttemptSmtp) {
  logger.info("ℹ️ SMTP verify skipped in test/disabled mode.");
}

module.exports = transporter;
