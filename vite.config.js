import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true
      },
      "/uploads": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true
      }
    }
  }
});
