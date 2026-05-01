import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      "/matchmake": { target: "http://localhost:2567", ws: true, changeOrigin: true },
      "/arena":     { target: "ws://localhost:2567",   ws: true, changeOrigin: true },
    },
  },
  build: { outDir: "dist", emptyOutDir: true },
});
