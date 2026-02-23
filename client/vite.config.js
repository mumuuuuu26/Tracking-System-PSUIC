import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

// https://vite.dev/config/
const backendProxyTarget = process.env.VITE_BACKEND_PROXY_TARGET || "https://localhost:5002";

export default defineConfig(({ mode }) => {
  const isTestMode = mode === "test" || process.env.VITEST === "true";

  return {
    plugins: [react(), !isTestMode && mkcert()].filter(Boolean),
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      css: false,
    },
    server: {
      https: true,
      allowedHosts: [
        "horsiest-chong-inelegantly.ngrok-free.dev", //host ของ ngrok ตรงนี้
      ],
      proxy: {
        "/api": {
          target: backendProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        "/uploads": {
          target: backendProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
