import { expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { MOVEMENT_BUDGET, type LayoutResult } from "@coding-cad/architecture-layout";
import { test } from "./layout-fixture.js";
import { measureLayout, measureProductMovement } from "./layout-metrics.js";
import type {} from "../src/lib/layout/testing/layout-acceptance.js";

test.use({ viewport: { width: 1680, height: 1000 } });
const output = path.resolve(process.cwd(), "../../logs/validation/p3-closeout/elk-browser");

for (const name of ["workspace-default", "points-system"] as const) {
  test("browser quality and determinism: " + name, async ({ page }, info) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Generate Architecture" }).click();
    await expect(page.getByRole("heading", { name: "Problems" })).toBeVisible();
    await expect.poll(() => page.evaluate(() => Boolean(window.__p3LayoutAcceptance))).toBe(true);
    const evidence = await page.evaluate((fixture) => window.__p3LayoutAcceptance!.runFixture(fixture), name);
    expect(evidence.inputImmutable).toBe(true);
    expect(evidence.first.result.status).toBe("success");
    expect(evidence.repeated.result).toEqual(evidence.first.result);
    expect(evidence.incremental.appliedMode).toBe("INCREMENTAL");
    expect(evidence.incremental.movement?.withinBudget).toBe(true);
    expect(evidence.incremental.movement!.unaffectedP95).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedP95);
    expect(evidence.incremental.movement!.unaffectedMax).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedMax);
    expect(evidence.incremental.movement!.relativeOrderReversed).toBe(false);
    const full = measureLayout(evidence.first.projection.layoutGraph, evidence.first.result);
    const incremental = measureLayout(evidence.incremental.projection.layoutGraph, evidence.incremental.result);
    expect(full.peerOverlaps).toBe(0);
    expect(full.containmentFailures).toEqual([]);
    expect(incremental.peerOverlaps).toBe(0);
    expect(incremental.containmentFailures).toEqual([]);

    // Exercise the real product command/Review path as well as the fixture pipeline.
    await page.getByLabel("Review rationale").fill("Approve quality fixture.");
    await page.getByRole("button", { name: "Accept", exact: true }).click();
    await expect(page.getByText("Candidate accepted.", { exact: true })).toBeVisible();
    const before = await page.evaluate(() => window.__p3LayoutAcceptance!.snapshot());
    const editedId = "point-service";
    await page.locator(".svelte-flow__node").filter({ hasText: "PointService" }).click();
    await page.locator(".inspector textarea").fill("Reviewed browser quality edit.");
    await page.getByRole("button", { name: "Save Description" }).click();
    await page.getByLabel("Review rationale").fill("Approve semantic edit.");
    await page.getByRole("button", { name: "Accept", exact: true }).click();
    await expect(page.getByText("Candidate accepted.", { exact: true })).toBeVisible();
    const after = await page.evaluate(() => window.__p3LayoutAcceptance!.snapshot());
    const productMovement = measureProductMovement(before.viewState!, after.viewState!, editedId);
    expect(productMovement.p95).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedP95);
    expect(productMovement.max).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedMax);
    expect(productMovement.orderReversals).toBe(0);
    expect(after.project.architecture.components.find((node) => node.id === editedId)?.description).toBe("Reviewed browser quality edit.");

    const rendered = await page.locator(".svelte-flow__node").evaluateAll((elements, metadata) =>
      elements.map((element) => {
        const node = metadata.find((entry) => entry.id === element.getAttribute("data-id"))!;
        const rect = (element.querySelector("article") ?? element).getBoundingClientRect();
        return { ...node, position: { x: rect.left, y: rect.top }, size: { width: rect.width, height: rect.height } };
      }), after.layout!.nodes);
    const renderedQuality = measureLayout(after.projection!.layoutGraph, { ...after.layout!, nodes: rendered } as LayoutResult);
    expect(renderedQuality.peerOverlaps).toBe(0);
    expect(renderedQuality.containmentFailures).toEqual([]);
    // Phase 3 also requires palette addition to preserve unrelated component positions.
    const beforeAdd = after;
    await page.getByRole("button", { name: /Kafka message-broker/ }).click();
    await page.getByLabel("Review rationale").fill("Approve palette addition.");
    await page.getByRole("button", { name: "Accept", exact: true }).click();
    await expect(page.getByText("Candidate accepted.", { exact: true })).toBeVisible();
    const afterAdd = await page.evaluate(() => window.__p3LayoutAcceptance!.snapshot());
    const additionQuality = measureLayout(afterAdd.projection!.layoutGraph, afterAdd.layout!);
    // Group containers affected by membership changes are excluded from component movement.
    const componentIds = new Set(beforeAdd.project.architecture.components.map((node) => node.id));
    const componentState = (state: NonNullable<typeof beforeAdd.viewState>) => ({
      ...state, nodes: state.nodes.filter((node) => componentIds.has(node.id))
    });
    const additionMovement = measureProductMovement(componentState(beforeAdd.viewState!), componentState(afterAdd.viewState!), "kafka");
    expect(additionMovement.p95).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedP95);
    expect(additionMovement.max).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedMax);
    expect(additionMovement.orderReversals).toBe(0);
    expect(additionQuality.peerOverlaps).toBe(0);
    expect(additionQuality.containmentFailures).toEqual([]);
    mkdirSync(output, { recursive: true });
    const mode = String(info.config.metadata.layoutMode);
    writeFileSync(path.join(output, "quality-" + mode + "-" + name + ".json"), JSON.stringify({
      full, incremental, productMovement, additionMovement, additionQuality, renderedQuality, determinism: true,
      movement: evidence.incremental.movement, durationMs: evidence.first.durationMs, raw: evidence
    }, null, 2) + "\n");
    await page.screenshot({ path: path.join(output, "quality-" + mode + "-" + name + ".png"), fullPage: true });
  });
}
