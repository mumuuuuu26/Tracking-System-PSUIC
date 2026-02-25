const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

const envFiles =
  process.env.NODE_ENV === "test"
    ? [".env.test.local", ".env.test"]
    : process.env.NODE_ENV === "production"
    ? [".env.production.local", ".env.production"]
    : [".env.local", ".env"];

const isCi = ["1", "true"].includes(String(process.env.CI).toLowerCase());
const isTestLike = process.env.NODE_ENV === "test" || isCi;
const shouldLogEnvLoad = process.env.LOG_ENV_LOAD === "true";

const loadedEnvFiles = [];
envFiles.forEach((file) => {
  const resolvedPath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(resolvedPath)) {
    return;
  }

  dotenv.config({
    path: resolvedPath,
    quiet: isTestLike,
  });
  loadedEnvFiles.push(file);
});

if (process.env.NODE_ENV === "production") {
  const requiredProductionVars = ["DATABASE_URL", "SECRET", "CLIENT_URL", "FRONTEND_URL"];
  const missingProductionVars = requiredProductionVars.filter(
    (key) => !process.env[key] || String(process.env[key]).trim().length === 0,
  );

  if (missingProductionVars.length > 0) {
    throw new Error(
      `[Config] Missing required production env vars: ${missingProductionVars.join(", ")}`,
    );
  }
}

if (!isTestLike || shouldLogEnvLoad) {
  const loadedLabel = loadedEnvFiles.length > 0 ? loadedEnvFiles.join(", ") : "none";
  console.log(`[Config] Loaded environment: ${loadedLabel}`);
}
