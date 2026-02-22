const { spawn } = require("child_process");

const env = { ...process.env };
if (Object.prototype.hasOwnProperty.call(env, "NO_COLOR")) {
  delete env.NO_COLOR;
}

const playwrightCli = require.resolve("@playwright/test/cli");
const args = [playwrightCli, ...process.argv.slice(2)];

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
