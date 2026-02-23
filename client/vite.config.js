import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.split("?")[0].replace(/\\/g, "/");

          // Let Vite handle app-code chunking for React lazy routes.
          // Custom chunk names are applied only to node_modules to avoid
          // circular chunk imports that can cause blank screen at runtime.
          if (!normalizedId.includes("/node_modules/")) {
            return;
          }

          const [, packagePath = ""] = normalizedId.split("node_modules/");
          const parts = packagePath.split("/");
          const packageName = parts[0]?.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];

          if (!packageName) {
            return "vendor";
          }

          if (["react", "react-dom", "react-router-dom"].includes(packageName)) {
            return "vendor-react";
          }
          if (["socket.io-client", "engine.io-client", "socket.io-parser"].includes(packageName)) {
            return "vendor-socket";
          }
          if (packageName === "recharts" || packageName.startsWith("d3-")) {
            return "vendor-charts";
          }
          if (packageName === "html5-qrcode") {
            return "vendor-qr";
          }
          if (
            [
              "xlsx",
              "cfb",
              "codepage",
              "crc-32",
              "ssf",
              "wmf",
              "word",
              "fflate",
              "printj",
              "frac",
            ].includes(packageName)
          ) {
            return "vendor-xlsx";
          }
          if (["jspdf", "jspdf-autotable"].includes(packageName)) {
            return "vendor-pdf";
          }
          if (
            ["html2canvas", "canvg", "rgbcolor", "stackblur-canvas", "svg-pathdata"].includes(
              packageName,
            )
          ) {
            return "vendor-image-export";
          }
          if (
            ["axios", "dayjs", "zustand", "immer", "react-toastify", "sweetalert2", "lucide-react"].includes(
              packageName,
            )
          ) {
            return "vendor-ui";
          }

          return "vendor";
        },
      },
    },
  },
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
