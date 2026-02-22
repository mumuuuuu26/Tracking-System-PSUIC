const fs = require("fs");
const path = require("path");
require("../config/env");
const prisma = require("../config/prisma");
const { logger } = require("../utils/logger");
const { getAbsoluteUploadDir } = require("../utils/uploadImage");

const URL_UPLOAD_PREFIX = "/uploads/";
const RETENTION_HOURS_DEFAULT = 24;

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const extractUploadRelativePath = (rawValue) => {
  if (typeof rawValue !== "string") return null;

  const cleaned = rawValue.trim().split("?")[0].split("#")[0];
  if (!cleaned.startsWith(URL_UPLOAD_PREFIX)) return null;

  const relativePath = cleaned.slice(URL_UPLOAD_PREFIX.length);
  if (!relativePath) return null;

  const normalized = path.posix.normalize(relativePath).replace(/^\/+/, "");
  if (!normalized || normalized.startsWith("..")) return null;

  return normalized;
};

const listUploadFiles = (directory) => {
  if (!fs.existsSync(directory)) return [];

  const files = [];
  const stack = [directory];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
      } else if (entry.isFile()) {
        files.push(absolutePath);
      }
    }
  }

  return files;
};

const loadReferencedUploadPaths = async () => {
  const [ticketImages, users, rooms] = await Promise.all([
    prisma.image.findMany({
      select: { url: true, secure_url: true },
    }),
    prisma.user.findMany({
      select: { picture: true },
    }),
    prisma.room.findMany({
      select: { imageUrl: true },
    }),
  ]);

  const referenced = new Set();
  const tryAdd = (value) => {
    const relativePath = extractUploadRelativePath(value);
    if (relativePath) referenced.add(relativePath);
  };

  for (const row of ticketImages) {
    tryAdd(row.url);
    tryAdd(row.secure_url);
  }
  for (const row of users) {
    tryAdd(row.picture);
  }
  for (const row of rooms) {
    tryAdd(row.imageUrl);
  }

  return referenced;
};

const cleanupOrphanUploads = async () => {
  const uploadDir = getAbsoluteUploadDir();
  if (!fs.existsSync(uploadDir)) {
    logger.info(`[UploadsCleanup] Upload directory not found, skipping: ${uploadDir}`);
    return;
  }

  const orphanRetentionHours = parsePositiveInt(
    process.env.UPLOAD_ORPHAN_RETENTION_HOURS,
    RETENTION_HOURS_DEFAULT,
  );
  const retentionMs = orphanRetentionHours * 60 * 60 * 1000;

  const referencedPaths = await loadReferencedUploadPaths();
  const uploadFiles = listUploadFiles(uploadDir);
  const now = Date.now();

  let scanned = 0;
  let keptReferenced = 0;
  let keptRecent = 0;
  let deleted = 0;
  let failures = 0;

  for (const absolutePath of uploadFiles) {
    const relativePath = path.relative(uploadDir, absolutePath).replace(/\\/g, "/");
    if (!relativePath || relativePath === ".gitkeep") continue;

    scanned += 1;

    if (referencedPaths.has(relativePath)) {
      keptReferenced += 1;
      continue;
    }

    const stats = fs.statSync(absolutePath);
    if (retentionMs > 0 && now - stats.mtimeMs < retentionMs) {
      keptRecent += 1;
      continue;
    }

    try {
      fs.rmSync(absolutePath, { force: true });
      deleted += 1;
    } catch (error) {
      failures += 1;
      logger.warn(`[UploadsCleanup] Failed deleting orphan file: ${absolutePath}`, error);
    }
  }

  logger.info(
    `[UploadsCleanup] scanned=${scanned} referenced=${keptReferenced} recent=${keptRecent} deleted=${deleted} failures=${failures}`,
  );

  if (failures > 0) {
    process.exitCode = 1;
  }
};

const main = async () => {
  try {
    await cleanupOrphanUploads();
  } catch (error) {
    logger.error(`[UploadsCleanup] Failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
};

main();
