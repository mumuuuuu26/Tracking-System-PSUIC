const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { logger } = require("./logger");

let sharp = null;
let hasLoggedSharpMissing = false;
try {
  // Optional dependency: when available, uploads are resized/compressed server-side.
  // If unavailable (e.g. offline CI), validation/storage still works without crashing.
  sharp = require("sharp");
} catch (_error) {
  sharp = null;
}

const DATA_URL_REGEX = /^data:(image\/[A-Za-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/;
const DEFAULT_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5MB per image
const DEFAULT_MAX_WIDTH = 1920;
const DEFAULT_MAX_HEIGHT = 1920;
const DEFAULT_WEBP_QUALITY = 82;
const URL_UPLOAD_PREFIX = "/uploads/";

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getAllowedMimeTypes = () => {
  const configured = String(process.env.UPLOAD_ALLOWED_MIME || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return configured.length > 0 ? configured : DEFAULT_ALLOWED_MIME_TYPES;
};

const getAbsoluteUploadDir = () => {
  const uploadDirName = process.env.UPLOAD_DIR || "uploads";
  return path.isAbsolute(uploadDirName)
    ? uploadDirName
    : path.join(__dirname, "..", uploadDirName);
};

const ensureUploadDirectory = () => {
  const uploadDir = getAbsoluteUploadDir();
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

const normalizeRelativeUploadPath = (uploadUrl) => {
  if (typeof uploadUrl !== "string") return null;
  const cleanedUrl = uploadUrl.trim().split("?")[0].split("#")[0];
  if (!cleanedUrl.startsWith(URL_UPLOAD_PREFIX)) return null;

  const relativePath = cleanedUrl.slice(URL_UPLOAD_PREFIX.length);
  if (!relativePath) return null;

  const normalized = path.posix.normalize(relativePath).replace(/^\/+/, "");
  if (!normalized || normalized.startsWith("..")) return null;

  return normalized;
};

const resolveUploadFilePath = (uploadUrl) => {
  const relativePath = normalizeRelativeUploadPath(uploadUrl);
  if (!relativePath) return null;

  const uploadDir = getAbsoluteUploadDir();
  const absolutePath = path.resolve(uploadDir, relativePath);
  const normalizedUploadDir = path.resolve(uploadDir);

  if (
    absolutePath !== normalizedUploadDir &&
    !absolutePath.startsWith(`${normalizedUploadDir}${path.sep}`)
  ) {
    return null;
  }

  return absolutePath;
};

const getTargetFormat = (inputMimeType) => {
  const configuredFormat = String(process.env.UPLOAD_TARGET_FORMAT || "webp")
    .trim()
    .toLowerCase();

  if (configuredFormat === "original") {
    if (inputMimeType === "image/png") return "png";
    if (inputMimeType === "image/webp") return "webp";
    return "jpeg";
  }

  if (configuredFormat === "png" || configuredFormat === "jpeg" || configuredFormat === "jpg") {
    return configuredFormat === "jpg" ? "jpeg" : configuredFormat;
  }

  return "webp";
};

const processImageBuffer = async (rawBuffer, inputMimeType) => {
  if (!sharp) {
    if (!hasLoggedSharpMissing) {
      logger.warn(
        "[Uploads] sharp not installed. Resize/compress is disabled; storing validated original image.",
      );
      hasLoggedSharpMissing = true;
    }

    const originalExtension =
      inputMimeType === "image/png" ? "png" : inputMimeType === "image/webp" ? "webp" : "jpg";
    return {
      processedBuffer: rawBuffer,
      outputMimeType: inputMimeType,
      extension: originalExtension,
    };
  }

  const maxWidth = parsePositiveInt(process.env.UPLOAD_MAX_WIDTH, DEFAULT_MAX_WIDTH);
  const maxHeight = parsePositiveInt(process.env.UPLOAD_MAX_HEIGHT, DEFAULT_MAX_HEIGHT);
  const quality = parsePositiveInt(process.env.UPLOAD_QUALITY, DEFAULT_WEBP_QUALITY);
  const targetFormat = getTargetFormat(inputMimeType);

  let transformer = sharp(rawBuffer, { failOn: "error" })
    .rotate()
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });

  if (targetFormat === "png") {
    transformer = transformer.png({ compressionLevel: 9, adaptiveFiltering: true });
  } else if (targetFormat === "jpeg") {
    transformer = transformer.jpeg({ quality: Math.min(100, Math.max(1, quality)), mozjpeg: true });
  } else {
    transformer = transformer.webp({ quality: Math.min(100, Math.max(1, quality)) });
  }

  const processedBuffer = await transformer.toBuffer();
  const outputMimeType =
    targetFormat === "png" ? "image/png" : targetFormat === "jpeg" ? "image/jpeg" : "image/webp";
  const extension = targetFormat === "jpeg" ? "jpg" : targetFormat;

  return { processedBuffer, outputMimeType, extension };
};

const deleteImageByUrl = (uploadUrl) => {
  const absolutePath = resolveUploadFilePath(uploadUrl);
  if (!absolutePath || !fs.existsSync(absolutePath)) return false;

  try {
    fs.rmSync(absolutePath, { force: true });
    return true;
  } catch (error) {
    logger.warn(`[Uploads] Failed to delete file: ${absolutePath}`, error);
    return false;
  }
};

const saveImage = async (base64String, options = {}) => {
  if (!base64String || typeof base64String !== "string") return null;

  try {
    const matches = base64String.match(DATA_URL_REGEX);
    if (!matches || matches.length !== 3) {
      logger.warn("[Uploads] Reject image payload: expected data URL format.");
      return null;
    }

    const mimeType = matches[1].toLowerCase();
    const allowedMimeTypes = getAllowedMimeTypes();
    if (!allowedMimeTypes.includes(mimeType)) {
      logger.warn(`[Uploads] Reject image payload: unsupported MIME type "${mimeType}".`);
      return null;
    }

    const imageBuffer = Buffer.from(matches[2], "base64");
    if (!imageBuffer || imageBuffer.length === 0) {
      logger.warn("[Uploads] Reject image payload: decoded buffer is empty.");
      return null;
    }

    const maxBytes = parsePositiveInt(process.env.UPLOAD_MAX_BYTES, DEFAULT_MAX_BYTES);
    if (imageBuffer.length > maxBytes) {
      logger.warn(
        `[Uploads] Reject image payload: ${imageBuffer.length} bytes exceeds limit ${maxBytes} bytes.`,
      );
      return null;
    }

    const { processedBuffer, outputMimeType, extension } = await processImageBuffer(imageBuffer, mimeType);
    if (!processedBuffer || processedBuffer.length === 0) {
      logger.warn("[Uploads] Reject image payload: failed to process image.");
      return null;
    }

    const uploadDir = ensureUploadDirectory();
    const filename = `${uuidv4()}.${extension}`;
    const filePath = path.join(uploadDir, filename);

    await fs.promises.writeFile(filePath, processedBuffer);

    logger.debug(
      `[Uploads] Saved image ${filename} (${outputMimeType}, ${processedBuffer.length} bytes)${
        options.scope ? ` for ${options.scope}` : ""
      }`,
    );

    return `${URL_UPLOAD_PREFIX}${filename}`;
  } catch (err) {
    logger.error("Image upload failed:", err);
    return null;
  }
};

module.exports = {
  saveImage,
  deleteImageByUrl,
  getAbsoluteUploadDir,
  resolveUploadFilePath,
};
