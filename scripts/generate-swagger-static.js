const fs = require("fs");
const path = require("path");
require("../config/env");

const swaggerJsdoc = require("swagger-jsdoc");
const options = require("../config/swagger-options");

const outputPath = path.join(__dirname, "../config/swagger-static.json");
const spec = swaggerJsdoc(options);

fs.writeFileSync(outputPath, `${JSON.stringify(spec, null, 2)}\n`, "utf8");
// eslint-disable-next-line no-console
console.log(`[SWAGGER STATIC] Generated: ${outputPath}`);
