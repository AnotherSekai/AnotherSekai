import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  build: {
    outDir: "dist/frontend",
  },
  resolve: {
    alias: {
      "@": `${process.cwd()}/src`,
    },
  },
  server: {
    proxy: {
      "/sekai-world": {
        target: "https://sekai-world.github.io",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/sekai-world/, ""),
      },
      "/storage": {
        target: "https://storage.sekai.best",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/storage/, ""),
        headers: {
          referer: "https://storage.sekai.best/",
        },
      },
      "/api": {
        target: "http://localhost:9000",
        changeOrigin: true,
      },
    },
  },
});
