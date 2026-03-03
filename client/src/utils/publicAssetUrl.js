const normalizeBasePath = (value) => {
  const raw = String(value || "/").trim();
  if (!raw) return "/";
  if (raw === "/") return "/";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
};

export const publicAssetUrl = (assetPath) => {
  const normalizedPath = String(assetPath || "").replace(/^\/+/, "");
  const basePath = normalizeBasePath(import.meta.env.BASE_URL);
  return `${basePath}${normalizedPath}`;
};

