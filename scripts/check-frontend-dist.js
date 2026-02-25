#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const distDir = path.join(projectRoot, "client", "dist");
const assetsDir = path.join(distDir, "assets");
const indexHtmlPath = path.join(distDir, "index.html");

function fail(message) {
  console.error(`[FRONTEND DIST CHECK] ${message}`);
  process.exit(1);
}

function info(message) {
  console.log(`[FRONTEND DIST CHECK] ${message}`);
}

function assertExists(p, label) {
  if (!fs.existsSync(p)) {
    fail(`${label} not found: ${p}`);
  }
}

assertExists(indexHtmlPath, "index.html");
assertExists(assetsDir, "assets directory");

const assetsStat = fs.statSync(assetsDir);
if (!assetsStat.isDirectory()) {
  fail(`assets path is not a directory: ${assetsDir}`);
}

const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
const linkedAssets = new Set();
const assetRefRegex = /(?:src|href)=["'](?:\.\/|\/)?assets\/([^"'?#]+)(?:\?[^"']*)?["']/gi;
let match = null;

while ((match = assetRefRegex.exec(indexHtml)) !== null) {
  if (match[1]) linkedAssets.add(match[1]);
}

if (linkedAssets.size === 0) {
  fail("index.html does not reference any client/dist/assets files.");
}

let scriptCount = 0;
let styleCount = 0;

for (const relativeAssetPath of linkedAssets) {
  const assetPath = path.join(assetsDir, relativeAssetPath);
  if (!fs.existsSync(assetPath)) {
    fail(`Referenced asset is missing: assets/${relativeAssetPath}`);
  }

  const stat = fs.statSync(assetPath);
  if (!stat.isFile()) {
    fail(`Referenced asset is not a file: assets/${relativeAssetPath}`);
  }
  if (stat.size <= 0) {
    fail(`Referenced asset is empty: assets/${relativeAssetPath}`);
  }

  const ext = path.extname(relativeAssetPath).toLowerCase();
  if (ext === ".js" || ext === ".mjs") scriptCount += 1;
  if (ext === ".css") styleCount += 1;
}

if (scriptCount === 0) {
  fail("index.html has no referenced JavaScript entry/module chunk.");
}

const assetFiles = fs.readdirSync(assetsDir).filter((name) => {
  const fullPath = path.join(assetsDir, name);
  try {
    return fs.statSync(fullPath).isFile();
  } catch {
    return false;
  }
});
if (assetFiles.length === 0) {
  fail("assets directory is empty.");
}

info(
  `OK: verified index.html and ${linkedAssets.size} linked asset(s) (${scriptCount} script, ${styleCount} stylesheet).`
);
process.exit(0);
