const fs = require("fs");
const path = require("path");
require("../config/env");
const { logger } = require("../utils/logger");
const { getAbsoluteUploadDir } = require("../utils/uploadImage");

const RETENTION_DAYS_DEFAULT = 14;
const BACKUP_PREFIX = "uploads_backup_";
const BACKUP_STATE_FILE = ".uploads-backup-state.json";
const BACKUP_MODE_INCREMENTAL = "incremental";
const BACKUP_MODE_DIFFERENTIAL = "differential";
const BACKUP_TYPE_FULL = "full";
const BACKUP_TYPE_INCREMENTAL = "incremental";
const BACKUP_TYPE_DIFFERENTIAL = "differential";
const FULL_SNAPSHOT_INTERVAL_DAYS_DEFAULT = 7;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const parseBackupMode = (value) => {
  const normalized = String(value || BACKUP_MODE_INCREMENTAL).trim().toLowerCase();
  if ([BACKUP_MODE_INCREMENTAL, BACKUP_MODE_DIFFERENTIAL].includes(normalized)) {
    return normalized;
  }

  logger.warn(
    `[UploadsBackup] Unknown UPLOAD_BACKUP_MODE="${value}". Falling back to "${BACKUP_MODE_INCREMENTAL}".`,
  );
  return BACKUP_MODE_INCREMENTAL;
};

const getBackupRootDirectory = () => {
  const configured = process.env.UPLOAD_BACKUP_DIR || "backups/uploads";
  return path.isAbsolute(configured) ? configured : path.join(__dirname, "..", configured);
};

const getBackupStatePath = (backupRootDir) => {
  return path.join(backupRootDir, BACKUP_STATE_FILE);
};

const toIsoTimestampSafe = (value) => {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return null;
  return new Date(time).toISOString();
};

const toAbsoluteFromUploadRelative = (uploadDir, relativePath) => {
  return path.join(uploadDir, ...relativePath.split("/"));
};

const listUploadSnapshot = (uploadDir) => {
  const snapshot = {};
  const stack = [uploadDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
        continue;
      }
      if (!entry.isFile()) continue;

      const relativePath = path.relative(uploadDir, absolutePath).replace(/\\/g, "/");
      if (!relativePath || relativePath === ".gitkeep") continue;

      const stats = fs.statSync(absolutePath);
      snapshot[relativePath] = {
        size: stats.size,
        mtimeMs: Math.trunc(stats.mtimeMs),
      };
    }
  }

  return snapshot;
};

const fileSnapshotChanged = (previous, current) => {
  if (!previous || !current) return true;
  return previous.size !== current.size || previous.mtimeMs !== current.mtimeMs;
};

const diffSnapshots = (baseSnapshot, currentSnapshot) => {
  const changedFiles = [];
  const deletedFiles = [];

  for (const relativePath of Object.keys(currentSnapshot)) {
    if (fileSnapshotChanged(baseSnapshot[relativePath], currentSnapshot[relativePath])) {
      changedFiles.push(relativePath);
    }
  }

  for (const relativePath of Object.keys(baseSnapshot)) {
    if (!currentSnapshot[relativePath]) {
      deletedFiles.push(relativePath);
    }
  }

  changedFiles.sort();
  deletedFiles.sort();
  return { changedFiles, deletedFiles };
};

const ensureObjectSnapshot = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
};

const loadBackupState = (statePath) => {
  if (!fs.existsSync(statePath)) return null;

  try {
    const raw = fs.readFileSync(statePath, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      version: Number(parsed.version) || 0,
      lastBackupType: parsed.lastBackupType || null,
      lastMode: parsed.lastMode || null,
      lastRunAt: toIsoTimestampSafe(parsed.lastRunAt),
      latestSnapshot: parsed.latestSnapshot
        ? {
            backupName: parsed.latestSnapshot.backupName || null,
            createdAt: toIsoTimestampSafe(parsed.latestSnapshot.createdAt),
            files: ensureObjectSnapshot(parsed.latestSnapshot.files),
          }
        : null,
      baselineSnapshot: parsed.baselineSnapshot
        ? {
            backupName: parsed.baselineSnapshot.backupName || null,
            createdAt: toIsoTimestampSafe(parsed.baselineSnapshot.createdAt),
            files: ensureObjectSnapshot(parsed.baselineSnapshot.files),
          }
        : null,
    };
  } catch (error) {
    logger.warn(`[UploadsBackup] Failed loading backup state, starting fresh: ${error.message}`);
    return null;
  }
};

