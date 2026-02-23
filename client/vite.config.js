import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    css: false,
  },
  server: {
    allowedHosts: [
      "horsiest-chong-inelegantly.ngrok-free.dev", //host ของ ngrok ตรงนี้
    ],
    proxy: {
      "/api": {
        target: "http://localhost:5002",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://localhost:5002",
        changeOrigin: true,
      },
    },
  },
});
