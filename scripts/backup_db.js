const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
require("../config/env");
const dotenv = require("dotenv");

if (!process.env.DATABASE_URL) {
  const productionEnvPath = path.join(__dirname, "../.env.production");
  if (fs.existsSync(productionEnvPath)) {
    dotenv.config({ path: productionEnvPath, override: false, quiet: true });
  }
}

let logger = console;
try {
  const logUtils = require("../utils/logger");
  logger = logUtils.logger;
} catch (_) {
  // Fallback to console when logger utility is unavailable.
}

const backupDir = path.join(__dirname, "../backups");
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

function parseMysqlUrl(urlValue) {
  if (!urlValue) {
    throw new Error("DATABASE_URL is missing");
  }

  let parsed;
  try {
    parsed = new URL(urlValue);
  } catch {
    throw new Error("DATABASE_URL is invalid");
  }

  if (parsed.protocol !== "mysql:") {
    throw new Error(`Unsupported DATABASE_URL protocol: ${parsed.protocol}`);
  }

  const user = decodeURIComponent(parsed.username || "");
  const password = decodeURIComponent(parsed.password || "");
  const host = parsed.hostname || "127.0.0.1";
  const port = parsed.port || "3306";
  const database = decodeURIComponent((parsed.pathname || "").replace(/^\//, ""));

  if (!user || !database) {
    throw new Error("DATABASE_URL must include username and database name");
  }

  return { user, password, host, port, database };
}

function cleanupOldBackups() {
  const files = fs.readdirSync(backupDir);
  const now = Date.now();
  const retentionMs = 7 * 24 * 60 * 60 * 1000;

  for (const file of files) {
    if (!file.endsWith(".sql")) continue;
    const currentFilePath = path.join(backupDir, file);
    const stats = fs.statSync(currentFilePath);
    if (now - stats.mtime.getTime() > retentionMs) {
      fs.unlinkSync(currentFilePath);
      logger.info(`Deleted old backup: ${file}`);
    }
  }
}

function resolveMysqldumpCommand() {
  if (process.platform === "win32") {
    const xamppDump = "C:\\xampp\\mysql\\bin\\mysqldump.exe";
    if (fs.existsSync(xamppDump)) {
      return xamppDump;
    }
  }
  return "mysqldump";
}

function runMysqldump(connection, filePath) {
  return new Promise((resolve, reject) => {
    const mysqldumpCmd = resolveMysqldumpCommand();
    const args = [
      "--single-transaction",
      "--quick",
      "--skip-lock-tables",
      "-h",
      connection.host,
      "-P",
      connection.port,
      "-u",
      connection.user,
      connection.database,
    ];

    const child = spawn(mysqldumpCmd, args, {
      env: {
        ...process.env,
        ...(connection.password ? { MYSQL_PWD: connection.password } : {}),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const output = fs.createWriteStream(filePath);
    let stderr = "";

    child.stdout.pipe(output);
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      output.destroy();
      reject(error);
    });

    child.on("close", (code) => {
      output.end();
      if (code !== 0) {
        reject(new Error(stderr.trim() || `mysqldump exited with code ${code}`));
        return;
      }
      resolve();
    });
  });
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `db_backup_${timestamp}.sql`;
  const filePath = path.join(backupDir, filename);

  try {
    const connection = parseMysqlUrl(process.env.DATABASE_URL);
    logger.info(`Starting database backup for ${connection.database}...`);

    await runMysqldump(connection, filePath);
    logger.info(`Backup successful: ${filename}`);

    cleanupOldBackups();
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
    logger.error(`Backup failed: ${error.message}`);
    process.exit(1);
  }
}

main();