const saveBackupState = (statePath, state) => {
  const tempPath = `${statePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(state, null, 2));
  fs.renameSync(tempPath, statePath);
};

const copyChangedFiles = (uploadDir, backupPath, changedFiles) => {
  let copied = 0;
  let skippedMissing = 0;

  for (const relativePath of changedFiles) {
    const sourcePath = toAbsoluteFromUploadRelative(uploadDir, relativePath);
    if (!fs.existsSync(sourcePath)) {
      skippedMissing += 1;
      continue;
    }

    const targetPath = path.join(backupPath, ...relativePath.split("/"));
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
    copied += 1;
  }

  return { copied, skippedMissing };
};

const writeBackupMetadata = (backupPath, payload) => {
  const metadataPath = path.join(backupPath, "metadata.json");
  fs.writeFileSync(metadataPath, JSON.stringify(payload, null, 2));
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

  const statePath = getBackupStatePath(backupRootDir);
  const previousState = loadBackupState(statePath);

  const backupMode = parseBackupMode(process.env.UPLOAD_BACKUP_MODE);
  const fullSnapshotIntervalDays = parsePositiveInt(
    process.env.UPLOAD_BACKUP_FULL_INTERVAL_DAYS,
    FULL_SNAPSHOT_INTERVAL_DAYS_DEFAULT,
  );

  const currentSnapshot = listUploadSnapshot(uploadDir);
  const currentFileCount = Object.keys(currentSnapshot).length;

  let backupType = BACKUP_TYPE_FULL;
  let baselineForDiff = {};
  let diffBaseLabel = "none";

  if (previousState?.latestSnapshot?.files) {
    if (backupMode === BACKUP_MODE_INCREMENTAL) {
      backupType = BACKUP_TYPE_INCREMENTAL;
      baselineForDiff = previousState.latestSnapshot.files;
      diffBaseLabel = `latest:${previousState.latestSnapshot.backupName || "unknown"}`;
    } else {
      const hasBaseline = Boolean(previousState.baselineSnapshot?.files);
      let shouldCreateNewFullSnapshot = !hasBaseline;

      if (!shouldCreateNewFullSnapshot && fullSnapshotIntervalDays > 0) {
        const baselineCreatedAt = new Date(previousState.baselineSnapshot.createdAt || 0).getTime();
        const fullSnapshotIntervalMs = fullSnapshotIntervalDays * 24 * 60 * 60 * 1000;
        shouldCreateNewFullSnapshot =
          !Number.isFinite(baselineCreatedAt) || Date.now() - baselineCreatedAt >= fullSnapshotIntervalMs;
      }

      if (!shouldCreateNewFullSnapshot) {
        backupType = BACKUP_TYPE_DIFFERENTIAL;
        baselineForDiff = previousState.baselineSnapshot.files;
        diffBaseLabel = `baseline:${previousState.baselineSnapshot.backupName || "unknown"}`;
      }
    }
  }

  let changedFiles;
  let deletedFiles;
  if (backupType === BACKUP_TYPE_FULL) {
    changedFiles = Object.keys(currentSnapshot).sort();
    deletedFiles = [];
  } else {
    const diff = diffSnapshots(baselineForDiff, currentSnapshot);
    changedFiles = diff.changedFiles;
    deletedFiles = diff.deletedFiles;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const typeSuffix =
    backupType === BACKUP_TYPE_FULL ? "full" : backupType === BACKUP_TYPE_INCREMENTAL ? "inc" : "diff";
  const backupName = `${BACKUP_PREFIX}${timestamp}_${typeSuffix}`;
  const backupPath = path.join(backupRootDir, backupName);
  fs.mkdirSync(backupPath, { recursive: true });

  const copyResult = copyChangedFiles(uploadDir, backupPath, changedFiles);
  const metadata = {
    version: 1,
    backupName,
    backupType,
    backupMode,
    createdAt: new Date().toISOString(),
    sourceUploadDir: uploadDir,
    relativeTo: diffBaseLabel,
    counts: {
      totalCurrentFiles: currentFileCount,
      copiedFiles: copyResult.copied,
      changedFiles: changedFiles.length,
      deletedFiles: deletedFiles.length,
      skippedMissingDuringCopy: copyResult.skippedMissing,
    },
    changedFiles,
    deletedFiles,
  };
  writeBackupMetadata(backupPath, metadata);

  const snapshotRef = {
    backupName,
    createdAt: metadata.createdAt,
    files: currentSnapshot,
  };
  const nextBaselineSnapshot =
    backupType === BACKUP_TYPE_FULL || !previousState?.baselineSnapshot
      ? snapshotRef
      : previousState.baselineSnapshot;

  const stateToPersist = {
    version: 2,
    lastRunAt: metadata.createdAt,
    lastBackupType: backupType,
    lastMode: backupMode,
    latestSnapshot: snapshotRef,
    baselineSnapshot: nextBaselineSnapshot,
  };
  saveBackupState(statePath, stateToPersist);

  logger.info(
    `[UploadsBackup] ${backupType} backup completed: ${backupPath} (copied=${copyResult.copied}, changed=${changedFiles.length}, deleted=${deletedFiles.length})`,
  );

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
