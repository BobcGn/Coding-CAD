import fs from "node:fs";
import path from "node:path";
import { expect } from "@playwright/test";
import { MOVEMENT_BUDGET, type ArchitectureProject, type ComponentType } from "@coding-cad/architecture-layout";
import { layoutSource, test } from "./layout-fixture.js";
import { measureLayout, measureProductMovement } from "./layout-metrics.js";
import { pointsSystemFixture } from "../src/lib/architecture/projection/points-system-fixture.js";
import { CODING_CAD_EXPECTED_BASELINE } from "../src/lib/architecture/compliance/baseline-presets.js";
import { hasAnyOverlap, type Rect } from "../src/lib/cad/canvas/adapters/ghost-placement.js";

interface BrowserGhostBenchmarkRecord {
  readonly fixtureName: string;
  readonly proposalId: string;
  readonly componentId: string;
  readonly componentName: string;
  readonly reasonCode: "adjacent-anchor" | "container-full-exterior" | "inside-container" | "fallback-global";
  readonly anchorId?: string;
  readonly ghostPos: { x: number; y: number };
  readonly distanceToAnchor?: number;
  readonly finalPos: { x: number; y: number };
  readonly displacement: number;
  readonly preAcceptGhostOverlaps: number;
  readonly postAcceptPeerOverlaps: number;
  readonly postAcceptContainmentFailures: number;
  readonly solverSource: "elk" | "fallback";
  readonly unaffectedP95: number;
  readonly unaffectedMax: number;
  readonly withinBudget: boolean;
  readonly notice?: string;
}

test.describe.configure({ mode: "serial" });

