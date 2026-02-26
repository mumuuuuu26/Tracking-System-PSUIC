"use strict";

const { execSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const checks = [
  { name: "root", cwd: rootDir, lockfile: "package-lock.json" },
  { name: "client", cwd: path.join(rootDir, "client"), lockfile: "package-lock.json" },
];
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function readNpmMajor() {
  const version = execSync(`${npmCommand} --version`, { encoding: "utf8" }).trim();
  return {
    version,
    major: Number.parseInt(version.split(".")[0], 10),
  };
}

const { version: npmVersion, major: npmMajor } = readNpmMajor();
if (npmMajor !== 10) {
  console.error(`[LOCKFILE GUARD] npm 10 is required. Current: ${npmVersion}`);
  console.error("Fix:");
  console.error("- nvm use");
  console.error("- corepack prepare npm@10 --activate");
  process.exit(1);
}

let hasError = false;

for (const check of checks) {
  const lockPath = path.join(check.cwd, check.lockfile);
  if (!fs.existsSync(lockPath)) {
    console.error(`[LOCKFILE GUARD] Missing ${check.name}/${check.lockfile}`);
    hasError = true;
    continue;
  }

  console.log(`[LOCKFILE GUARD] Checking ${check.name} lockfile with npm ${npmVersion}...`);
  const result = spawnSync(
    npmCommand,
    ["ci", "--ignore-scripts", "--dry-run", "--no-audit", "--no-fund"],
    {
      cwd: check.cwd,
      encoding: "utf8",
    }
  );

  if (result.status !== 0) {
    hasError = true;
    console.error(`[LOCKFILE GUARD] ${check.name} lockfile is out of sync.`);
    if (result.stdout) {
      console.error(result.stdout.trim());
    }
    if (result.stderr) {
      console.error(result.stderr.trim());
    }
  }
}

if (hasError) {
  console.error("[LOCKFILE GUARD] Fix lockfiles with npm 10:");
  console.error("- npm install --package-lock-only");
  console.error("- (cd client && npm install --package-lock-only)");
  process.exit(1);
}

console.log("[LOCKFILE GUARD] OK: all lockfiles are npm10-compatible.");
