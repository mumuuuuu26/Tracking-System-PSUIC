const normalizeBasePath = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw === "/") return "/";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.replace(/\/+$/, "");
};

const toUrlObject = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withProtocol);
  } catch {
    return null;
  }
};

const extractPathFromUrl = (value) => {
  const parsed = toUrlObject(value);
  if (!parsed) return "";
  return normalizeBasePath(parsed.pathname || "");
};

const resolveConfiguredAppBasePath = () => {
  const explicitBasePath =
    normalizeBasePath(process.env.APP_BASE_PATH) ||
    normalizeBasePath(process.env.PUBLIC_BASE_PATH);

  if (explicitBasePath) {
    return explicitBasePath;
  }

  const derivedFromFrontendUrl =
    extractPathFromUrl(process.env.FRONTEND_URL) ||
    extractPathFromUrl(process.env.CLIENT_URL);

  if (derivedFromFrontendUrl && derivedFromFrontendUrl !== "/") {
    return derivedFromFrontendUrl;
  }

  return process.env.NODE_ENV === "production" ? "/app" : "";
};

const resolveRequestOrigin = (req) => {
  if (!req) return "";
  const forwardedProto = String(req.get?.("x-forwarded-proto") || "")
    .split(",")[0]
    .trim()
    .toLowerCase();
  const proto = forwardedProto || req.protocol || "http";
  const forwardedHost = String(req.get?.("x-forwarded-host") || "")
    .split(",")[0]
    .trim();
  const host = forwardedHost || req.get?.("host") || "";
  if (!host) return "";
  return `${proto}://${host}`;
};

const joinPath = (basePath, relativePath) => {
  const base = normalizeBasePath(basePath);
  const rel = String(relativePath || "").trim();
  if (!rel) return base || "/";
  const relWithLeadingSlash = rel.startsWith("/") ? rel : `/${rel}`;
  if (!base || base === "/") return relWithLeadingSlash;
  return `${base}${relWithLeadingSlash}`.replace(/\/{2,}/g, "/");
};

const buildFrontendUrl = (req, relativePath = "/") => {
  const basePath = resolveConfiguredAppBasePath();
  const baseUrlObject =
    toUrlObject(process.env.FRONTEND_URL) ||
    toUrlObject(process.env.CLIENT_URL) ||
    toUrlObject(resolveRequestOrigin(req)) ||
    new URL("http://localhost:5002");

  const targetPath = joinPath(basePath, relativePath);
  baseUrlObject.pathname = targetPath;
  baseUrlObject.search = "";
  baseUrlObject.hash = "";

  return baseUrlObject.toString();
};

module.exports = {
  buildFrontendUrl,
};
