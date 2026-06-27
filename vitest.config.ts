import { defineConfig } from "vitest/config";
import path from "path";

const templateRoot = path.resolve(import.meta.dirname);

export default defineConfig({
  root: templateRoot,
  // App .tsx files rely on the automatic JSX runtime (Vite's React plugin in the
  // app build); esbuild defaults to the classic runtime, which needs React in
  // scope. Match the app so .tsx tests transform identically.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": path.resolve(templateRoot, "client", "src"),
      "@shared": path.resolve(templateRoot, "shared"),
      "@assets": path.resolve(templateRoot, "attached_assets"),
    },
  },
  test: {
    environment: "node",
    include: [
      "server/**/*.test.ts",
      "server/**/*.spec.ts",
      "shared/**/*.test.ts",
      "shared/**/*.spec.ts",
      "client/**/*.test.ts",
      "client/**/*.spec.ts",
      "client/**/*.test.tsx",
      "client/**/*.spec.tsx",
      "scripts/**/*.test.ts",
      "scripts/**/*.spec.ts",
    ],
    setupFiles: ["./vitest.setup.ts"],
  },
});
