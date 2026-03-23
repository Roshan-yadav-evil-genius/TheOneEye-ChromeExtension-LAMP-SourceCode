import path from "path"
import { defineConfig } from "vite"

/** Single-file IIFE so the content script runs without manifest `type: "module"`. */
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: false,
    lib: {
      entry: path.resolve(__dirname, "src/Content/index.ts"),
      name: "lampContent",
      formats: ["iife"],
      fileName: () => "content.js",
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
})
