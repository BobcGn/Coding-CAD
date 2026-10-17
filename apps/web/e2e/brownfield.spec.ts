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
});
