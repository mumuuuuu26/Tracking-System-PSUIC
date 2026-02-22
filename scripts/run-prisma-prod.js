require("../config/env");

const { spawnSync } = require("child_process");

const COMMAND_MAP = {
  "migrate-deploy": ["migrate", "deploy"],
  generate: ["generate"],
};

const action = process.argv[2];
const prismaArgs = COMMAND_MAP[action];

if (!prismaArgs) {
  console.error(
    `[PRISMA PROD] Unknown action "${action}". Use one of: ${Object.keys(COMMAND_MAP).join(", ")}`,
  );
  process.exit(1);
}

const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npxCmd, ["prisma", ...prismaArgs], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  console.error(`[PRISMA PROD] Failed to execute Prisma command: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
