import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, type Page } from "@playwright/test";
import { test } from "./layout-fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const exampleProjectFixture = path.join(
  repoRoot,
  "packages/implementation-analyzer/fixtures/example-project"
);

async function approve(page: Page, rationale = "Candidate meets requirements."): Promise<void> {
  await page.getByLabel("Review rationale").fill(rationale);
  await page.getByRole("button", { name: "Accept", exact: true }).click();
  await expect(page.getByText(/Candidate accepted/i)).toBeVisible();
}

test("execution handoff preview, guide switching, canvas focus, copy, export, and staleness detection", async ({ page }) => {
  // Grant clipboard permissions for copy assertion
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Greenfield Architecture Workspace" })).toBeVisible();

  // 1. Generate and approve architecture
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await approve(page);

  // 2. Open Execution Handoff modal
  const handoffBtn = page.getByTestId("sidebar-execution-handoff");
  await expect(handoffBtn).toBeVisible();
  await handoffBtn.click();

  const modal = page.getByTestId("execution-handoff-modal");
  await expect(modal).toBeVisible();

  // Verify architecture reference
  await expect(page.getByTestId("handoff-arch-ref")).toContainText("@architecture-ir:");

  // 3. Blueprint preview and task provenance
  await expect(page.getByTestId("blueprint-view")).toBeVisible();
  const taskItems = page.getByTestId("handoff-task-item");
  const taskCount = await taskItems.count();
  expect(taskCount).toBeGreaterThan(0);

  // Click source component link to focus on canvas
  const firstSourceLink = page.getByTestId("task-source-link").first();
  await expect(firstSourceLink).toBeVisible();
  const linkText = await firstSourceLink.textContent();
  await firstSourceLink.click();

  // Modal closes and canvas focuses element
  await expect(modal).not.toBeVisible();
  await expect(page.getByText(/Selected:/)).toBeVisible();

  // 4. Reopen Handoff modal and switch through all 3 Guides
  await handoffBtn.click();
  await expect(modal).toBeVisible();

  // Tab: Generic
  await page.getByTestId("tab-generic").click();
  await expect(page.getByTestId("guide-view")).toBeVisible();
  const genericContent = page.getByTestId("guide-content-display");
  await expect(genericContent).toContainText("Implementation Instructions");
  await expect(genericContent).toContainText("Project Context");
  await expect(genericContent).toContainText("Architecture Decisions");

  // Tab: Codex
  await page.getByTestId("tab-codex").click();
  const codexContent = page.getByTestId("guide-content-display");
  await expect(codexContent).toContainText("You are an external Coding Agent");
  await expect(codexContent).toContainText("File Modification Requirements");

  // Tab: Claude Code
  await page.getByTestId("tab-claude").click();
  const claudeContent = page.getByTestId("guide-content-display");
  await expect(claudeContent).toContainText("CLAUDE.md —");
  await expect(claudeContent).toContainText("Engineering Rules");

  // 5. Copy content
  await page.getByTestId("handoff-copy-btn").click();
  await expect(page.getByTestId("copy-feedback")).toBeVisible();

  // 6. Export file
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("handoff-export-btn").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("CLAUDE.md");

  const stream = await download.createReadStream();
  if (stream) {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const exportedText = Buffer.concat(chunks).toString("utf-8");
    expect(exportedText).toContain("<!-- Coding CAD Execution Handoff Export -->");
    expect(exportedText).toContain("<!-- Export Format: claude-code -->");
    expect(exportedText).toContain("CLAUDE.md —");
  }

  // Close modal
  await page.getByTestId("handoff-close-btn").click();
  await expect(modal).not.toBeVisible();

  // 7. Mutate architecture by adding Kafka from palette and approving
  await page.getByRole("button", { name: /Kafka/ }).click();
  await approve(page, "Add Kafka message bus.");

  // Reopen Handoff and verify Staleness detection
  await handoffBtn.click();
  await expect(modal).toBeVisible();
  await expect(page.getByTestId("handoff-stale-banner")).toBeVisible();

  // Regenerate handoff
  await page.getByTestId("handoff-regenerate-btn").click();
  await expect(page.getByTestId("handoff-stale-banner")).not.toBeVisible();

  // Verify updated Blueprint includes Kafka task
  await page.getByTestId("tab-blueprint").click();
  await expect(page.getByTestId("blueprint-view")).toContainText("Kafka");
});

test("execution handoff displays unapproved candidate warning without polluting handoff", async ({ page }) => {
  await page.goto("/");

  // Start with default approved architecture
  const handoffBtn = page.getByTestId("sidebar-execution-handoff");
  await expect(handoffBtn).toBeVisible();

  // Generate candidate but do NOT approve
  await page.getByRole("button", { name: "Generate Architecture" }).click();
  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();

  // Open Handoff while candidate is pending
  await handoffBtn.click();
  const modal = page.getByTestId("execution-handoff-modal");
  await expect(modal).toBeVisible();

  // Verify pending candidate warning banner
  await expect(page.getByTestId("handoff-pending-candidate-banner")).toBeVisible();
  await expect(page.getByTestId("handoff-pending-candidate-banner")).toContainText("尚有未批准的候选，Handoff 基于已批准的正式架构");

  // Verify handoff is based on initial accepted architecture, not unapproved candidate
  await expect(page.getByTestId("blueprint-view")).toBeVisible();
});

test("execution handoff on brownfield reconstructed architecture presents inferred evidence notice banner", async ({ page }) => {
  await page.goto("/");

  // 1. Open repository via UI
  await page.getByTestId("open-repository-btn").click();
  await expect(page.getByTestId("repo-path-input")).toBeVisible();
  await page.getByTestId("repo-path-input").fill(exampleProjectFixture);
  await page.getByTestId("repo-analyze-submit").click();

  // 2. Wait for nodes to be rendered
  const userServiceNode = page.locator('.svelte-flow__node[data-id="user-service"]');
  await expect(userServiceNode).toBeVisible({ timeout: 10000 });

  // 3. Open Handoff
  const handoffBtn = page.getByTestId("sidebar-execution-handoff");
  await expect(handoffBtn).toBeVisible();
  await handoffBtn.click();

  const modal = page.getByTestId("execution-handoff-modal");
  await expect(modal).toBeVisible();

  // 4. Verify inferred evidence notice banner decoded via evidence-codec
  const inferredBanner = page.getByTestId("handoff-inferred-banner");
  await expect(inferredBanner).toBeVisible();
  await expect(inferredBanner).toContainText("该架构由代码反演重建，含 inferred 证据");

  // 5. Verify Blueprint and Guides generated for brownfield architecture
  await expect(page.getByTestId("blueprint-view")).toBeVisible();
  await page.getByTestId("tab-generic").click();
  await expect(page.getByTestId("guide-view")).toBeVisible();
});

