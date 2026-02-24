const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = process.cwd();
const schemaPath = path.join(rootDir, "prisma", "schema.prisma");
const generatedClientDir = path.join(rootDir, "node_modules", ".prisma", "client");
const generatedSchemaPath = path.join(generatedClientDir, "schema.prisma");
const generatedIndexPath = path.join(generatedClientDir, "index.js");
const generatedDefaultPath = path.join(generatedClientDir, "default.js");
const generatedDefaultTypesPath = path.join(generatedClientDir, "default.d.ts");
const stateDir = path.join(rootDir, ".deploy-state");
const stateFilePath = path.join(stateDir, "prisma-state.json");
const backupDir = path.join(stateDir, "prisma-client-backup");
const prismaClientCacheDir = path.join(rootDir, "prisma", "client-cache");
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

function readState() {
  if (!fs.existsSync(stateFilePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(stateFilePath, "utf8"));
  } catch {
    return {};
  }
}

function writeState(nextState) {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(stateFilePath, `${JSON.stringify(nextState, null, 2)}\n`, "utf8");
}

function hasGeneratedClientAt(clientDir, requireDefault = true) {
  if (!fs.existsSync(clientDir)) return false;
  if (!fs.existsSync(path.join(clientDir, "index.js"))) return false;
  if (requireDefault && !fs.existsSync(path.join(clientDir, "default.js"))) return false;

  const files = fs.readdirSync(clientDir);
  return files.some((name) => name.includes("query_engine") || name.includes("libquery_engine"));
}

function hasGeneratedClient() {
  return hasGeneratedClientAt(generatedClientDir);
}

function hasMatchingGeneratedSchema(schemaHash) {
  if (!fs.existsSync(generatedSchemaPath)) return false;
  return hashFile(generatedSchemaPath) === schemaHash;
}

function isTrue(value) {
  return ["1", "true", "yes"].includes(String(value || "").toLowerCase());
}

function copyDirectory(sourceDir, destinationDir) {
  fs.rmSync(destinationDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(destinationDir), { recursive: true });
  fs.cpSync(sourceDir, destinationDir, { recursive: true });
}

function ensurePrismaDefaultEntrypoint() {
  if (!fs.existsSync(generatedIndexPath)) {
    return false;
  }

  let changed = false;
  if (!fs.existsSync(generatedDefaultPath)) {
    fs.writeFileSync(generatedDefaultPath, "module.exports = require('./index')\n", "utf8");
    changed = true;
  }
  if (!fs.existsSync(generatedDefaultTypesPath)) {
    fs.writeFileSync(generatedDefaultTypesPath, "export * from './index'\n", "utf8");
    changed = true;
  }

  if (changed) {
    console.warn("[PRISMA SAFE] Repaired missing Prisma default entrypoint files.");
  }
  return changed;
}

function isCertChainBlocked(outputText) {
  const text = String(outputText || "").toLowerCase();
  return (
    text.includes("self-signed certificate") ||
    text.includes("unable to verify the first certificate") ||
    text.includes("unable to get local issuer certificate") ||
    text.includes("certificate in certificate chain")
  );
}

function restoreFromCacheIfAvailable() {
  const cacheCandidates = [prismaClientCacheDir, backupDir];
  for (const candidate of cacheCandidates) {
    if (!hasGeneratedClientAt(candidate, false)) {
      continue;
    }
    copyDirectory(candidate, generatedClientDir);
    ensurePrismaDefaultEntrypoint();
    if (hasGeneratedClient()) {
      console.warn(`[PRISMA SAFE] Restored generated Prisma client from cache: ${candidate}`);
      return true;
    }
  }
  return false;
}

function runPrismaGenerate(extraEnv = {}) {
  const env = { ...process.env, ...extraEnv };
  const isWindows = process.platform === "win32";
  const result = isWindows
    ? spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", "npx --no-install prisma generate"], {
        stdio: "pipe",
        env,
        encoding: "utf8",
      })
    : spawnSync(npxCmd, ["--no-install", "prisma", "generate"], {
        stdio: "pipe",
        env,
        encoding: "utf8",
      });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) {
    throw result.error;
  }
  return {
    ok: result.status === 0,
    output: `${result.stdout || ""}\n${result.stderr || ""}`,
  };
}

