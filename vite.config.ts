import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools(), tailwindcss()],
  css: {
    postcss: {
      plugins: [
        require("autoprefixer")
      ],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
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
    },
  },
});
