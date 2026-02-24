require("./env");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const generatedClientDir = path.join(rootDir, "node_modules", ".prisma", "client");
const generatedClientCacheDir = path.join(rootDir, "prisma", "client-cache");

const hasGeneratedPrismaClient = (dir) => {
  if (!fs.existsSync(dir)) return false;
  if (!fs.existsSync(path.join(dir, "index.js"))) return false;
  const files = fs.readdirSync(dir);
  return files.some((name) => name.includes("query_engine") || name.includes("libquery_engine"));
};

const ensureDefaultEntrypointFiles = () => {
  const indexPath = path.join(generatedClientDir, "index.js");
  const defaultPath = path.join(generatedClientDir, "default.js");
  const defaultTypesPath = path.join(generatedClientDir, "default.d.ts");

  if (!fs.existsSync(indexPath)) return;

  if (!fs.existsSync(defaultPath)) {
    fs.writeFileSync(defaultPath, "module.exports = require('./index')\n", "utf8");
  }
  if (!fs.existsSync(defaultTypesPath)) {
    fs.writeFileSync(defaultTypesPath, "export * from './index'\n", "utf8");
  }
};

const tryRestoreClientFromCache = () => {
  if (!hasGeneratedPrismaClient(generatedClientCacheDir)) {
    return false;
  }

  fs.rmSync(generatedClientDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(generatedClientDir), { recursive: true });
  fs.cpSync(generatedClientCacheDir, generatedClientDir, { recursive: true });
  ensureDefaultEntrypointFiles();
  return hasGeneratedPrismaClient(generatedClientDir);
};

if (!hasGeneratedPrismaClient(generatedClientDir)) {
  tryRestoreClientFromCache();
}
ensureDefaultEntrypointFiles();

if (!hasGeneratedPrismaClient(generatedClientDir)) {
  throw new Error(
    [
      "[PrismaBoot] Generated Prisma client is missing.",
      "Run: node scripts/prisma-generate-safe.js",
      "If network blocks Prisma downloads, upload node_modules/.prisma/client or prisma/client-cache from build machine.",
    ].join(" "),
  );
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = prisma;
