const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const envPath = path.join(process.cwd(), ".env.production");

const REQUIRED_KEYS = ["DATABASE_URL", "SECRET", "CLIENT_URL", "FRONTEND_URL"];
const KNOWN_KEY_PATTERN = /(?:^|["\s])([A-Z][A-Z0-9_]*)=/g;

function fail(message) {
  console.error(`[ENV FILE CHECK] ${message}`);
  process.exit(1);
}

function main() {
  if (!fs.existsSync(envPath)) {
    fail(`File not found: ${envPath}`);
  }

  const raw = fs.readFileSync(envPath, "utf8");
  if (!raw.trim()) {
    fail(".env.production is empty");
  }

const lines = raw.split(/\r?\n/);
  const seenKeys = new Map();
  for (const line of lines) {
    const keyMatch = line.match(/^([A-Z][A-Z0-9_]*)=/);
    if (keyMatch) {
      const key = keyMatch[1];
      seenKeys.set(key, (seenKeys.get(key) || 0) + 1);
    }

    if (!line.startsWith("GOOGLE_PRIVATE_KEY=")) continue;

    // Catch malformed line: ... "UPLOAD_DIR=... (or any other KEY=...) glued to private key line.
    let match;
    const foundKeys = [];
    while ((match = KNOWN_KEY_PATTERN.exec(line)) !== null) {
      foundKeys.push(match[1]);
    }
    KNOWN_KEY_PATTERN.lastIndex = 0;

    const unexpected = foundKeys.filter((key) => key !== "GOOGLE_PRIVATE_KEY");
    if (unexpected.length > 0) {
      fail(
        [
          "Malformed GOOGLE_PRIVATE_KEY line detected.",
          `Found extra key(s) on same line: ${unexpected.join(", ")}.`,
          "Fix .env.production so each KEY=VALUE is on its own line.",
        ].join(" "),
      );
    }

    if (/`r`n[A-Z][A-Z0-9_]*=/.test(line)) {
      fail(
        [
          "Malformed GOOGLE_PRIVATE_KEY line detected.",
          "Found literal `r`n before another KEY=VALUE token.",
          "Run: npm run fix:env:file:prod",
        ].join(" "),
      );
    }
  }

  const duplicatedKeys = [...seenKeys.entries()]
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
  if (duplicatedKeys.length > 0) {
    fail(`Duplicate key(s) found in .env.production: ${duplicatedKeys.join(", ")}`);
  }

  const parsed = dotenv.parse(raw);

  const missing = REQUIRED_KEYS.filter((key) => {
    const value = parsed[key];
    return !value || String(value).trim().length === 0;
  });
  if (missing.length > 0) {
    fail(`Missing required key(s): ${missing.join(", ")}`);
  }

  const privateKey = String(parsed.GOOGLE_PRIVATE_KEY || "");
  if (privateKey) {
    if (!privateKey.includes("BEGIN PRIVATE KEY") || !privateKey.includes("END PRIVATE KEY")) {
      fail("GOOGLE_PRIVATE_KEY is present but invalid format.");
    }
  }

  console.log("[ENV FILE CHECK] .env.production structure is valid.");
}

try {
  main();
} catch (error) {
  fail(error.message || "Unknown error while validating .env.production");
}
