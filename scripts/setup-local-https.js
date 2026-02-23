const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const certsDir = path.join(rootDir, "certs");
const keyRelativePath = "certs/localhost-key.pem";
const certRelativePath = "certs/localhost-cert.pem";
const keyAbsolutePath = path.join(rootDir, keyRelativePath);
const certAbsolutePath = path.join(rootDir, certRelativePath);
const opensslConfigPath = path.join(certsDir, "localhost-openssl.cnf");
const envPath = path.join(rootDir, ".env");
const envExamplePath = path.join(rootDir, ".env.example");

function runOrThrow(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function ensureOpenSsl() {
  const result = spawnSync("openssl", ["version"], { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new Error(
      "OpenSSL is required but not found. Install OpenSSL first, then re-run: npm run https:setup",
    );
  }
}

function normalizeToHttps(url, fallback) {
  if (!url || !String(url).trim()) {
    return fallback;
  }
  try {
    const parsed = new URL(url);
    parsed.protocol = "https:";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

function updateOrAppendEnv(content, key, value) {
  const lines = content.split(/\r?\n/);
  const target = `${key}=`;
  const index = lines.findIndex((line) => line.startsWith(target));
  const nextLine = `${key}=${value}`;

  if (index >= 0) {
    lines[index] = nextLine;
  } else {
    lines.push(nextLine);
  }

  return lines.join("\n").replace(/\n+$/, "\n");
}

function getEnvValue(content, key) {
  const match = content.match(new RegExp(`^${key}=(.*)$`, "m"));
  return match ? match[1].trim() : "";
}

function main() {
  ensureOpenSsl();

  fs.mkdirSync(certsDir, { recursive: true });
  fs.writeFileSync(
    opensslConfigPath,
    [
      "[req]",
      "default_bits = 2048",
      "prompt = no",
      "default_md = sha256",
      "x509_extensions = v3_req",
      "distinguished_name = dn",
      "",
      "[dn]",
      "CN = localhost",
      "",
      "[v3_req]",
      "subjectAltName = @alt_names",
      "",
      "[alt_names]",
      "DNS.1 = localhost",
      "IP.1 = 127.0.0.1",
      "",
    ].join("\n"),
    "utf8",
  );

  runOrThrow("openssl", [
    "req",
    "-x509",
    "-nodes",
    "-newkey",
    "rsa:2048",
    "-days",
    "825",
    "-keyout",
    keyAbsolutePath,
    "-out",
    certAbsolutePath,
    "-config",
    opensslConfigPath,
  ]);

  fs.rmSync(opensslConfigPath, { force: true });

  if (!fs.existsSync(envPath)) {
    if (!fs.existsSync(envExamplePath)) {
      throw new Error(`Missing env template: ${envExamplePath}`);
    }
    fs.copyFileSync(envExamplePath, envPath);
  }

  let envContent = fs.readFileSync(envPath, "utf8");
  const currentClientUrl = getEnvValue(envContent, "CLIENT_URL");
  const currentFrontendUrl = getEnvValue(envContent, "FRONTEND_URL");

  const updates = {
    HTTPS_ONLY: "true",
    ENABLE_HTTPS_HEADERS: "true",
    TLS_KEY_FILE: keyRelativePath,
    TLS_CERT_FILE: certRelativePath,
    HTTPS_PORT: "5002",
    CLIENT_URL: normalizeToHttps(currentClientUrl, "https://localhost:5173"),
    FRONTEND_URL: normalizeToHttps(currentFrontendUrl, "https://localhost:5173"),
  };

  for (const [key, value] of Object.entries(updates)) {
    envContent = updateOrAppendEnv(envContent, key, value);
  }

  fs.writeFileSync(envPath, envContent, "utf8");

  console.log("");
  console.log("[HTTPS] Local HTTPS setup completed.");
  console.log(`[HTTPS] Key:  ${keyAbsolutePath}`);
  console.log(`[HTTPS] Cert: ${certAbsolutePath}`);
  console.log("[HTTPS] Updated .env with HTTPS_ONLY=true and TLS paths.");
  console.log("[HTTPS] Start server with: npm run dev");
  console.log("[HTTPS] Test endpoint: curl -k https://localhost:5002/health");
}

main();
