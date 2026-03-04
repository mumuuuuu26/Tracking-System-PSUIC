// client/src/config/psuPassport.js
const normalizeBaseUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw || raw === "/") return "/";
  const withLeadingSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
};

const buildDefaultRedirectUri = () => {
  if (typeof window === "undefined") {
    return "/auth/callback";
  }
  const baseUrl = normalizeBaseUrl(import.meta.env.BASE_URL || "/");
  return `${window.location.origin}${baseUrl}auth/callback`;
};

export const PSU_PASSPORT_CONFIG = {
  // OAuth2 Configuration
  authorizationUrl: "https://onepassport.psu.ac.th/application/o/authorize/",
  tokenUrl: "https://onepassport.psu.ac.th/application/o/token/",
  clientId: import.meta.env.VITE_PSU_CLIENT_ID || "YOUR_CLIENT_ID",
  redirectUri: import.meta.env.VITE_PSU_REDIRECT_URI || buildDefaultRedirectUri(),
  scope: "openid profile email",

  // สำหรับ development - mock authentication
  mockAuth: {
    enabled: import.meta.env.DEV,
    users: [
      {
        studentId: "6610110000",
        name: "นายทดสอบ ระบบ",
        email: "test@psu.ac.th",
        role: "user",
      },
    ],
  },
};
