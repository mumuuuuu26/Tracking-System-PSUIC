const fs = require("fs");
const path = require("path");
const options = require("./swagger-options");

const isProduction = process.env.NODE_ENV === "production";
const useDynamicInProduction = String(process.env.SWAGGER_DYNAMIC_IN_PROD || "").toLowerCase() === "true";
const staticSpecPath = path.join(__dirname, "swagger-static.json");

const buildDynamicSpec = () => {
  // Lazy import to avoid loading swagger-jsdoc on production startup by default.
  const swaggerJsdoc = require("swagger-jsdoc");
  return swaggerJsdoc(options);
};

let swaggerSpec = null;

if (isProduction && !useDynamicInProduction) {
  if (fs.existsSync(staticSpecPath)) {
    swaggerSpec = JSON.parse(fs.readFileSync(staticSpecPath, "utf8"));
  } else {
    // Fallback only when static file is missing.
    // eslint-disable-next-line no-console
    console.warn(`[Swagger] ${staticSpecPath} not found, falling back to dynamic generation.`);
  }
}

if (!swaggerSpec) {
  swaggerSpec = buildDynamicSpec();
}

module.exports = swaggerSpec;
