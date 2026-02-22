require("../config/env");

const fs = require("fs");
const os = require("os");
const path = require("path");

function fail(message) {
  console.error(`[STORAGE READY] FAILED: ${message}`);
  process.exit(1);
}

function ensureAbsolutePath(label, value) {
  if (!value || String(value).trim().length === 0) {
    fail(`${label} is missing`);
  }

  if (!path.isAbsolute(value)) {
    fail(
      `${label} must be an absolute path in production (got "${value}"). Use a persistent volume mount path.`,
    );
  }
}

function verifyWritableDirectory(dirPath, label) {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.accessSync(dirPath, fs.constants.W_OK);

    const probeFile = path.join(
      dirPath,
      `.write-check-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`,
    );
    fs.writeFileSync(probeFile, `ok:${os.hostname()}:${new Date().toISOString()}`);
    fs.rmSync(probeFile, { force: true });
    console.log(`[STORAGE READY] OK ${label}: ${dirPath}`);
  } catch (error) {
    fail(`${label} is not writable (${dirPath}): ${error.message}`);
  }
}

function main() {
  if (process.env.NODE_ENV !== "production") {
    fail(`NODE_ENV must be "production", got "${process.env.NODE_ENV}"`);
  }

  const uploadDir = process.env.UPLOAD_DIR;
  const uploadBackupDir = process.env.UPLOAD_BACKUP_DIR;

  ensureAbsolutePath("UPLOAD_DIR", uploadDir);
  ensureAbsolutePath("UPLOAD_BACKUP_DIR", uploadBackupDir);

  verifyWritableDirectory(uploadDir, "UPLOAD_DIR");
  verifyWritableDirectory(uploadBackupDir, "UPLOAD_BACKUP_DIR");

  console.log("[STORAGE READY] Storage preflight passed.");
}

main();
