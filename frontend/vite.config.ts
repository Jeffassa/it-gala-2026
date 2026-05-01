import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: true,        // expose sur le réseau local (ex: depuis téléphone wifi)
    port: 5173,
    allowedHosts: true, // accepte tous les hosts (utile pour ngrok / cloudflared)
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
});
