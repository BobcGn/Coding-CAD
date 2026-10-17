import { defineConfig } from "@playwright/test";
import config from "./playwright.config.js";

export default defineConfig({
  ...config,
  metadata: { layoutMode: "preview" },
  webServer: {
    command: "pnpm exec vite preview --host 127.0.0.1 --port 4173 --strictPort",
    port: 4173,
    reuseExistingServer: false,
    env: {
      CODING_CAD_WORKSPACE_ROOT: process.env.CODING_CAD_E2E_WORKSPACE_ROOT!,
      CODING_CAD_ENABLE_REPOSITORY_ANALYSIS: "true"
    }
  }
});
