import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "@playwright/test";
import { layoutSource, test } from "./layout-fixture.js";
import { measureLayout } from "./layout-metrics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
const syntheticFixture = path.join(
  repoRoot,
  "packages/implementation-analyzer/fixtures/synthetic-large-repo"
);

test.describe("Brownfield Real Browser Benchmarks", () => {
  test.setTimeout(120000); // 120s timeout for large synthetic benchmark

  test("measures real browser metrics for Coding-CAD (this repo)", async ({ page }, testInfo) => {
    const layoutMode = testInfo.config.metadata.layoutMode ?? "dev";
    await page.goto("/");

    await page.getByTestId("open-repository-btn").click();
    await expect(page.getByTestId("repo-path-input")).toBeVisible();
    await page.getByTestId("repo-path-input").fill(repoRoot);

    const clientStart = performance.now();
    let serverDurationMs = 0;

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/workspace/analyze-repository") && resp.status() === 200
    );

    const requestStart = performance.now();
    await page.getByTestId("repo-analyze-submit").click();

    const response = await responsePromise;
    serverDurationMs = performance.now() - requestStart;

    // Wait for architecture-ir component node to be visible on canvas
    const irNode = page.locator('.svelte-flow__node[data-id="architecture-ir"]');
    await expect(irNode).toBeVisible({ timeout: 30000 });

    const canvasContainer = page.locator('div[role="application"][aria-label="Architecture Canvas"]');
    await expect(canvasContainer).toHaveAttribute("data-layout-status", "success");
    const firstScreenRenderMs = performance.now() - clientStart;

    // Solver source assertion
    await expect(canvasContainer).toHaveAttribute("data-layout-solver", "elk");

    // Retrieve observed layout
    const observed = await page.evaluate(() => window.__p3ObservedLayouts ?? []);
    expect(observed.length).toBeGreaterThan(0);
    const lastObservation = observed.at(-1)!;
    expect(lastObservation.result.status).toBe("success");
    const solver = layoutSource(lastObservation.result);
    expect(solver).toBe("elk");

    // Measure layout quality metrics
    const quality = measureLayout(lastObservation.graph, lastObservation.result);

    // Count visible nodes
    const allNodes = page.locator(".svelte-flow__node");
    const totalNodeCount = await allNodes.count();
    const visibleNodes = await page.locator('.svelte-flow__node:not([style*="display: none"])').count();

    // Toggle collapse all groups
    const collapseToggles = page.getByTestId("group-toggle-collapse");
    const toggleCount = await collapseToggles.count();
    for (let i = 0; i < toggleCount; i++) {
      await collapseToggles.nth(i).dispatchEvent("click");
    }

    const visibleAfterCollapse = await page.locator('.svelte-flow__node:not([style*="display: none"])').count();
    const hiddenCount = visibleNodes - visibleAfterCollapse;

    const resultMetric = {
      fixture: "Coding-CAD (this repository)",
      mode: layoutMode,
      serverDurationMs,
      firstScreenRenderMs,
      totalNodeCount,
      visibleNodeCount: visibleNodes,
      hiddenCountAfterCollapse: hiddenCount,
      solverSource: solver,
      peerOverlaps: quality.peerOverlaps,
      containmentFailures: quality.containmentFailures.length,
      routedCrossings: quality.routedCrossings,
      routedEdges: quality.routedEdges,
      totalEdges: quality.edges
    };

    console.log(`[Browser Benchmark - Coding-CAD (${layoutMode})]`, JSON.stringify(resultMetric, null, 2));

    const outPath = path.join(
      repoRoot,
      `logs/validation/p4-browser/benchmark-coding-cad-${layoutMode}.json`
    );
    fs.writeFileSync(outPath, JSON.stringify(resultMetric, null, 2));
  });

  test("measures real browser metrics for synthetic-large-repo (120 modules)", async ({ page }, testInfo) => {
    const layoutMode = testInfo.config.metadata.layoutMode ?? "dev";
    await page.goto("/");

    await page.getByTestId("open-repository-btn").click();
    await expect(page.getByTestId("repo-path-input")).toBeVisible();
    await page.getByTestId("repo-path-input").fill(syntheticFixture);

    const clientStart = performance.now();
    let serverDurationMs = 0;

    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/workspace/analyze-repository") && resp.status() === 200
    );

    const requestStart = performance.now();
    await page.getByTestId("repo-analyze-submit").click();

    const response = await responsePromise;
    serverDurationMs = performance.now() - requestStart;

    // Wait for pkg-00-alpha-service component node to be visible on canvas
    const alphaNode = page.locator('.svelte-flow__node[data-id="pkg-00-alpha-service"]');
    await expect(alphaNode).toBeVisible({ timeout: 60000 });

    const canvasContainer = page.locator('div[role="application"][aria-label="Architecture Canvas"]');
    await expect(canvasContainer).toHaveAttribute("data-layout-status", "success");
    const firstScreenRenderMs = performance.now() - clientStart;

    // Solver source assertion
    await expect(canvasContainer).toHaveAttribute("data-layout-solver", "elk");

    // Retrieve observed layout
    const observed = await page.evaluate(() => window.__p3ObservedLayouts ?? []);
    expect(observed.length).toBeGreaterThan(0);
    const lastObservation = observed.at(-1)!;
    expect(lastObservation.result.status).toBe("success");
    const solver = layoutSource(lastObservation.result);
    expect(solver).toBe("elk");

    // Measure layout quality metrics
    const quality = measureLayout(lastObservation.graph, lastObservation.result);

    // Count visible nodes
    const allNodes = page.locator(".svelte-flow__node");
    const totalNodeCount = await allNodes.count();
    const visibleNodes = await page.locator('.svelte-flow__node:not([style*="display: none"])').count();

    // Toggle collapse all groups
    const collapseToggles = page.getByTestId("group-toggle-collapse");
    const toggleCount = await collapseToggles.count();
    for (let i = 0; i < toggleCount; i++) {
      await collapseToggles.nth(i).dispatchEvent("click");
    }

    const visibleAfterCollapse = await page.locator('.svelte-flow__node:not([style*="display: none"])').count();
    const hiddenCount = visibleNodes - visibleAfterCollapse;

    const resultMetric = {
      fixture: "synthetic-large-repo (120 modules)",
      mode: layoutMode,
      serverDurationMs,
      firstScreenRenderMs,
      totalNodeCount,
      visibleNodeCount: visibleNodes,
      hiddenCountAfterCollapse: hiddenCount,
      solverSource: solver,
      peerOverlaps: quality.peerOverlaps,
      containmentFailures: quality.containmentFailures.length,
      routedCrossings: quality.routedCrossings,
      routedEdges: quality.routedEdges,
      totalEdges: quality.edges
    };

    console.log(`[Browser Benchmark - Synthetic (${layoutMode})]`, JSON.stringify(resultMetric, null, 2));

    const outPath = path.join(
      repoRoot,
      `logs/validation/p4-browser/benchmark-synthetic-${layoutMode}.json`
    );
    fs.writeFileSync(outPath, JSON.stringify(resultMetric, null, 2));
  });
});
