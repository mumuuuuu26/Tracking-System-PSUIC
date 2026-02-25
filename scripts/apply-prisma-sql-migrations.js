require("../config/env");

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const migrationsDir = path.join(rootDir, "prisma", "migrations");
const migrationSqlFile = "migration.sql";

function parseMysqlUrl(urlValue) {
  if (!urlValue) {
    throw new Error("DATABASE_URL is missing.");
  }

  let parsed;
  try {
    parsed = new URL(urlValue);
  } catch {
    throw new Error("DATABASE_URL is invalid.");
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
    throw new Error("DATABASE_URL must include username and database name.");
  }

  return { user, password, host, port, database };
}

function resolveMysqlCommand() {
  if (process.platform === "win32") {
    const xamppMysql = "C:\\xampp\\mysql\\bin\\mysql.exe";
    if (fs.existsSync(xamppMysql)) {
      return xamppMysql;
    }
  }
  return "mysql";
}

function buildMysqlArgs(connection, database, batchMode) {
  const args = [
    "--default-character-set=utf8mb4",
    "-h",
    connection.host,
    "-P",
    String(connection.port),
    "-u",
    connection.user,
  ];

  if (connection.password) {
    args.push(`-p${connection.password}`);
  }

  if (batchMode) {
    args.push("-N", "-B");
  }

  if (database) {
    args.push(database);
  }

  return args;
}

function runMysqlExec(mysqlCmd, connection, database, sql, { batchMode = false, force = false } = {}) {
  const args = buildMysqlArgs(connection, database, batchMode);
  if (force) {
    args.push("--force");
  }

  const result = spawnSync(mysqlCmd, args, {
    input: sql,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  if (result.error) {
    throw new Error(`Failed to run mysql command: ${result.error.message}`);
  }

  return result;
}

function runMysql(mysqlCmd, connection, database, sql, batchMode = false) {
  const result = runMysqlExec(mysqlCmd, connection, database, sql, { batchMode, force: false });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "mysql command failed").trim());
  }

  return String(result.stdout || "");
}

function runMysqlForce(mysqlCmd, connection, database, sql) {
  const result = runMysqlExec(mysqlCmd, connection, database, sql, { batchMode: false, force: true });
  return {
    status: Number(result.status || 0),
    stdout: String(result.stdout || ""),
    stderr: String(result.stderr || ""),
  };
}

function isTrue(value) {
  return ["1", "true", "yes"].includes(String(value || "").toLowerCase());
}

function sqlEscape(value) {
  return String(value).replace(/'/g, "''");
}

function ensurePrismaMigrationsTable(mysqlCmd, connection) {
  const createTableSql = `
CREATE TABLE IF NOT EXISTS \`_prisma_migrations\` (
  \`id\` VARCHAR(36) NOT NULL PRIMARY KEY,
  \`checksum\` VARCHAR(64) NOT NULL,
  \`finished_at\` DATETIME(3) NULL,
  \`migration_name\` VARCHAR(255) NOT NULL,
  \`logs\` TEXT NULL,
  \`rolled_back_at\` DATETIME(3) NULL,
  \`started_at\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`applied_steps_count\` INT UNSIGNED NOT NULL DEFAULT 0
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
`;
  runMysql(mysqlCmd, connection, connection.database, createTableSql);
}

function detectDatabaseFlavor(mysqlCmd, connection) {
  const output = runMysql(
    mysqlCmd,
    connection,
    connection.database,
    "SELECT VERSION();",
    true,
  );
  const version = output.split(/\r?\n/).map((line) => line.trim()).find(Boolean) || "";
  return version.toLowerCase().includes("mariadb") ? "mariadb" : "mysql";
}

function getAppliedMigrationNames(mysqlCmd, connection) {
  const rows = runMysql(
    mysqlCmd,
    connection,
    connection.database,
    "SELECT migration_name FROM `_prisma_migrations` WHERE rolled_back_at IS NULL;",
    true,
  );

  return new Set(
    rows
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );
}

function listMigrationEntries() {
  if (!fs.existsSync(migrationsDir)) return [];

  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const migrationPath = path.join(migrationsDir, entry.name, migrationSqlFile);
      return { name: entry.name, migrationPath };
    })
    .filter((entry) => fs.existsSync(entry.migrationPath))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function migrationChecksum(sqlContent) {
  return crypto.createHash("sha256").update(sqlContent).digest("hex");
}

function extractCreateTableNames(sqlContent) {
  const names = new Set();
  const createTableRegex = /CREATE\s+TABLE\s+`([^`]+)`/gi;
  let match = createTableRegex.exec(sqlContent);

  while (match) {
    if (match[1]) {
      names.add(match[1]);
    }
    match = createTableRegex.exec(sqlContent);
  }

  return Array.from(names);
}

function getExistingTableNames(mysqlCmd, connection, tableNames) {
  if (!tableNames.length) return new Set();

  const tableSchema = sqlEscape(connection.database.toLowerCase());
  const quotedNames = tableNames
    .map((name) => `'${sqlEscape(name.toLowerCase())}'`)
    .join(", ");

  const sql = `
