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
      "/api": "http://127.0.0.1:8000",
      "/uploads": "http://127.0.0.1:8000",
    },
  },
  build: {
    // Split du bundle pour reduire la taille initiale
    rollupOptions: {
      output: {
        manualChunks: {
          // React + react-router : ~150 KB, charge sur toutes les pages
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          // QR / scanner : ~200 KB, charge uniquement sur controleur + cashier
          "qr": ["html5-qrcode", "qrcode"],
          // HTTP / state : leger mais isole pour le cache long
          "vendor-utils": ["axios", "zustand"],
          // Icones : barrel import lourd, isole pour cache
          "icons": ["lucide-react"],
        },
      },
    },
    // Augmente le seuil d'avertissement (les chunks split sont OK > 500 KB)
    chunkSizeWarningLimit: 700,
  },
});
