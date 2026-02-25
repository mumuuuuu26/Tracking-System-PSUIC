import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = globalThis.process?.env ?? {};
  const isTestMode = mode === "test" || env.VITEST === "true";
  const isCi = ["1", "true"].includes(String(env.CI).toLowerCase());
  const useHttpsDevServer = env.VITE_DEV_HTTPS === "true" && !isTestMode && !isCi;
  const backendProxyTarget =
    env.VITE_BACKEND_PROXY_TARGET ||
    (useHttpsDevServer ? "https://localhost:5002" : "http://localhost:5002");

  return {
    plugins: [react(), useHttpsDevServer && mkcert()].filter(Boolean),
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/setupTests.js",
      css: false,
    },
    server: {
      https: useHttpsDevServer,
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
