import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig, devices } from "@playwright/test";

const workspaceRoot = process.env.CODING_CAD_E2E_WORKSPACE_ROOT ?? mkdtempSync(join(tmpdir(), "coding-cad-p3-e2e-"));
process.env.CODING_CAD_E2E_WORKSPACE_ROOT = workspaceRoot;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  globalSetup: "./e2e/workspace-setup.ts",
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry"
  },
  projects: [{ name: "chrome", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    // vite dev serves SvelteKit server routes (needed for the Workspace API),
    // unlike pnpm preview which is a static production preview.
    command: "pnpm dev --host 127.0.0.1 --port 4173",
    port: 4173,
    reuseExistingServer: false,
    env: { CODING_CAD_WORKSPACE_ROOT: workspaceRoot }
  }
});
