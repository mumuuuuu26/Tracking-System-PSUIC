require("../config/env");
const path = require("path");

const requiredVars = [
  "NODE_ENV",
  "PORT",
  "SECRET",
  "DATABASE_URL",
  "CLIENT_URL",
  "FRONTEND_URL",
  "UPLOAD_DIR",
  "UPLOAD_BACKUP_DIR",
];

const optionalButRecommended = [
  "MAIL_USER",
  "MAIL_PASS",
  "GOOGLE_PROJECT_ID",
  "GOOGLE_CLIENT_EMAIL",
  "GOOGLE_CALENDAR_ID",
  "GOOGLE_PRIVATE_KEY",
];

function isTruthy(value) {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function fail(message) {
  console.error(`[ENV CHECK] ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`[ENV CHECK] ${message}`);
}

function main() {
  const missing = requiredVars.filter((key) => !isTruthy(process.env[key]));
  if (missing.length > 0) {
    fail(`Missing required variables: ${missing.join(", ")}`);
  }

  if (process.env.NODE_ENV !== "production") {
    fail(`NODE_ENV must be "production", got "${process.env.NODE_ENV}"`);
  }

  if (!/^\d+$/.test(String(process.env.PORT))) {
    fail(`PORT must be a numeric value, got "${process.env.PORT}"`);
  }

  if (String(process.env.SECRET).length < 16) {
    fail("SECRET must be at least 16 characters for production");
  }

  if (!String(process.env.DATABASE_URL).startsWith("mysql://")) {
    fail("DATABASE_URL must start with mysql:// for this project");
  }

  if (!isValidUrl(process.env.CLIENT_URL)) {
    fail(`CLIENT_URL is not a valid URL: "${process.env.CLIENT_URL}"`);
  }

  if (!isValidUrl(process.env.FRONTEND_URL)) {
    fail(`FRONTEND_URL is not a valid URL: "${process.env.FRONTEND_URL}"`);
  }

  if (!path.isAbsolute(process.env.UPLOAD_DIR)) {
    fail(
      `UPLOAD_DIR must be an absolute path in production (got "${process.env.UPLOAD_DIR}"). Use a persistent volume path.`,
    );
  }

  if (!path.isAbsolute(process.env.UPLOAD_BACKUP_DIR)) {
    fail(
      `UPLOAD_BACKUP_DIR must be an absolute path in production (got "${process.env.UPLOAD_BACKUP_DIR}").`,
    );
  }

  const missingOptional = optionalButRecommended.filter((key) => !isTruthy(process.env[key]));
  if (missingOptional.length > 0) {
    warn(`Optional integrations missing (email/calendar features may be disabled): ${missingOptional.join(", ")}`);
  }

  console.log("[ENV CHECK] Production environment configuration is valid.");
}

main();
