import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const port = process.env.PORT ? parseInt(process.env.PORT) : 5173;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        /* Local backend by default. Set API_PROXY to the deployed backend
           (API_PROXY=https://backend-fj5a.onrender.com) to run against live
           data — the app then calls /api same-origin and the proxy adds the
           Host header, which avoids the CORS block the real backend applies
           to localhost. */
        target: process.env.API_PROXY || "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
  build: {
    outDir: "dist",
  },
});
