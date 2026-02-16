const dotenv = require("dotenv");
const path = require("path");

const envFile =
  process.env.NODE_ENV === "test"
    ? ".env.test"
    : process.env.NODE_ENV === "production"
    ? ".env.production"
    : ".env";

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

console.log(`[Config] Loaded environment: ${envFile}`);
