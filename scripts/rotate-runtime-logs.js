const fs = require("fs");
const os = require("os");
const path = require("path");
require("../config/env");
const { logger } = require("../utils/logger");

const DEFAULT_MAX_MB = 20;
const DEFAULT_RETENTION_DAYS = 14;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const nowStamp = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}-${hh}${mi}${ss}`;
};

const resolvePath = (baseDir, configuredPath, fallback) => {
  const raw = String(configuredPath || fallback || "").trim();
  if (!raw) return "";
  return path.isAbsolute(raw) ? raw : path.join(baseDir, raw);
};

const collectLogFiles = (rootDir) => {
  if (!rootDir || !fs.existsSync(rootDir)) return [];
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".log"))
    .map((entry) => path.join(rootDir, entry.name));
};

const rotateFileByCopyAndTruncate = (filePath, maxBytes) => {
  const stats = fs.statSync(filePath);
  if (stats.size <= maxBytes) return null;

  const archivePath = `${filePath}.${nowStamp()}.log`;
  fs.copyFileSync(filePath, archivePath);
  fs.truncateSync(filePath, 0);
  return archivePath;
};

const applyArchiveRetention = (logDir, retentionDays) => {
  if (!logDir || !fs.existsSync(logDir)) return 0;

  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  let removed = 0;

  for (const entry of fs.readdirSync(logDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().includes(".log.")) continue;

    const absolutePath = path.join(logDir, entry.name);
    const stats = fs.statSync(absolutePath);
    if (now - stats.mtimeMs <= retentionMs) continue;

    fs.rmSync(absolutePath, { force: true });
    removed += 1;
  }

  return removed;
};

const main = () => {
  const projectRoot = path.join(__dirname, "..");
  const pm2Home = resolvePath(projectRoot, process.env.PM2_HOME, path.join(os.homedir(), ".pm2"));
  const appLogDir = resolvePath(projectRoot, process.env.APP_LOG_DIR, "logs");
  const pm2LogDir = path.join(pm2Home, "logs");
  const maxBytes = parsePositiveInt(process.env.LOG_ROTATE_MAX_MB, DEFAULT_MAX_MB) * 1024 * 1024;
  const retentionDays = parsePositiveInt(process.env.LOG_RETENTION_DAYS, DEFAULT_RETENTION_DAYS);

  const candidateDirs = [appLogDir, pm2LogDir];
  let rotatedCount = 0;
  let removedArchives = 0;

  for (const directory of candidateDirs) {
    const files = collectLogFiles(directory);
    for (const filePath of files) {
      const archivePath = rotateFileByCopyAndTruncate(filePath, maxBytes);
      if (archivePath) {
        rotatedCount += 1;
        logger.info(`[LogRotate] Rotated ${filePath} -> ${archivePath}`);
      }
    }
    removedArchives += applyArchiveRetention(directory, retentionDays);
  }

  logger.info(
    `[LogRotate] Completed. rotated=${rotatedCount}, removed_archives=${removedArchives}, max_mb=${
      maxBytes / 1024 / 1024
    }, retention_days=${retentionDays}`,
  );
};

try {
  main();
} catch (error) {
  logger.error(`[LogRotate] Failed: ${error.message}`);
  logger.error(error.stack || String(error));
  process.exitCode = 1;
}
