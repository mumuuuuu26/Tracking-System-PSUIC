// client/src/config/psuPassport.js
export const PSU_PASSPORT_CONFIG = {
  // OAuth2 Configuration
  authorizationUrl: "https://onepassport.psu.ac.th/application/o/authorize/",
  tokenUrl: "https://onepassport.psu.ac.th/application/o/token/",
  clientId: import.meta.env.VITE_PSU_CLIENT_ID || "YOUR_CLIENT_ID",
  redirectUri:
    import.meta.env.VITE_PSU_REDIRECT_URI ||
    "http://localhost:5173/auth/callback",
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
