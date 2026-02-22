const dotenv = require("dotenv");
const path = require("path");

const envFile =
  process.env.NODE_ENV === "test"
    ? ".env.test"
    : process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env";

const isCi = ["1", "true"].includes(String(process.env.CI).toLowerCase());
const isTestLike = process.env.NODE_ENV === "test" || isCi;
const shouldLogEnvLoad = process.env.LOG_ENV_LOAD === "true";

dotenv.config({
  path: path.resolve(process.cwd(), envFile),
  quiet: isTestLike,
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
  console.log(`[Config] Loaded environment: ${envFile}`);
}
