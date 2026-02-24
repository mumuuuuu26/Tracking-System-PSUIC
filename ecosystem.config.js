const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envPath = path.join(__dirname, ".env.production");
let envFromFile = {};

if (fs.existsSync(envPath)) {
  envFromFile = dotenv.parse(fs.readFileSync(envPath));
}

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const readEnv = (key, fallback) => {
  if (hasOwn(process.env, key)) return process.env[key];
  if (hasOwn(envFromFile, key)) return envFromFile[key];
  return fallback;
};

const appPort = String(readEnv("PORT", "5002"));
const sharedProductionEnv = {
  NODE_ENV: "production",
  PORT: appPort,
  DATABASE_URL: readEnv("DATABASE_URL"),
  SECRET: readEnv("SECRET"),
  CLIENT_URL: readEnv("CLIENT_URL"),
  FRONTEND_URL: readEnv("FRONTEND_URL"),
  EXTRA_ORIGINS: readEnv("EXTRA_ORIGINS", ""),
  HTTPS_ONLY: readEnv("HTTPS_ONLY", "false"),
  ENABLE_HTTPS_HEADERS: readEnv("ENABLE_HTTPS_HEADERS", "false"),
  TLS_KEY_FILE: readEnv("TLS_KEY_FILE", ""),
  TLS_CERT_FILE: readEnv("TLS_CERT_FILE", ""),
  HTTPS_PORT: readEnv("HTTPS_PORT", appPort),
  HTTP_REDIRECT_PORT: readEnv("HTTP_REDIRECT_PORT", ""),
  TRUST_PROXY: readEnv("TRUST_PROXY", "1"),
  UPLOAD_DIR: readEnv("UPLOAD_DIR", "uploads"),
  UPLOAD_BACKUP_DIR: readEnv("UPLOAD_BACKUP_DIR", "backups/uploads"),
  UPLOAD_ALLOWED_MIME: readEnv("UPLOAD_ALLOWED_MIME", "image/jpeg,image/png,image/webp"),
  UPLOAD_MAX_BYTES: readEnv("UPLOAD_MAX_BYTES", "5242880"),
  UPLOAD_MAX_WIDTH: readEnv("UPLOAD_MAX_WIDTH", "1920"),
  UPLOAD_MAX_HEIGHT: readEnv("UPLOAD_MAX_HEIGHT", "1920"),
  UPLOAD_QUALITY: readEnv("UPLOAD_QUALITY", "82"),
  UPLOAD_TARGET_FORMAT: readEnv("UPLOAD_TARGET_FORMAT", "webp"),
  UPLOAD_ORPHAN_RETENTION_HOURS: readEnv("UPLOAD_ORPHAN_RETENTION_HOURS", "24"),
  UPLOAD_BACKUP_RETENTION_DAYS: readEnv("UPLOAD_BACKUP_RETENTION_DAYS", "14"),
  UPLOAD_BACKUP_CRON: readEnv("UPLOAD_BACKUP_CRON", "20 3 * * *"),
  UPLOAD_CLEANUP_CRON: readEnv("UPLOAD_CLEANUP_CRON", "50 3 * * *"),
  DB_BACKUP_CRON: readEnv("DB_BACKUP_CRON", "0 3 * * *"),
  OFFSITE_BACKUP_DIR: readEnv("OFFSITE_BACKUP_DIR", ""),
  OFFSITE_BACKUP_RETENTION_DAYS: readEnv("OFFSITE_BACKUP_RETENTION_DAYS", "30"),
  OFFSITE_BACKUP_CRON: readEnv("OFFSITE_BACKUP_CRON", "40 3 * * *"),
  LOG_ROTATE_MAX_MB: readEnv("LOG_ROTATE_MAX_MB", "20"),
  LOG_RETENTION_DAYS: readEnv("LOG_RETENTION_DAYS", "14"),
  LOG_ROTATE_CRON: readEnv("LOG_ROTATE_CRON", "15 * * * *"),
  GOOGLE_SYNC_MIN_INTERVAL_MS: readEnv("GOOGLE_SYNC_MIN_INTERVAL_MS", "300000"),
  PM2_HOME: readEnv("PM2_HOME", path.join(__dirname, ".pm2")),
  MAIL_USER: readEnv("MAIL_USER"),
  MAIL_PASS: readEnv("MAIL_PASS"),
  GOOGLE_PROJECT_ID: readEnv("GOOGLE_PROJECT_ID"),
  GOOGLE_CLIENT_EMAIL: readEnv("GOOGLE_CLIENT_EMAIL"),
  GOOGLE_CALENDAR_ID: readEnv("GOOGLE_CALENDAR_ID"),
  GOOGLE_PRIVATE_KEY: readEnv("GOOGLE_PRIVATE_KEY"),
};

module.exports = {
  apps: [
    {
      name: "tracking-system-backend",
      script: "./server.js",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      max_memory_restart: "500M",
      env_production: sharedProductionEnv,
    },
    {
      name: "db-backup-cron",
      script: "./scripts/backup_db.js",
      instances: 1,
      exec_mode: "fork",
      cron_restart: "0 2 * * *",
      autorestart: false,
      watch: false,
      env_production: sharedProductionEnv,
    },
  ],
};
