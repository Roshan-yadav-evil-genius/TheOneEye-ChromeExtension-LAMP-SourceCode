import path from "path"
import { defineConfig } from "vite"

/** Single-file IIFE so the service worker runs without manifest `type: "module"`. */
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, "src/Service/index.ts"),
      name: "lampServiceWorker",
      formats: ["iife"],
      fileName: () => "serviceWorker.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