SELECT LOWER(table_name)
FROM information_schema.tables
WHERE LOWER(table_schema) = '${tableSchema}'
  AND LOWER(table_name) IN (${quotedNames});
`;

  const output = runMysql(mysqlCmd, connection, connection.database, sql, true);
  return new Set(
    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
  );
}

function isAlreadyExistsError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    message.includes("already exists") ||
    message.includes("error 1050") ||
    message.includes("duplicate key name") ||
    message.includes("duplicate column name")
  );
}

function isSchemaDriftError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return (
    message.includes("already exists") ||
    message.includes("error 1050") ||
    message.includes("error 1060") ||
    message.includes("error 1061") ||
    message.includes("error 1091") ||
    message.includes("duplicate") ||
    message.includes("can't drop") ||
    message.includes("doesn't exist")
  );
}

function shouldAutoBaselineInitMigration() {
  if (isTrue(process.env.MIGRATE_SQL_AUTO_BASELINE_INIT)) {
    return true;
  }
  return process.env.NODE_ENV === "test";
}

function shouldAllowIdempotentRetry() {
  if (isTrue(process.env.MIGRATE_SQL_IDEMPOTENT_RETRY)) {
    return true;
  }
  return process.env.NODE_ENV === "test";
}

function extractMysqlErrorLines(stderr, stdout) {
  return `${stderr}\n${stdout}`
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^ERROR \d+/i.test(line));
}

function isIgnorableIdempotentError(line) {
  const value = String(line || "").toLowerCase();
  return (
    value.includes("already exists") ||
    value.includes("duplicate key name") ||
    value.includes("duplicate column name") ||
    value.includes("can't drop") ||
    value.includes("doesn't exist") ||
    value.includes("duplicate foreign key constraint name") ||
    value.includes("errno: 121")
  );
}

function normalizeSqlForFlavor(sqlContent, flavor) {
  if (flavor !== "mariadb") {
    return sqlContent;
  }

  return sqlContent
    .split(/\r?\n/)
    .filter((line) => !/RENAME INDEX/i.test(line))
    .join("\n");
}

function markMigrationApplied(mysqlCmd, connection, migrationName, checksum) {
  const insertSql = `
INSERT INTO \`_prisma_migrations\` (
  \`id\`,
  \`checksum\`,
  \`finished_at\`,
  \`migration_name\`,
  \`logs\`,
  \`rolled_back_at\`,
  \`started_at\`,
  \`applied_steps_count\`
) VALUES (
  UUID(),
  '${sqlEscape(checksum)}',
  NOW(3),
  '${sqlEscape(migrationName)}',
  '',
  NULL,
  NOW(3),
  1
);
`;
  runMysql(mysqlCmd, connection, connection.database, insertSql);
}

function applyMigration(mysqlCmd, connection, migration, flavor) {
  const sqlContent = fs.readFileSync(migration.migrationPath, "utf8");
  const normalizedSql = normalizeSqlForFlavor(sqlContent, flavor).trim();

  if (normalizedSql.length > 0) {
    runMysql(mysqlCmd, connection, connection.database, `${normalizedSql}\n`);
  }

  const checksum = migrationChecksum(sqlContent);
  markMigrationApplied(mysqlCmd, connection, migration.name, checksum);
}

function tryBaselineInitMigration(mysqlCmd, connection, migration, migrationError) {
  if (!shouldAutoBaselineInitMigration()) {
    return false;
  }
  if (!isAlreadyExistsError(migrationError)) {
    return false;
  }

  const sqlContent = fs.readFileSync(migration.migrationPath, "utf8");
  const requiredTables = extractCreateTableNames(sqlContent);
  if (!requiredTables.length) {
    return false;
  }

  const existingTables = getExistingTableNames(mysqlCmd, connection, requiredTables);
  const missingTables = requiredTables.filter(
    (tableName) => !existingTables.has(String(tableName).toLowerCase()),
  );

  if (missingTables.length > 0) {
    return false;
  }

  const checksum = migrationChecksum(sqlContent);
  markMigrationApplied(mysqlCmd, connection, migration.name, checksum);
  console.log(`[MIGRATE SQL] Init baseline marked: ${migration.name}`);
  return true;
}

function applyInitMigrationIdempotent(mysqlCmd, connection, migration, flavor) {
  const sqlContent = fs.readFileSync(migration.migrationPath, "utf8");
  const normalizedSql = normalizeSqlForFlavor(sqlContent, flavor).trim();

  if (normalizedSql.length > 0) {
    const result = runMysqlForce(mysqlCmd, connection, connection.database, `${normalizedSql}\n`);
    const errorLines = extractMysqlErrorLines(result.stderr, result.stdout);
    const nonIgnorable = errorLines.filter((line) => !isIgnorableIdempotentError(line));

    if (nonIgnorable.length > 0) {
      throw new Error(nonIgnorable[0]);
    }

    if (result.status !== 0 && errorLines.length === 0) {
      throw new Error((result.stderr || result.stdout || "mysql command failed").trim());
    }
  }

  const requiredTables = extractCreateTableNames(sqlContent);
  const existingTables = getExistingTableNames(mysqlCmd, connection, requiredTables);
  const missingTables = requiredTables.filter(
    (tableName) => !existingTables.has(String(tableName).toLowerCase()),
  );

  if (missingTables.length > 0) {
    throw new Error(
      `Init migration idempotent apply incomplete; missing table(s): ${missingTables.join(", ")}`,
    );
  }

  const checksum = migrationChecksum(sqlContent);
  markMigrationApplied(mysqlCmd, connection, migration.name, checksum);
  console.log(`[MIGRATE SQL] Init migration applied in idempotent mode: ${migration.name}`);
}

