"use strict";

const { execSync } = require("node:child_process");

const EXPECTED_NODE_MAJOR = 20;
const EXPECTED_NPM_MAJOR = 10;
const strict = process.argv.includes("--strict") || process.env.CI === "true";

function readMajor(version) {
  const major = Number.parseInt(String(version).split(".")[0], 10);
  return Number.isFinite(major) ? major : null;
}

function readNpmVersion() {
  try {
    return execSync("npm --version", { encoding: "utf8" }).trim();
  } catch (error) {
    return `unavailable (${error.message})`;
  }
}

const nodeVersion = process.versions.node;
const nodeMajor = readMajor(nodeVersion);
const npmVersion = readNpmVersion();
const npmMajor = readMajor(npmVersion);

const errors = [];

if (nodeMajor !== EXPECTED_NODE_MAJOR) {
  errors.push(
    `Node.js must be ${EXPECTED_NODE_MAJOR}.x, but current is ${nodeVersion}.`
  );
}

if (npmMajor !== EXPECTED_NPM_MAJOR) {
  errors.push(`npm must be ${EXPECTED_NPM_MAJOR}.x, but current is ${npmVersion}.`);
}

if (errors.length === 0) {
  console.log(`[RUNTIME GUARD] OK: node=${nodeVersion}, npm=${npmVersion}`);
  process.exit(0);
}

console.error("[RUNTIME GUARD] Version mismatch:");
for (const error of errors) {
  console.error(`- ${error}`);
}
console.error("Fix:");
console.error("- Run `nvm use` (uses .nvmrc = 20)");
console.error("- Ensure npm 10 is active (e.g. `corepack prepare npm@10 --activate`)");

if (strict) {
  process.exit(1);
}

process.exit(0);
