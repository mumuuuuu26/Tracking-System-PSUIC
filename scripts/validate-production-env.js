require("../config/env");
const fs = require("fs");
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
  "OFFSITE_BACKUP_DIR",
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

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isEnabled(value) {
  return String(value || "").toLowerCase() === "true";
}

function isNonNegativeInteger(value) {
  return /^\d+$/.test(String(value || ""));
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

  if (isEnabled(process.env.HTTPS_ONLY)) {
    if (!isHttpsUrl(process.env.CLIENT_URL)) {
      fail("HTTPS_ONLY=true requires CLIENT_URL to use https://");
    }
    if (!isHttpsUrl(process.env.FRONTEND_URL)) {
      fail("HTTPS_ONLY=true requires FRONTEND_URL to use https://");
    }

    const hasTlsKey = isTruthy(process.env.TLS_KEY_FILE);
    const hasTlsCert = isTruthy(process.env.TLS_CERT_FILE);

    if (hasTlsKey !== hasTlsCert) {
      fail("TLS_KEY_FILE and TLS_CERT_FILE must be set together when using native TLS.");
    }

    if (hasTlsKey && hasTlsCert) {
      const absoluteKeyPath = path.isAbsolute(process.env.TLS_KEY_FILE)
        ? process.env.TLS_KEY_FILE
        : path.resolve(process.cwd(), process.env.TLS_KEY_FILE);
      const absoluteCertPath = path.isAbsolute(process.env.TLS_CERT_FILE)
        ? process.env.TLS_CERT_FILE
        : path.resolve(process.cwd(), process.env.TLS_CERT_FILE);

      if (!fs.existsSync(absoluteKeyPath)) {
        fail(`TLS key file not found: "${absoluteKeyPath}"`);
      }
      if (!fs.existsSync(absoluteCertPath)) {
        fail(`TLS cert file not found: "${absoluteCertPath}"`);
      }
    } else {
      warn(
        "HTTPS_ONLY=true without TLS files. Make sure HTTPS is terminated at reverse proxy and forwards X-Forwarded-Proto=https.",
      );
    }
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

  if (isTruthy(process.env.UPLOAD_BACKUP_MODE)) {
    const backupMode = String(process.env.UPLOAD_BACKUP_MODE).trim().toLowerCase();
    if (!["incremental", "differential"].includes(backupMode)) {
      fail(`UPLOAD_BACKUP_MODE must be "incremental" or "differential" (got "${process.env.UPLOAD_BACKUP_MODE}")`);
    }
  }

  if (
    isTruthy(process.env.UPLOAD_BACKUP_FULL_INTERVAL_DAYS) &&
    !isNonNegativeInteger(process.env.UPLOAD_BACKUP_FULL_INTERVAL_DAYS)
  ) {
    fail(
      `UPLOAD_BACKUP_FULL_INTERVAL_DAYS must be a non-negative integer (got "${process.env.UPLOAD_BACKUP_FULL_INTERVAL_DAYS}")`,
    );
  }

  if (isTruthy(process.env.OFFSITE_BACKUP_DIR) && !path.isAbsolute(process.env.OFFSITE_BACKUP_DIR)) {
    fail(
      `OFFSITE_BACKUP_DIR must be an absolute path when configured (got "${process.env.OFFSITE_BACKUP_DIR}").`,
    );
  }

  if (
    isTruthy(process.env.OFFSITE_BACKUP_RETENTION_DAYS) &&
    !isNonNegativeInteger(process.env.OFFSITE_BACKUP_RETENTION_DAYS)
  ) {
    fail(
      `OFFSITE_BACKUP_RETENTION_DAYS must be a non-negative integer (got "${process.env.OFFSITE_BACKUP_RETENTION_DAYS}")`,
    );
  }

  if (isTruthy(process.env.LOG_ROTATE_MAX_MB) && !isNonNegativeInteger(process.env.LOG_ROTATE_MAX_MB)) {
    fail(`LOG_ROTATE_MAX_MB must be a non-negative integer (got "${process.env.LOG_ROTATE_MAX_MB}")`);
  }

  if (isTruthy(process.env.LOG_RETENTION_DAYS) && !isNonNegativeInteger(process.env.LOG_RETENTION_DAYS)) {
    fail(`LOG_RETENTION_DAYS must be a non-negative integer (got "${process.env.LOG_RETENTION_DAYS}")`);
  }

  if (
    isTruthy(process.env.GOOGLE_SYNC_MIN_INTERVAL_MS) &&
    !isNonNegativeInteger(process.env.GOOGLE_SYNC_MIN_INTERVAL_MS)
  ) {
    fail(
      `GOOGLE_SYNC_MIN_INTERVAL_MS must be a non-negative integer (got "${process.env.GOOGLE_SYNC_MIN_INTERVAL_MS}")`,
    );
  }

  const missingOptional = optionalButRecommended.filter((key) => !isTruthy(process.env[key]));
  if (missingOptional.length > 0) {
    warn(`Optional integrations missing (email/calendar features may be disabled): ${missingOptional.join(", ")}`);
  }

  console.log("[ENV CHECK] Production environment configuration is valid.");
}

main();
