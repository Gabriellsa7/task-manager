import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    setupFiles: ["./src/test/setup.ts"],
    projects: [
      {
        extends: true,
        test: { name: "server", environment: "node", include: ["src/**/*.test.ts"] },
      },
      {
        extends: true,
        test: { name: "ui", environment: "jsdom", include: ["src/**/*.test.tsx"] },
      },
    ],
  },
});
