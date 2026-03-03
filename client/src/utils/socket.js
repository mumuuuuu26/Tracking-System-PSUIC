import io from "socket.io-client";

const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
const explicitSocketPath = import.meta.env.VITE_SOCKET_PATH;
const apiUrl = import.meta.env.VITE_API_URL;
const apiBaseOrigin = apiUrl ? apiUrl.replace(/\/api\/?$/, "") : null;
const defaultDevSocketUrl = "https://localhost:5002";
const socketUrl = explicitSocketUrl
  || (import.meta.env.PROD ? window.location.origin : (apiBaseOrigin || defaultDevSocketUrl));

const normalizeSocketPath = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "/socket.io";

  // Allow full URL input via env and keep only pathname.
  if (/^https?:\/\//i.test(raw)) {
    try {
      return normalizeSocketPath(new URL(raw).pathname);
    } catch {
      return "/socket.io";
    }
  }

  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  const collapsed = withLeadingSlash.replace(/\/{2,}/g, "/");
  const trimmedTrailing = collapsed !== "/" ? collapsed.replace(/\/+$/, "") : collapsed;
  return trimmedTrailing || "/socket.io";
};

const inferSocketPathFromApiUrl = () => {
  if (!apiUrl) return "";
  try {
    const parsed = new URL(apiUrl, window.location.origin);
    let basePath = String(parsed.pathname || "").replace(/\/+$/, "");

    if (/\/api$/i.test(basePath)) {
      basePath = basePath.slice(0, -4);
    }

    if (!basePath) return "";
    if (/\/socket\.io$/i.test(basePath)) return basePath;
    return `${basePath}/socket.io`;
  } catch {
    return "";
  }
};

const inferProdSocketPath = () => {
  const fromApi = inferSocketPathFromApiUrl();
  if (fromApi) return fromApi;

  const currentPath = String(window.location.pathname || "");
  // Production in this project is hosted under /app.
  if (currentPath === "/app" || currentPath.startsWith("/app/")) {
    return "/app/socket.io";
  }

  return "/socket.io";
};

const socketPath = normalizeSocketPath(
  explicitSocketPath || (import.meta.env.PROD ? inferProdSocketPath() : "/socket.io")
);

const readAuthToken = () => {
  try {
    const storage = localStorage.getItem("auth-store");
    if (!storage) return "";
    const parsed = JSON.parse(storage);
    return String(parsed?.state?.token || "").trim();
  } catch {
    return "";
  }
};

const socket = io(socketUrl, {
  autoConnect: false,
  path: socketPath,
  auth: (cb) => {
    const token = readAuthToken();
    cb(token ? { token } : {});
  },
});

export const syncSocketConnection = () => {
  const token = readAuthToken();
  socket.auth = token ? { token } : {};

  if (token) {
    if (!socket.connected) {
      socket.connect();
    }
    return;
  }

  if (socket.connected) {
    socket.disconnect();
  }
};

export default socket;