function main() {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`[PRISMA SAFE] Missing schema file: ${schemaPath}`);
  }

  fs.mkdirSync(stateDir, { recursive: true });
  const schemaHash = hashFile(schemaPath);
  const previousState = readState();
  const schemaChanged =
    Boolean(previousState.schemaHash) && previousState.schemaHash !== schemaHash;
  const forceGenerate =
    String(process.env.FORCE_PRISMA_GENERATE || "").toLowerCase() === "true";
  const allowOnlineGenerate = isTrue(process.env.ALLOW_PRISMA_GENERATE_ON_SERVER) || forceGenerate;
  const allowInsecureTlsFallback = isTrue(process.env.PRISMA_ALLOW_INSECURE_TLS_FALLBACK);
  ensurePrismaDefaultEntrypoint();
  const hadClientBeforeGenerate = hasGeneratedClient();
  const generatedSchemaMatches = hasMatchingGeneratedSchema(schemaHash);
  const shouldGenerate =
    forceGenerate || schemaChanged || !hadClientBeforeGenerate || !generatedSchemaMatches;

  if (!allowOnlineGenerate) {
    if (!hadClientBeforeGenerate && !restoreFromCacheIfAvailable()) {
      throw new Error(
        [
          "[PRISMA SAFE] Offline mode is active and generated Prisma client is missing.",
          "Upload node_modules/.prisma/client to this server (or provide prisma/client-cache), then rerun deploy.",
        ].join(" "),
      );
    }

    if (!generatedSchemaMatches) {
      const strictMismatch = isTrue(process.env.PRISMA_SCHEMA_MISMATCH_STRICT);
      const mismatchMessage = [
        "[PRISMA SAFE] Offline mode detected schema mismatch between prisma/schema.prisma and node_modules/.prisma/client/schema.prisma.",
        "Please generate Prisma client for this exact schema and upload node_modules/.prisma/client to this server.",
      ].join(" ");
      if (strictMismatch) {
        throw new Error(mismatchMessage);
      }
      console.warn(`${mismatchMessage} Continuing with existing client (non-strict mode).`);
    }

    console.log(
      "[PRISMA SAFE] Offline mode: generated client is present. Skipping prisma generate.",
    );
    writeState({
      schemaHash,
      generatedAt: new Date().toISOString(),
      source: "offline-verified",
    });
    return;
  }

  if (!shouldGenerate) {
    console.log("[PRISMA SAFE] Existing generated client is valid. Skipping prisma generate.");
    writeState({
      schemaHash,
      generatedAt: new Date().toISOString(),
      source: "existing-client",
    });
    return;
  }

  if (hadClientBeforeGenerate) {
    copyDirectory(generatedClientDir, backupDir);
    console.log("[PRISMA SAFE] Backed up current Prisma client.");
  }

  console.log("[PRISMA SAFE] Running prisma generate...");
  let generateResult = runPrismaGenerate();

  if (!generateResult.ok && allowInsecureTlsFallback && isCertChainBlocked(generateResult.output)) {
    console.warn(
      "[PRISMA SAFE] Detected certificate-chain interception. Retrying prisma generate with temporary insecure TLS fallback.",
    );
    generateResult = runPrismaGenerate({
      NODE_TLS_REJECT_UNAUTHORIZED: "0",
      npm_config_strict_ssl: "false",
    });
  }

  ensurePrismaDefaultEntrypoint();
  if (generateResult.ok && hasGeneratedClient()) {
    fs.rmSync(backupDir, { recursive: true, force: true });
    if (hasGeneratedClient()) {
      copyDirectory(generatedClientDir, prismaClientCacheDir);
    }
    console.log("[PRISMA SAFE] Prisma client generated successfully.");
    writeState({
      schemaHash,
      generatedAt: new Date().toISOString(),
      source: "prisma-generate",
    });
    return;
  }

  const canRestore =
    fs.existsSync(backupDir) &&
    hadClientBeforeGenerate &&
    !schemaChanged &&
    !forceGenerate;

  if (canRestore) {
    copyDirectory(backupDir, generatedClientDir);
    fs.rmSync(backupDir, { recursive: true, force: true });
    ensurePrismaDefaultEntrypoint();
    if (hasGeneratedClient()) {
      console.warn(
        "[PRISMA SAFE] prisma generate failed, restored cached Prisma client (schema unchanged). Continuing deploy.",
      );
      writeState({
        schemaHash,
        generatedAt: new Date().toISOString(),
        source: "restored-backup",
      });
      return;
    }
  }

  if (restoreFromCacheIfAvailable()) {
    writeState({
      schemaHash,
      generatedAt: new Date().toISOString(),
      source: "restored-cache-after-generate-fail",
    });
    return;
  }

  throw new Error(
    [
      "[PRISMA SAFE] prisma generate failed and no safe fallback is available.",
      "If outbound access is blocked by SSL inspection, set PRISMA_ALLOW_INSECURE_TLS_FALLBACK=true",
      "or upload node_modules/.prisma/client (or prisma/client-cache) from a trusted machine for this exact schema.",
    ].join(" "),
  );
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
