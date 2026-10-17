import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "@playwright/test";
import { layoutSource, test } from "./layout-fixture.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const smallMonoFixture = path.join(
  repoRoot,
  "packages/implementation-analyzer/fixtures/small-monorepo"
);

test.describe("Brownfield Architecture Pipeline E2E", () => {
  test("analyzes repository, renders ELK layout, inspects evidence, and toggles group collapse", async ({ page }) => {
    await page.goto("/");

    // 1. Open Repository via UI
    await page.getByTestId("open-repository-btn").click();
    await expect(page.getByTestId("repo-path-input")).toBeVisible();

    await page.getByTestId("repo-path-input").fill(smallMonoFixture);
    await page.getByTestId("repo-analyze-submit").click();

    // 2. Wait for architecture nodes and edges to be laid out
    const authNode = page.locator('.svelte-flow__node[data-id="auth-service"]');
    await expect(authNode).toBeVisible({ timeout: 10000 });

    const billingNode = page.locator('.svelte-flow__node[data-id="billing-service"]');
    await expect(billingNode).toBeVisible();

    const gatewayNode = page.locator('.svelte-flow__node[data-id="gateway-service"]');
    await expect(gatewayNode).toBeVisible();

    // Ensure edges are routed
    const edges = page.locator(".svelte-flow__edge");
    await expect(edges.first()).toBeVisible();

    // Assert solver source on canvas container
    const canvasContainer = page.locator('div[role="application"][aria-label="Architecture Canvas"]');
    await expect(canvasContainer).toHaveAttribute("data-layout-solver", "elk");
    await expect(canvasContainer).toHaveAttribute("data-layout-status", "success");

    // 3. Click auth-service and inspect evidence in Inspector
    await authNode.click();
    const evidencePanel = page.getByTestId("evidence-panel");
    await expect(evidencePanel).toBeVisible();

    await expect(page.getByTestId("evidence-source")).toHaveText("declared");
    await expect(page.getByTestId("evidence-confidence")).toContainText("1.00");
    await expect(page.getByTestId("evidence-path")).toContainText("packages/auth");

    // 4. Test group collapse and hidden count display
    const authGroup = page.locator('.svelte-flow__node[data-id="group:module:auth"]');
    await expect(authGroup).toBeVisible();

    const toggleBtn = authGroup.getByTestId("group-toggle-collapse");
    await expect(toggleBtn).toBeVisible();
    await expect(authGroup.getByTestId("group-hidden-count")).toHaveText("(1)");

    // Collapse group
    await toggleBtn.dispatchEvent("click");
    await expect(authGroup.getByTestId("group-hidden-count")).toHaveText("(1 hidden)");
    await expect(authNode).toBeHidden();

    // Expand group again
    await toggleBtn.dispatchEvent("click");
    await expect(authGroup.getByTestId("group-hidden-count")).toHaveText("(1)");
    await expect(authNode).toBeVisible();

    // 5. Verify ELK solver telemetry from layout-fixture guard
    const observed = await page.evaluate(() => window.__p3ObservedLayouts ?? []);
    expect(observed.length).toBeGreaterThan(0);
    const lastLayout = observed.at(-1)!;
    expect(lastLayout.result.status).toBe("success");
    expect(layoutSource(lastLayout.result)).toBe("elk");
  });

  test("verifies compliance checking unavailable banner, loads drifted baseline, asserts badges, tests bidirectional navigation and group auto-expansion, and verifies golden baseline pass", async ({ page }) => {
    await page.goto("/");

    // 1. Analyze Coding-CAD repo
    await page.getByTestId("open-repository-btn").click();
    await expect(page.getByTestId("repo-path-input")).toBeVisible();

    await page.getByTestId("repo-path-input").fill(repoRoot);
    await page.getByTestId("repo-analyze-submit").click();

    // Wait for nodes on canvas
    const serverNode = page.locator('.svelte-flow__node[data-id="server"]');
    await expect(serverNode).toBeVisible({ timeout: 15000 });

    // 2. Assert unavailable state banner before loading expected architecture
    const unavailableBanner = page.getByTestId("compliance-unavailable-banner");
    await expect(unavailableBanner).toBeVisible();
    await expect(unavailableBanner).toContainText(/未加载期望架构|Compliance check unavailable/);

    // 3. Click Load Expected Baseline button from banner
    await page.getByTestId("load-expected-btn").click();
    await expect(page.getByTestId("load-expected-modal")).toBeVisible();

    // Load Drifted baseline
    await page.getByTestId("load-preset-drifted").click();
    await expect(page.getByTestId("load-expected-modal")).toBeHidden();

    // 4. Verify compliance report header and issues list
    await expect(page.getByTestId("compliance-header")).toBeVisible();
    await expect(page.getByTestId("compliance-issues-list")).toBeVisible();

    const issueItems = page.getByTestId("compliance-issue-item");
    expect(await issueItems.count()).toBeGreaterThanOrEqual(4);

    // 5. Assert badges: severity, cannot-verify, pending-confirmation
    await expect(page.locator(".badge.severity.error").first()).toBeVisible();
    await expect(page.locator(".badge.severity.warning").first()).toBeVisible();
    await expect(page.getByTestId("badge-cannot-verify").first()).toBeVisible();
    await expect(page.getByTestId("badge-pending-confirmation").first()).toBeVisible();

    // 6. Test Group Auto-Expansion via Problem Target Click
    const serverGroup = page.locator('.svelte-flow__node[data-id="group:module:server"]');
    await expect(serverGroup).toBeVisible();
    const toggleBtn = serverGroup.getByTestId("group-toggle-collapse");

    // Collapse server group -> server node becomes hidden
    await toggleBtn.dispatchEvent("click");
    await expect(serverNode).toBeHidden();

    // Click problem target link for server
    const serverIssueLink = page.locator('button[data-testid="issue-target-link"]:has-text("server")').first();
    await expect(serverIssueLink).toBeVisible();
    await serverIssueLink.click();

    // Group should automatically expand and server node is revealed
    await expect(serverNode).toBeVisible();

    // 7. Test Bidirectional Navigation: click node on canvas -> inspector displays associated compliance issue
    const cliNode = page.locator('.svelte-flow__node[data-id="cli"]');
    await cliNode.click();

    const inspectorCompliance = page.getByTestId("inspector-compliance-section");
    await expect(inspectorCompliance).toBeVisible();
    await expect(inspectorCompliance).toContainText("component-registry");

    // 8. Load Golden Baseline and verify clean pass (0 deviations)
    await page.getByTestId("sidebar-load-expected").click();
    await expect(page.getByTestId("load-expected-modal")).toBeVisible();
    await page.getByTestId("load-preset-golden").click();
    await expect(page.getByTestId("load-expected-modal")).toBeHidden();

    await expect(page.getByTestId("compliance-passed")).toBeVisible();
    await expect(page.getByTestId("compliance-passed")).toContainText("0");

    // 9. Verify ELK layout telemetry
    const observed = await page.evaluate(() => window.__p3ObservedLayouts ?? []);
    expect(observed.length).toBeGreaterThan(0);
    const lastLayout = observed.at(-1)!;
    expect(lastLayout.result.status).toBe("success");
    expect(layoutSource(lastLayout.result)).toBe("elk");
  });
});
