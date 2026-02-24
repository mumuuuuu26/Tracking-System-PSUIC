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

function runMysql(mysqlCmd, connection, database, sql, batchMode = false) {
  const result = spawnSync(mysqlCmd, buildMysqlArgs(connection, database, batchMode), {
    input: sql,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  if (result.error) {
    throw new Error(`Failed to run mysql command: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "mysql command failed").trim());
  }

  return String(result.stdout || "");
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

  for (const migration of pending) {
    console.log(`[MIGRATE SQL] Applying: ${migration.name}`);
    applyMigration(mysqlCmd, connection, migration, flavor);
  }

  console.log(`[MIGRATE SQL] Applied ${pending.length} migration(s) successfully.`);
}

try {
  main();
} catch (error) {
  console.error(`[MIGRATE SQL] ${error.message}`);
  process.exit(1);
}
