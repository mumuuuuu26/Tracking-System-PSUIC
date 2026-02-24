const cron = require("node-cron");
const { exec } = require("child_process");
const path = require("path");
const { logger } = require("./logger");

const runScheduledCommand = (label, command) => {
  logger.info(`[Scheduler] Starting ${label}...`);

  exec(command, (error, stdout, stderr) => {
    if (error) {
      logger.error(`[Scheduler] ${label} failed: ${error.message}`);
      return;
    }

    if (stderr && stderr.trim()) {
      logger.warn(`[Scheduler] ${label} stderr: ${stderr.trim()}`);
    }

    const output = stdout ? stdout.trim() : "";
    logger.info(`[Scheduler] ${label} completed successfully.`);
    if (output) {
      logger.info(`[Scheduler] ${label} output: ${output}`);
    }
  });
};

const initScheduledJobs = () => {
  const dbBackupCron = process.env.DB_BACKUP_CRON || "0 3 * * *";
  const uploadsBackupCron = process.env.UPLOAD_BACKUP_CRON || "20 3 * * *";
  const offsiteBackupCron = process.env.OFFSITE_BACKUP_CRON || "40 3 * * *";
  const uploadsCleanupCron = process.env.UPLOAD_CLEANUP_CRON || "50 3 * * *";
  const logRotateCron = process.env.LOG_ROTATE_CRON || "15 * * * *";

  const dbBackupScript = path.join(__dirname, "../scripts/backup_db.js");
  const uploadsBackupScript = path.join(__dirname, "../scripts/backup-uploads.js");
  const offsiteBackupScript = path.join(__dirname, "../scripts/sync-offsite-backups.js");
  const uploadsCleanupScript = path.join(__dirname, "../scripts/cleanup-uploads.js");
  const logRotateScript = path.join(__dirname, "../scripts/rotate-runtime-logs.js");

  cron.schedule(dbBackupCron, () => {
    runScheduledCommand("database backup", `node "${dbBackupScript}"`);
  });

  cron.schedule(uploadsBackupCron, () => {
    runScheduledCommand("uploads backup", `node "${uploadsBackupScript}"`);
  });

  if (String(process.env.OFFSITE_BACKUP_DIR || "").trim().length > 0) {
    cron.schedule(offsiteBackupCron, () => {
      runScheduledCommand("offsite backup sync", `node "${offsiteBackupScript}"`);
    });
  } else {
    logger.info("[Scheduler] Offsite backup sync disabled (OFFSITE_BACKUP_DIR is empty).");
  }

  cron.schedule(uploadsCleanupCron, () => {
    runScheduledCommand("uploads orphan cleanup", `node "${uploadsCleanupScript}"`);
  });

  cron.schedule(logRotateCron, () => {
    runScheduledCommand("runtime log rotation", `node "${logRotateScript}"`);
  });

  logger.info(
    `[Scheduler] Initialized: db=${dbBackupCron}, uploads-backup=${uploadsBackupCron}, offsite-backup=${offsiteBackupCron}, uploads-cleanup=${uploadsCleanupCron}, log-rotate=${logRotateCron}`,
  );
};

module.exports = { initScheduledJobs };
