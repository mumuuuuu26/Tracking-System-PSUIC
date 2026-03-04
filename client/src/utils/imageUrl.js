const normalizeBasePath = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw === "/") return "/";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
};

const removeTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const frontendBasePath = normalizeBasePath(import.meta.env.BASE_URL || "/");

const withFrontendBasePath = (path) => {
  if (!path.startsWith("/")) return path;
  if (!frontendBasePath || frontendBasePath === "/") return path;
  return `${removeTrailingSlash(frontendBasePath)}${path}`;
};

export const getImageUrl = (path) => {
  if (!path) {
    return withFrontendBasePath("/default-profile.svg");
  }

  const raw = String(path).trim();
  if (!raw) {
    return withFrontendBasePath("/default-profile.svg");
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  const cleanPath = raw.startsWith("/") ? raw : `/${raw}`;
  const apiUrl = String(import.meta.env.VITE_API_URL || "").trim();

  // Uploads are served by backend static path.
  // When app is deployed under /app, map local upload URLs to /app/uploads/...
  if (cleanPath.startsWith("/uploads/")) {
    if (apiUrl) {
      if (/^https?:\/\//i.test(apiUrl)) {
        try {
          const parsed = new URL(apiUrl);
          return `${removeTrailingSlash(parsed.origin)}${cleanPath}`;
        } catch {
          // Fallback below.
        }
      }
      return withFrontendBasePath(cleanPath);
    }
    return withFrontendBasePath(cleanPath);
  }

  if (!apiUrl) {
    return withFrontendBasePath(cleanPath);
  }

  const baseUrl = removeTrailingSlash(apiUrl.replace(/\/api$/i, ""));
  if (!baseUrl) return cleanPath;
  return `${baseUrl}${cleanPath}`;
};
