import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/app/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    assetsDir: "assets",
    rollupOptions: {
      output: {
        // Assure que les chemins d'assets sont correctement préfixés
        assetFileNames: (assetInfo) => {
          const info = (assetInfo.name ?? "").split(".");
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
  },
  server: {
    headers: {
      // Configurer Content-Security-Policy pour autoriser les images de domaines externes
      "Content-Security-Policy":
        "default-src 'self'; img-src 'self' data: https://astronomy-store.com *.astronomy-store.com; font-src 'self' data:;",
    },
  },
});
