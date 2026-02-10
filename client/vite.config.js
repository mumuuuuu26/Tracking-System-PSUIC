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
        target: "http://172.20.10.2:5002",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://172.20.10.2:5002",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