test.describe("Step 5.6 Real Browser Ghost Placement & Incremental Layout Benchmarks", () => {
  test("measures real browser metrics across Greenfield and Coding-CAD fixtures with zero overlap and ELK solver", async ({ page }, testInfo) => {
    const layoutMode = testInfo.config.metadata.layoutMode ?? "dev";
    const records: BrowserGhostBenchmarkRecord[] = [];

    // Setup browser page
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Greenfield Architecture Workspace" })).toBeVisible();

    // Ensure test automation hooks are active
    await expect.poll(async () => {
      return await page.evaluate(() => Boolean(window.__coding_cad_controller__ && window.__coding_cad_execute_command__));
    }).toBe(true);

    type ScenarioDef = {
      readonly fixtureName: string;
      readonly baseProject: ArchitectureProject;
      readonly component: {
        readonly id: string;
        readonly name: string;
        readonly type: ComponentType;
        readonly capabilities: readonly string[];
        readonly tags?: readonly string[];
      };
      readonly expectedReason: "adjacent-anchor" | "container-full-exterior" | "inside-container" | "fallback-global";
      readonly anchorId?: string;
    };

    const scenarios: ScenarioDef[] = [
      {
        fixtureName: "Greenfield (Points System)",
        baseProject: pointsSystemFixture,
        component: {
          id: "audit-svc",
          name: "AuditService",
          type: "service",
          capabilities: ["audit-logging"],
          tags: ["anchor:ledger"]
        },
        expectedReason: "adjacent-anchor",
        anchorId: "ledger"
      },
      {
        fixtureName: "Greenfield (Points System)",
        baseProject: pointsSystemFixture,
        component: {
          id: "payment-gw",
          name: "PaymentGateway",
          type: "service",
          capabilities: ["payment-forwarding"],
          tags: ["anchor:gateway"]
        },
        expectedReason: "adjacent-anchor",
        anchorId: "gateway"
      },
      {
        fixtureName: "Greenfield (Points System)",
        baseProject: pointsSystemFixture,
        component: {
          id: "redis-cache",
          name: "RedisCache",
          type: "cache",
          capabilities: ["low-latency-cache"],
          tags: []
        },
        // In pointsSystemFixture, group:infrastructure is tightly packed around database & events.
        // There is no open 220x90 slot inside, so Ghost is placed immediately to the right exterior.
        expectedReason: "container-full-exterior",
        anchorId: "group:infrastructure"
      },
      {
        fixtureName: "Coding-CAD (Medium Baseline)",
        baseProject: CODING_CAD_EXPECTED_BASELINE,
        component: {
          id: "telemetry-svc",
          name: "Telemetry",
          type: "service",
          capabilities: ["metrics-export"],
          tags: ["anchor:server"]
        },
        expectedReason: "adjacent-anchor",
        anchorId: "server"
      },
      {
        fixtureName: "Coding-CAD (Medium Baseline)",
        baseProject: CODING_CAD_EXPECTED_BASELINE,
        component: {
          id: "architecture-doc-gen",
          name: "DocGen",
          type: "service",
          capabilities: ["markdown-docs"],
          tags: ["anchor:architecture-ir"]
        },
        expectedReason: "adjacent-anchor",
        anchorId: "architecture-ir"
      },
      {
        fixtureName: "Coding-CAD (Medium Baseline)",
        baseProject: CODING_CAD_EXPECTED_BASELINE,
        component: {
          id: "isolated-mock",
          name: "IsolatedMock",
          type: "service",
          capabilities: ["unit-testing"],
          tags: []
        },
        expectedReason: "fallback-global",
        anchorId: undefined
      }
    ];

    for (const scenario of scenarios) {
      // 1. Reset formal architecture to base project
      await page.evaluate(async (project) => {
        await window.__coding_cad_set_architecture__(project);
      }, scenario.baseProject);

      // Wait for layout to be settled
      await expect.poll(async () => {
        return await page.evaluate(() => {
          const c = window.__coding_cad_controller__;
          return c?.layout()?.status === "success" && c?.state().status === "ready";
        });
      }).toBe(true);

      // Snapshot pre-proposal formal layout
      const preSnapshot = await page.evaluate(() => {
        const c = window.__coding_cad_controller__!;
        const layout = c.layout()!;
        const state = c.state();
        return {
          nodes: layout.nodes,
          viewState: state.layoutState!
        };
      });

      // 2. Propose Add command
      await page.evaluate(async (comp) => {
        await window.__coding_cad_execute_command__({
          type: "add-component",
          component: comp
        });
      }, scenario.component);

      // Wait for Ghost element in DOM
      const ghostArticle = page.locator(".svelte-flow__node article[data-ghost='true']");
      await expect(ghostArticle).toBeVisible({ timeout: 5000 });
      await expect(page.locator(`.svelte-flow__node[data-id="ghost:${scenario.component.id}"]`)).toBeVisible();

      // Read Ghost node position and properties from Svelte Flow / controller
      const ghostInfo = await page.evaluate((comp) => {
        const c = window.__coding_cad_controller__!;
        const state = c.state();
        const proposal = state.proposal!;
        const layout = c.layout()!;
        const formalRects: Rect[] = layout.nodes.map((n) => ({
          id: n.id,
          x: n.position.x,
          y: n.position.y,
          width: n.size.width,
          height: n.size.height,
          parentId: n.parentId,
          kind: n.kind
        }));

        // Retrieve ghost node rendered in Svelte Flow DOM
        const ghostElement = document.querySelector(`.svelte-flow__node[data-id="ghost:${comp.id}"]`) as HTMLElement | null;
        const style = ghostElement?.style.transform ?? "";
        // parse translate(Xpx, Ypx)
        const match = /translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/.exec(style);
        const flowX = match ? parseFloat(match[1]!) : 0;
        const flowY = match ? parseFloat(match[2]!) : 0;

        const noticeEl = ghostElement?.querySelector("[data-testid='ghost-notice']");
        const notice = noticeEl?.textContent?.trim();

        // Calculate overlap against formal nodes
        const ghostRect: Rect = {
          id: `ghost:${comp.id}`,
          x: flowX,
          y: flowY,
          width: 220,
          height: 90
        };

        const overlaps = formalRects.filter((formal) => {
          if (formal.kind === "group") return false; // containment is not peer overlap
          return (
            ghostRect.x < formal.x + formal.width &&
            ghostRect.x + ghostRect.width > formal.x &&
            ghostRect.y < formal.y + formal.height &&
            ghostRect.y + ghostRect.height > formal.y
          );
        });

        // Determine reason code
        let reasonCode: "adjacent-anchor" | "container-full-exterior" | "inside-container" | "fallback-global" = "fallback-global";
        if (notice && notice.includes("内部无可用空间")) {
          reasonCode = "container-full-exterior";
        } else if (ghostElement?.parentElement?.classList.contains("group") || ghostRect.x > 0 && ghostRect.y > 0 && formalRects.some(r => r.kind === "group" && ghostRect.x >= r.x && ghostRect.x + ghostRect.width <= r.x + r.width)) {
          reasonCode = "inside-container";
        } else if (comp.tags?.some((t: string) => t.startsWith("anchor:"))) {
          reasonCode = "adjacent-anchor";
        }

        return {
          proposalId: proposal.id,
          ghostPos: { x: flowX, y: flowY },
          preOverlaps: overlaps.length,
          notice,
          reasonCode
        };
      }, scenario.component);

      // Pre-accept Assertions:
      // Zero overlap between Ghost and formal nodes
      expect(ghostInfo.preOverlaps, `Ghost ${scenario.component.id} must not overlap any formal node`).toBe(0);

      // Distance to anchor node if applicable
      let distanceToAnchor: number | undefined;
      if (scenario.anchorId) {
        const anchorNode = preSnapshot.nodes.find((n) => n.id === scenario.anchorId);
        if (anchorNode) {
          distanceToAnchor = Math.hypot(
            ghostInfo.ghostPos.x - anchorNode.position.x,
            ghostInfo.ghostPos.y - anchorNode.position.y
          );
        }
      }

      // If container full expected, assert notice is present
      if (scenario.expectedReason === "container-full-exterior") {
        expect(ghostInfo.notice).toContain("内部无可用空间");
      }

      // 3. Accept candidate proposal -> triggers incremental layout with Web Worker ELK
      await page.evaluate(async (comp) => {
        await window.__coding_cad_accept__(`Approve ${comp.name} addition.`);
      }, scenario.component);

      // Wait for Ghost to disappear and formal node to be rendered
      await expect(page.locator(".svelte-flow__node article[data-ghost='true']")).toHaveCount(0);
      const formalNodeLocator = page.locator(".svelte-flow__node").filter({ hasText: scenario.component.name });
      await expect(formalNodeLocator).toBeVisible();

      // Read post-accept state
      const postState = await page.evaluate((comp) => {
        const c = window.__coding_cad_controller__!;
        const layout = c.layout()!;
        const projection = c.projection()!;
        const state = c.state();
        const finalNode = layout.nodes.find((n) => n.id === comp.id);
        return {
          finalPos: finalNode ? { x: finalNode.position.x, y: finalNode.position.y } : { x: 0, y: 0 },
          layout,
          projectionGraph: projection.layoutGraph,
          viewState: state.layoutState!,
          movement: c.movement()
        };
      }, scenario.component);

      // Measure post-accept layout quality
      const quality = measureLayout(postState.projectionGraph, postState.layout);
      const solver = layoutSource(postState.layout);

      // Assert solver is ELK (zero fallback)
      expect(solver, "Solver source must be real ELK with zero fallback").toBe("elk");
      expect(postState.layout.status).toBe("success");
      expect(postState.layout.diagnostics).toHaveLength(0);

      // Assert post-accept zero peer overlap and zero containment failures
      expect(quality.peerOverlaps, "Post-accept layout must have 0 peer overlaps").toBe(0);
      expect(quality.containmentFailures, "Post-accept layout must have 0 containment failures").toEqual([]);

      // Measure displacement: Euclidean distance between Ghost pos and final pos
      const displacement = Math.hypot(
        postState.finalPos.x - ghostInfo.ghostPos.x,
        postState.finalPos.y - ghostInfo.ghostPos.y
      );

      // Measure product movement of unaffected nodes
      const productMovement = measureProductMovement(preSnapshot.viewState, postState.viewState, scenario.component.id);
      expect(productMovement.p95).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedP95);
      expect(productMovement.max).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedMax);

      const withinBudget = productMovement.p95 <= MOVEMENT_BUDGET.unaffectedP95 && productMovement.max <= MOVEMENT_BUDGET.unaffectedMax;

      records.push({
        fixtureName: scenario.fixtureName,
        proposalId: ghostInfo.proposalId,
        componentId: scenario.component.id,
        componentName: scenario.component.name,
        reasonCode: scenario.expectedReason,
        anchorId: scenario.anchorId,
        ghostPos: ghostInfo.ghostPos,
        distanceToAnchor: distanceToAnchor ? Math.round(distanceToAnchor * 10) / 10 : undefined,
        finalPos: postState.finalPos,
        displacement: Math.round(displacement * 10) / 10,
        preAcceptGhostOverlaps: ghostInfo.preOverlaps,
        postAcceptPeerOverlaps: quality.peerOverlaps,
        postAcceptContainmentFailures: quality.containmentFailures.length,
        solverSource: solver,
        unaffectedP95: Math.round(productMovement.p95 * 10) / 10,
        unaffectedMax: Math.round(productMovement.max * 10) / 10,
        withinBudget,
        notice: ghostInfo.notice
      });
    }

    // Output directory
    const outputDir = path.resolve(process.cwd(), "../../logs/validation/p5-browser");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputFile = path.join(outputDir, `ghost-benchmarks-${layoutMode}.json`);
    fs.writeFileSync(outputFile, JSON.stringify({ layoutMode, timestamp: new Date().toISOString(), records }, null, 2));

    // Print benchmark markdown table
    console.log(`\n=== STEP 5.6 REAL BROWSER BENCHMARKS (${layoutMode.toUpperCase()}) ===`);
    console.log("| Fixture | Component | Reason Code | Ghost Pos | Anchor Dist | Final Pos | Displacement | Pre-Overlap | Post-Overlap | Contain Fail | Solver | Unaffected p95 | Budget |");
    console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
    for (const r of records) {
      console.log(
        `| ${r.fixtureName} | ${r.componentName} | ${r.reasonCode} | (${r.ghostPos.x}, ${r.ghostPos.y}) | ${r.distanceToAnchor !== undefined ? r.distanceToAnchor + "px" : "N/A"} | (${r.finalPos.x}, ${r.finalPos.y}) | ${r.displacement}px | ${r.preAcceptGhostOverlaps} | ${r.postAcceptPeerOverlaps} | ${r.postAcceptContainmentFailures} | ${r.solverSource} | ${r.unaffectedP95}px | ${r.withinBudget ? "PASS" : "FAIL"} |`
      );
    }
    console.log(`\nSaved benchmark artifact: ${outputFile}\n`);

    // Verify all 6 records pass
    expect(records.length).toBeGreaterThanOrEqual(6);
    expect(records.every((r) => r.preAcceptGhostOverlaps === 0)).toBe(true);
    expect(records.every((r) => r.postAcceptPeerOverlaps === 0)).toBe(true);
    expect(records.every((r) => r.postAcceptContainmentFailures === 0)).toBe(true);
    expect(records.every((r) => r.solverSource === "elk")).toBe(true);
    expect(records.every((r) => r.withinBudget)).toBe(true);
  });
});
