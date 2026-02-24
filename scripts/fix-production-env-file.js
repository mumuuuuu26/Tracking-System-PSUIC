const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const envPath = path.join(process.cwd(), ".env.production");

function fail(message) {
  console.error(`[ENV FILE FIX] ${message}`);
  process.exit(1);
}

function main() {
  if (!fs.existsSync(envPath)) {
    fail(`File not found: ${envPath}`);
  }

  const original = fs.readFileSync(envPath, "utf8");
  let fixed = original;

  // Repair malformed pattern where next KEY=VALUE is glued to GOOGLE_PRIVATE_KEY closing quote.
  fixed = fixed.replace(
    /(GOOGLE_PRIVATE_KEY="(?:\\.|[^"])*")([A-Z][A-Z0-9_]+=)/g,
    "$1\n$2",
  );

  // Repair malformed pattern where literal "`r`n" is appended after GOOGLE_PRIVATE_KEY.
  fixed = fixed.replace(
    /(GOOGLE_PRIVATE_KEY="(?:\\.|[^"])*")`r`n([A-Z][A-Z0-9_]+=)/g,
    "$1\n$2",
  );

  // Remove duplicated KEY=VALUE lines by keeping the first occurrence.
  const seen = new Set();
  fixed = fixed
    .split(/\r?\n/)
    .filter((line) => {
      const match = line.match(/^([A-Z][A-Z0-9_]*)=/);
      if (!match) return true;
      const key = match[1];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join("\n");

  if (fixed === original) {
    console.log("[ENV FILE FIX] No structural fix required.");
  } else {
    const backupPath = `${envPath}.bak.${Date.now()}`;
    fs.writeFileSync(backupPath, original, "utf8");
    fs.writeFileSync(envPath, fixed, "utf8");
    console.log(`[ENV FILE FIX] Repaired .env.production and created backup: ${backupPath}`);
  }

  const validateResult = spawnSync(
    process.execPath,
    [path.join(process.cwd(), "scripts", "validate-production-env-file.js")],
    { stdio: "inherit" },
  );

  if (validateResult.status !== 0) {
    fail("Validation still failed after auto-fix. Please edit .env.production manually.");
  }
}

try {
  main();
} catch (error) {
  fail(error.message || "Unknown error while fixing .env.production");
}