function applyMigrationIdempotent(mysqlCmd, connection, migration, flavor) {
  const sqlContent = fs.readFileSync(migration.migrationPath, "utf8");
  const normalizedSql = normalizeSqlForFlavor(sqlContent, flavor).trim();

  if (normalizedSql.length > 0) {
    const result = runMysqlForce(mysqlCmd, connection, connection.database, `${normalizedSql}\n`);
    const errorLines = extractMysqlErrorLines(result.stderr, result.stdout);
    const nonIgnorable = errorLines.filter((line) => !isIgnorableIdempotentError(line));

    if (nonIgnorable.length > 0) {
      throw new Error(nonIgnorable[0]);
    }

    if (result.status !== 0 && errorLines.length === 0) {
      throw new Error((result.stderr || result.stdout || "mysql command failed").trim());
    }
  }

  const createTableNames = extractCreateTableNames(sqlContent);
  if (createTableNames.length > 0) {
    const existingTables = getExistingTableNames(mysqlCmd, connection, createTableNames);
    const missingTables = createTableNames.filter(
      (tableName) => !existingTables.has(String(tableName).toLowerCase()),
    );
    if (missingTables.length > 0) {
      throw new Error(
        `Idempotent migration apply incomplete; missing table(s): ${missingTables.join(", ")}`,
      );
    }
  }

  const checksum = migrationChecksum(sqlContent);
  markMigrationApplied(mysqlCmd, connection, migration.name, checksum);
  console.log(`[MIGRATE SQL] Migration applied in idempotent mode: ${migration.name}`);
}

function main() {
  const connection = parseMysqlUrl(process.env.DATABASE_URL);
  const mysqlCmd = resolveMysqlCommand();
  const flavor = detectDatabaseFlavor(mysqlCmd, connection);
  const baselineAll = isTrue(process.env.MIGRATE_SQL_BASELINE_ALL);

  ensurePrismaMigrationsTable(mysqlCmd, connection);
  const applied = getAppliedMigrationNames(mysqlCmd, connection);
  const migrations = listMigrationEntries();

  if (migrations.length === 0) {
    console.log("[MIGRATE SQL] No migration files found.");
    return;
  }

  const pending = migrations.filter((migration) => !applied.has(migration.name));

  if (pending.length === 0) {
    console.log("[MIGRATE SQL] No pending migrations to apply.");
    return;
  }

  if (baselineAll) {
    for (const migration of pending) {
      const sqlContent = fs.readFileSync(migration.migrationPath, "utf8");
      const checksum = migrationChecksum(sqlContent);
      markMigrationApplied(mysqlCmd, connection, migration.name, checksum);
      console.log(`[MIGRATE SQL] Baseline marked: ${migration.name}`);
    }
    console.log(`[MIGRATE SQL] Baseline marked ${pending.length} migration(s).`);
    return;
  }

  const isInitBaselineCandidate = pending.length > 0 && applied.size === 0;

  for (let index = 0; index < pending.length; index += 1) {
    const migration = pending[index];
    console.log(`[MIGRATE SQL] Applying: ${migration.name}`);
    try {
      applyMigration(mysqlCmd, connection, migration, flavor);
    } catch (error) {
      const canAttemptInitBaseline = isInitBaselineCandidate && index === 0;
      if (canAttemptInitBaseline && tryBaselineInitMigration(mysqlCmd, connection, migration, error)) {
        continue;
      }
      if (canAttemptInitBaseline && shouldAutoBaselineInitMigration() && isAlreadyExistsError(error)) {
        console.log(`[MIGRATE SQL] Init migration conflict detected, retrying in idempotent mode: ${migration.name}`);
        applyInitMigrationIdempotent(mysqlCmd, connection, migration, flavor);
        continue;
      }
      if (shouldAllowIdempotentRetry() && isSchemaDriftError(error)) {
        console.log(`[MIGRATE SQL] Drift conflict detected, retrying in idempotent mode: ${migration.name}`);
        applyMigrationIdempotent(mysqlCmd, connection, migration, flavor);
        continue;
      }
      throw error;
    }
  }

  console.log(`[MIGRATE SQL] Applied ${pending.length} migration(s) successfully.`);
}

try {
  main();
} catch (error) {
  console.error(`[MIGRATE SQL] ${error.message}`);
  process.exit(1);
}
