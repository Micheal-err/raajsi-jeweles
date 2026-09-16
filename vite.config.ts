import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tailwindcss(),
    TanStackRouterVite({
      target: "react",
      autoCodeSplitting: true,
    }),
    viteReact(),
  ],
  build: {
    target: "esnext",
    outDir: "dist",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three")) {
            return "vendor-three";
          }
          if (id.includes("node_modules/@supabase")) {
            return "vendor-supabase";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
        },
      },
    },
  },
});
