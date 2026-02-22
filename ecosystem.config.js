const sharedProductionEnv = {
  NODE_ENV: "production",
  PORT: process.env.PORT || 5002,
  DATABASE_URL: process.env.DATABASE_URL,
  SECRET: process.env.SECRET,
  CLIENT_URL: process.env.CLIENT_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,
  EXTRA_ORIGINS: process.env.EXTRA_ORIGINS || "",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,
  GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
  GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
  GOOGLE_CALENDAR_ID: process.env.GOOGLE_CALENDAR_ID,
  GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
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
