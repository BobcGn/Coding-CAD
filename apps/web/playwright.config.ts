import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const workspaceRoot = process.env.CODING_CAD_E2E_WORKSPACE_ROOT ?? mkdtempSync(join(tmpdir(), "coding-cad-p3-e2e-"));
process.env.CODING_CAD_E2E_WORKSPACE_ROOT = workspaceRoot;

export default defineConfig({
  testDir: "./e2e",
  metadata: { layoutMode: "dev" },
  fullyParallel: false,
  workers: 1,
  globalSetup: "./e2e/workspace-setup.ts",
  forbidOnly: Boolean(process.env.CI),
  // A fallback on any attempt must keep the CI gate red.
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry"
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    // Default dev suite; preview runs the same server-route workflows separately.
    command: "pnpm dev --host 127.0.0.1 --port 4173 --strictPort",
    port: 4173,
    reuseExistingServer: false,
    env: { CODING_CAD_WORKSPACE_ROOT: workspaceRoot }
  }
});
