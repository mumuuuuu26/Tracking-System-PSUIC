const fs = require("fs");
const path = require("path");
require("../config/env");
const { logger } = require("../utils/logger");

const DEFAULT_RETENTION_DAYS = 30;
const DB_BACKUP_FILE_REGEX = /^db_backup_.*\.sql$/i;
const UPLOAD_BACKUP_DIR_PREFIX = /^uploads_backup_/i;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const resolvePath = (baseDir, configuredPath) => {
  if (!configuredPath) return "";
  return path.isAbsolute(configuredPath)
    ? configuredPath
    : path.join(baseDir, configuredPath);
};

const ensureDir = (directory) => {
  fs.mkdirSync(directory, { recursive: true });
};

const shouldCopyFile = (sourcePath, targetPath) => {
  if (!fs.existsSync(targetPath)) return true;
  const sourceStats = fs.statSync(sourcePath);
  const targetStats = fs.statSync(targetPath);
  return (
    sourceStats.size !== targetStats.size ||
    Math.trunc(sourceStats.mtimeMs) !== Math.trunc(targetStats.mtimeMs)
  );
};

const walkFiles = (rootDir) => {
  if (!fs.existsSync(rootDir)) return [];
  const stack = [rootDir];
  const files = [];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
      } else if (entry.isFile()) {
        files.push(absolutePath);
      }
    }
  }
  return files;
};

const copyTree = (sourceRoot, targetRoot, fileFilter = null) => {
  if (!fs.existsSync(sourceRoot)) {
    return { copied: 0, skipped: 0, sourceMissing: true };
  }

  const files = walkFiles(sourceRoot);
  let copied = 0;
  let skipped = 0;

  for (const sourcePath of files) {
    const relativePath = path.relative(sourceRoot, sourcePath);
    if (!relativePath) continue;

    if (fileFilter && !fileFilter(sourcePath, relativePath)) {
      skipped += 1;
      continue;
    }

    const targetPath = path.join(targetRoot, relativePath);
    ensureDir(path.dirname(targetPath));

    if (!shouldCopyFile(sourcePath, targetPath)) {
      skipped += 1;
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
    copied += 1;
  }

  return { copied, skipped, sourceMissing: false };
};

const applyRetention = (targetDir, retentionDays, entryFilter) => {
  if (!fs.existsSync(targetDir)) return 0;
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  if (retentionMs <= 0) return 0;

  const now = Date.now();
  let removed = 0;
  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entryFilter(entry)) continue;
    const absolutePath = path.join(targetDir, entry.name);
    const stats = fs.statSync(absolutePath);
    if (now - stats.mtimeMs <= retentionMs) continue;
    fs.rmSync(absolutePath, { recursive: true, force: true });
    removed += 1;
  }
  return removed;
};

const main = () => {
  const projectRoot = path.join(__dirname, "..");
  const configuredOffsite = String(process.env.OFFSITE_BACKUP_DIR || "").trim();
  if (!configuredOffsite) {
    logger.info("[OffsiteBackup] OFFSITE_BACKUP_DIR not set. Skip offsite sync.");
    return;
  }

  const offsiteRoot = resolvePath(projectRoot, configuredOffsite);
  const dbBackupSource = path.join(projectRoot, "backups");
  const uploadsBackupSource = resolvePath(
    projectRoot,
    String(process.env.UPLOAD_BACKUP_DIR || "backups/uploads").trim(),
  );

  const offsiteHost = process.platform === "win32" && /^[a-zA-Z]:/.test(offsiteRoot)
    ? offsiteRoot.split(":")[0]
    : offsiteRoot.split(path.sep)[0] || "local";
  logger.info(`[OffsiteBackup] Sync target: ${offsiteRoot} (${offsiteHost})`);

  ensureDir(offsiteRoot);
  const dbTarget = path.join(offsiteRoot, "db");
  const uploadsTarget = path.join(offsiteRoot, "uploads");
  ensureDir(dbTarget);
  ensureDir(uploadsTarget);

  const dbResult = copyTree(dbBackupSource, dbTarget, (_src, rel) =>
    DB_BACKUP_FILE_REGEX.test(path.basename(rel)),
  );
  const uploadsResult = copyTree(uploadsBackupSource, uploadsTarget);

  const retentionDays = parsePositiveInt(
    process.env.OFFSITE_BACKUP_RETENTION_DAYS,
    DEFAULT_RETENTION_DAYS,
  );
  const removedDb = applyRetention(dbTarget, retentionDays, (entry) =>
    entry.isFile() && DB_BACKUP_FILE_REGEX.test(entry.name),
  );
  const removedUploads = applyRetention(uploadsTarget, retentionDays, (entry) =>
    entry.isDirectory() && UPLOAD_BACKUP_DIR_PREFIX.test(entry.name),
  );

  logger.info(
    `[OffsiteBackup] Completed. db(copied=${dbResult.copied}, skipped=${dbResult.skipped}, removed=${removedDb}) uploads(copied=${uploadsResult.copied}, skipped=${uploadsResult.skipped}, removed=${removedUploads})`,
  );

  if (dbResult.sourceMissing) {
    logger.warn(`[OffsiteBackup] DB backup source not found: ${dbBackupSource}`);
  }
  if (uploadsResult.sourceMissing) {
    logger.warn(`[OffsiteBackup] Upload backup source not found: ${uploadsBackupSource}`);
  }
};

try {
  main();
} catch (error) {
  logger.error(`[OffsiteBackup] Failed: ${error.message}`);
  logger.error(error.stack || String(error));
  process.exitCode = 1;
}
