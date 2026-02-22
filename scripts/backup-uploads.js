const fs = require("fs");
const path = require("path");
require("../config/env");
const { logger } = require("../utils/logger");
const { getAbsoluteUploadDir } = require("../utils/uploadImage");

const RETENTION_DAYS_DEFAULT = 14;
const BACKUP_PREFIX = "uploads_backup_";

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const getBackupRootDirectory = () => {
  const configured = process.env.UPLOAD_BACKUP_DIR || "backups/uploads";
  return path.isAbsolute(configured) ? configured : path.join(__dirname, "..", configured);
};

const applyRetention = (backupRootDir, retentionDays) => {
  if (!fs.existsSync(backupRootDir)) return;

  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const entries = fs.readdirSync(backupRootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.name.startsWith(BACKUP_PREFIX)) continue;

    const absolutePath = path.join(backupRootDir, entry.name);
    const stats = fs.statSync(absolutePath);
    if (now - stats.mtimeMs <= retentionMs) continue;

    fs.rmSync(absolutePath, { recursive: true, force: true });
    logger.info(`[UploadsBackup] Removed old backup: ${entry.name}`);
  }
};

const runBackup = () => {
  const uploadDir = getAbsoluteUploadDir();
  if (!fs.existsSync(uploadDir)) {
    throw new Error(`Upload directory not found: ${uploadDir}`);
  }

  const backupRootDir = getBackupRootDirectory();
  fs.mkdirSync(backupRootDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupName = `${BACKUP_PREFIX}${timestamp}`;
  const backupPath = path.join(backupRootDir, backupName);

  fs.cpSync(uploadDir, backupPath, { recursive: true });
  logger.info(`[UploadsBackup] Backup completed: ${backupPath}`);

  const retentionDays = parsePositiveInt(
    process.env.UPLOAD_BACKUP_RETENTION_DAYS,
    RETENTION_DAYS_DEFAULT,
  );
  applyRetention(backupRootDir, retentionDays);
};

try {
  runBackup();
} catch (error) {
  logger.error(`[UploadsBackup] Failed: ${error.message}`);
  process.exitCode = 1;
}
