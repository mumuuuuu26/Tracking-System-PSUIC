const { spawn } = require("child_process");
const os = require("os");
const path = require("path");

function sanitizeNodeOptions(raw) {
  if (!raw) return "";
  const parts = raw.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const output = [];

  for (let i = 0; i < parts.length; i += 1) {
    const token = parts[i];
    if (token === "--localstorage-file") {
      i += 1;
      continue;
    }
    if (token.startsWith("--localstorage-file=")) {
      continue;
    }
    output.push(token);
  }

  return output.join(" ").trim();
}

const env = { ...process.env };
if (Object.prototype.hasOwnProperty.call(env, "NO_COLOR")) {
  delete env.NO_COLOR;
}

const sanitizedNodeOptions = sanitizeNodeOptions(env.NODE_OPTIONS || "");
const nodeOptionTokens = sanitizedNodeOptions ? [sanitizedNodeOptions] : [];
const supportsLocalStorageFileFlag =
  typeof process.allowedNodeEnvironmentFlags?.has === "function" &&
  process.allowedNodeEnvironmentFlags.has("--localstorage-file");

if (supportsLocalStorageFileFlag) {
  const localStorageFilePath = path.join(os.tmpdir(), "jest-localstorage.json");
  nodeOptionTokens.push(`--localstorage-file=${localStorageFilePath}`);
}

if (nodeOptionTokens.length > 0) {
  env.NODE_OPTIONS = nodeOptionTokens.join(" ");
} else {
  delete env.NODE_OPTIONS;
}

const jestCli = require.resolve("jest/bin/jest");
const args = [jestCli, ...process.argv.slice(2)];

const child = spawn(process.execPath, args, {
  env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
