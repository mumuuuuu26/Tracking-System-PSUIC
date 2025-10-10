import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      "horsiest-chong-inelegantly.ngrok-free.dev", //host ของ ngrok ตรงนี้
    ],
  },
});
