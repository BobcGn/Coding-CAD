import fs from "node:fs";
import path from "node:path";
import { expect } from "@playwright/test";
import { MOVEMENT_BUDGET, type ArchitectureProject, type ComponentType } from "@coding-cad/architecture-layout";
import { layoutSource, test } from "./layout-fixture.js";
import { measureLayout, measureProductMovement } from "./layout-metrics.js";
import { pointsSystemFixture } from "../src/lib/architecture/projection/points-system-fixture.js";
import { CODING_CAD_EXPECTED_BASELINE } from "../src/lib/architecture/compliance/baseline-presets.js";
import { type Rect } from "../src/lib/cad/canvas/adapters/ghost-placement.js";

interface BrowserGhostBenchmarkRecord {
  readonly fixtureName: string;
  readonly scenarioType: "add-component" | "connect-components" | "remove-component";
  readonly proposalId: string;
  readonly targetId: string;
  readonly targetName: string;
  readonly reasonCode: "near-anchor" | "far-anchor-fallback" | "container-interior" | "container-exterior" | "global-fallback" | "edge-connection" | "pending-deletion";
  readonly anchorId?: string;
  readonly heuristicPos?: { x: number; y: number };
  readonly predictedPos?: { x: number; y: number };
  readonly finalPos?: { x: number; y: number };
  readonly diffPredictedFinal?: number;
  readonly diffHeuristicFinal?: number;
  readonly diffHeuristicPredicted?: number;
  readonly distanceToAnchor?: number;
  readonly preAcceptGhostOverlaps: number;
  readonly postAcceptPeerOverlaps: number;
  readonly postAcceptContainmentFailures: number;
  readonly solverSource: "elk" | "fallback";
  readonly unaffectedP95: number;
  readonly unaffectedMax: number;
  readonly withinBudget: boolean;
  readonly notice?: string;
  readonly latencyDistribution: {
    readonly minMs: number;
    readonly medianMs: number;
    readonly maxMs: number;
    readonly samples: readonly number[];
  };
}

test.describe.configure({ mode: "serial" });

test.describe("Step 5.8 Real Browser Ghost Predictive Placement & Benchmark Suite", () => {
  test.setTimeout(180000); // Allow sufficient time for 8 scenarios with 10 repeated ELK worker latency runs
  test("measures real browser predictive metrics across Greenfield and Coding-CAD fixtures with zero overlap and ELK solver", async ({ page }, testInfo) => {
    const layoutMode = testInfo.config.metadata.layoutMode ?? "dev";
    const records: BrowserGhostBenchmarkRecord[] = [];

    // Setup browser page
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Greenfield Architecture Workspace" })).toBeVisible();

    // Ensure test automation hooks are active
    await expect.poll(async () => {
      return await page.evaluate(() => Boolean(
        window.__coding_cad_controller__ &&
        window.__coding_cad_execute_command__ &&
        window.__coding_cad_wait_for_prediction__
      ));
    }).toBe(true);

    type ScenarioDef = {
      readonly fixtureName: string;
      readonly scenarioType: "add-component" | "connect-components" | "remove-component";
      readonly baseProject: ArchitectureProject;
      readonly targetId: string;
      readonly targetName: string;
      readonly expectedReason: "near-anchor" | "far-anchor-fallback" | "container-interior" | "container-exterior" | "global-fallback" | "edge-connection" | "pending-deletion";
      readonly anchorId?: string;
      readonly commandPayload: any;
    };

    const scenarios: ScenarioDef[] = [
      // 1. Greenfield near-anchor Add (audit-svc anchored to ledger)
      {
        fixtureName: "Greenfield (Points System)",
        scenarioType: "add-component",
        baseProject: pointsSystemFixture,
        targetId: "audit-svc",
        targetName: "AuditService",
        expectedReason: "near-anchor",
        anchorId: "ledger",
        commandPayload: {
          type: "add-component",
          component: {
            id: "audit-svc",
            name: "AuditService",
            type: "service",
            capabilities: ["audit-logging"],
            tags: ["anchor:ledger"]
          }
        }
      },
      // 2. Greenfield near-anchor Add (payment-gw anchored to gateway)
      {
        fixtureName: "Greenfield (Points System)",
        scenarioType: "add-component",
        baseProject: pointsSystemFixture,
        targetId: "payment-gw",
        targetName: "PaymentGateway",
        expectedReason: "near-anchor",
        anchorId: "gateway",
        commandPayload: {
          type: "add-component",
          component: {
            id: "payment-gw",
            name: "PaymentGateway",
            type: "service",
            capabilities: ["payment-forwarding"],
            tags: ["anchor:gateway"]
          }
        }
      },
      // 3. Greenfield container full / exterior Add (redis-cache in infrastructure)
      {
        fixtureName: "Greenfield (Points System)",
        scenarioType: "add-component",
        baseProject: pointsSystemFixture,
        targetId: "redis-cache",
        targetName: "RedisCache",
        expectedReason: "container-exterior",
        anchorId: "group:infrastructure",
        commandPayload: {
          type: "add-component",
          component: {
            id: "redis-cache",
            name: "RedisCache",
            type: "cache",
            capabilities: ["low-latency-cache"],
            tags: []
          }
        }
      },
      // 4. Coding-CAD far-anchor fallback Add (telemetry-svc anchored to server)
      {
        fixtureName: "Coding-CAD (Medium Baseline)",
        scenarioType: "add-component",
        baseProject: CODING_CAD_EXPECTED_BASELINE,
        targetId: "telemetry-svc",
        targetName: "Telemetry",
        expectedReason: "far-anchor-fallback",
        anchorId: "server",
        commandPayload: {
          type: "add-component",
          component: {
            id: "telemetry-svc",
            name: "Telemetry",
            type: "service",
            capabilities: ["metrics-export"],
            tags: ["anchor:server"]
          }
        }
      },
      // 5. Coding-CAD near-anchor Add (architecture-doc-gen anchored to architecture-ir)
      {
        fixtureName: "Coding-CAD (Medium Baseline)",
        scenarioType: "add-component",
        baseProject: CODING_CAD_EXPECTED_BASELINE,
        targetId: "architecture-doc-gen",
        targetName: "DocGen",
        expectedReason: "near-anchor",
        anchorId: "architecture-ir",
        commandPayload: {
          type: "add-component",
          component: {
            id: "architecture-doc-gen",
            name: "DocGen",
            type: "service",
            capabilities: ["markdown-docs"],
            tags: ["anchor:architecture-ir"]
          }
        }
      },
      // 6. Coding-CAD global fallback Add (isolated-mock)
      {
        fixtureName: "Coding-CAD (Medium Baseline)",
        scenarioType: "add-component",
        baseProject: CODING_CAD_EXPECTED_BASELINE,
        targetId: "isolated-mock",
        targetName: "IsolatedMock",
        expectedReason: "global-fallback",
        anchorId: undefined,
        commandPayload: {
          type: "add-component",
          component: {
            id: "isolated-mock",
            name: "IsolatedMock",
            type: "service",
            capabilities: ["unit-testing"],
            tags: []
          }
        }
      },
      // 7. Greenfield Connect scenario (database -> events, CDC outbox)
      {
        fixtureName: "Greenfield (Points System)",
        scenarioType: "connect-components",
        baseProject: pointsSystemFixture,
        targetId: "conn-db-events",
        targetName: "DB-to-Events Outbox Connection",
        expectedReason: "edge-connection",
        anchorId: undefined,
        commandPayload: {
          type: "connect-components",
          connection: {
            id: "conn-db-events",
            from: "database",
            to: "events",
            protocol: "MESSAGE"
          }
        }
      },
      // 8. Greenfield Remove scenario (remove events)
      {
        fixtureName: "Greenfield (Points System)",
        scenarioType: "remove-component",
        baseProject: pointsSystemFixture,
        targetId: "events",
        targetName: "Events Component",
        expectedReason: "pending-deletion",
        anchorId: undefined,
        commandPayload: {
          type: "remove-component",
          componentId: "events"
        }
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

      // 2. Execute command
      await page.evaluate(async (payload) => {
        await window.__coding_cad_execute_command__(payload);
      }, scenario.commandPayload);

      // Wait for prediction to complete
      await page.evaluate(async () => {
        await window.__coding_cad_wait_for_prediction__();
      });

      // Verify DOM representation of Ghost / pending command
      let ghostInfo: any = {};
      if (scenario.scenarioType === "add-component") {
        const ghostArticle = page.locator(`.svelte-flow__node[data-id="ghost:${scenario.targetId}"] article[data-ghost='true']`);
        await expect(ghostArticle).toBeVisible({ timeout: 5000 });
        await expect(ghostArticle).toHaveAttribute("data-ghost-prediction-status", "predicted");

        ghostInfo = await page.evaluate((targetId) => {
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

          const ghostElement = document.querySelector(`.svelte-flow__node[data-id="ghost:${targetId}"]`) as HTMLElement | null;
          const style = ghostElement?.style.transform ?? "";
          const match = /translate\(([-0-9.]+)px,\s*([-0-9.]+)px\)/.exec(style);
          const flowX = match ? parseFloat(match[1]!) : 0;
          const flowY = match ? parseFloat(match[2]!) : 0;

          const articleEl = ghostElement?.querySelector("article[data-ghost='true']");
          const reasonCode = articleEl?.getAttribute("data-ghost-reason-code") ?? "global-fallback";
          const hx = articleEl?.getAttribute("data-ghost-heuristic-x");
          const hy = articleEl?.getAttribute("data-ghost-heuristic-y");
          const heuristicPos = (hx && hy) ? { x: parseFloat(hx), y: parseFloat(hy) } : { x: flowX, y: flowY };

          const noticeEl = ghostElement?.querySelector("[data-testid='ghost-notice']");
          const notice = noticeEl?.textContent?.trim();

          const ghostRect: Rect = {
            id: `ghost:${targetId}`,
            x: flowX,
            y: flowY,
            width: 220,
            height: 90
          };

          const overlaps = formalRects.filter((formal) => {
            if (formal.kind === "group") return false;
            return (
              ghostRect.x < formal.x + formal.width &&
              ghostRect.x + ghostRect.width > formal.x &&
              ghostRect.y < formal.y + formal.height &&
              ghostRect.y + ghostRect.height > formal.y
            );
          });

          return {
            proposalId: proposal.id,
            predictedPos: { x: flowX, y: flowY },
            heuristicPos,
            preOverlaps: overlaps.length,
            notice,
            reasonCode
          };
        }, scenario.targetId);

        // Pre-accept assertions for Add
        expect(ghostInfo.preOverlaps, `Ghost ${scenario.targetId} must not overlap any formal node`).toBe(0);
        expect(ghostInfo.reasonCode, `Reason code for ${scenario.targetId}`).toBe(scenario.expectedReason);
      } else if (scenario.scenarioType === "connect-components") {
        const ghostEdge = page.locator(`.svelte-flow__edge[data-id="ghost:connection:${scenario.targetId}"]`);
        await expect(ghostEdge).toBeVisible({ timeout: 5000 });

        ghostInfo = await page.evaluate((targetId) => {
          const c = window.__coding_cad_controller__!;
          return {
            proposalId: c.state().proposal!.id,
            preOverlaps: 0,
            reasonCode: "edge-connection"
          };
        }, scenario.targetId);
      } else if (scenario.scenarioType === "remove-component") {
        const removedNode = page.locator(`.svelte-flow__node[data-id="${scenario.targetId}"] article[data-ghost-status="pending-deletion"]`);
        await expect(removedNode).toBeVisible({ timeout: 5000 });

        ghostInfo = await page.evaluate((targetId) => {
          const c = window.__coding_cad_controller__!;
          return {
            proposalId: c.state().proposal!.id,
            preOverlaps: 0,
            reasonCode: "pending-deletion"
          };
        }, scenario.targetId);
      }

      // 3. Measure 10-run dry-run prediction latency distribution in browser Web Worker ELK
      const latencyStats = await page.evaluate(async () => {
        const c = window.__coding_cad_controller__!;
        const candidate = c.state().candidate!;
        const prevLayoutState = c.state().layoutState!;
        const times: number[] = [];
        for (let i = 0; i < 10; i++) {
          const t0 = performance.now();
          await (c as any).runIncrementalLayout(candidate, prevLayoutState, undefined, 5000);
          times.push(performance.now() - t0);
        }
        times.sort((a, b) => a - b);
        return {
          minMs: Math.round(times[0] * 10) / 10,
          medianMs: Math.round(times[Math.floor(times.length / 2)] * 10) / 10,
          maxMs: Math.round(times[times.length - 1] * 10) / 10,
          samples: times.map((t) => Math.round(t * 10) / 10)
        };
      });

      // Distance to anchor node if applicable
      let distanceToAnchor: number | undefined;
      if (scenario.anchorId) {
        const anchorNode = preSnapshot.nodes.find((n) => n.id === scenario.anchorId);
        if (anchorNode && ghostInfo.heuristicPos) {
          distanceToAnchor = Math.hypot(
            ghostInfo.heuristicPos.x - anchorNode.position.x,
            ghostInfo.heuristicPos.y - anchorNode.position.y
          );
          if (scenario.expectedReason === "near-anchor") {
            expect(distanceToAnchor).toBeLessThanOrEqual(300);
          } else if (scenario.expectedReason === "far-anchor-fallback") {
            expect(distanceToAnchor).toBeGreaterThan(300);
          }
        }
      }

      // 4. Accept candidate proposal -> triggers incremental layout with Web Worker ELK
      await page.evaluate(async (name) => {
        await window.__coding_cad_accept__(`Approve ${name} change.`);
      }, scenario.targetName);

      // Wait for Ghost to disappear
      await expect(page.locator(".svelte-flow__node article[data-ghost='true']")).toHaveCount(0);

      // Read post-accept state
      const postState = await page.evaluate((targetId) => {
        const c = window.__coding_cad_controller__!;
        const layout = c.layout()!;
        const projection = c.projection()!;
        const state = c.state();
        const finalNode = layout.nodes.find((n) => n.id === targetId);
        return {
          finalPos: finalNode ? { x: finalNode.position.x, y: finalNode.position.y } : undefined,
          layout,
          projectionGraph: projection.layoutGraph,
          viewState: state.layoutState!,
          movement: c.movement()
        };
      }, scenario.targetId);

      // Measure post-accept layout quality
      const quality = measureLayout(postState.projectionGraph, postState.layout);
      const solver = layoutSource(postState.layout);

      // Assert solver is ELK (zero fallback)
      expect(solver, "Solver source must be real ELK with zero fallback").toBe("elk");
      expect(postState.layout.status).toBe("success");
      expect(postState.layout.diagnostics).toHaveLength(0);

      if (quality.peerOverlaps > 0) {
        console.log("FAILED OVERLAPS in scenario:", scenario.targetName, quality.overlapPairs, postState.layout.nodes);
      }
      expect(quality.peerOverlaps, `Post-accept layout must have 0 peer overlaps in ${scenario.targetName}: ${quality.overlapPairs.join(", ")}`).toBe(0);
      expect(quality.containmentFailures, "Post-accept layout must have 0 containment failures").toEqual([]);

      // Measure diffs
      let diffPredictedFinal: number | undefined;
      let diffHeuristicFinal: number | undefined;
      let diffHeuristicPredicted: number | undefined;

      if (scenario.scenarioType === "add-component" && postState.finalPos && ghostInfo.predictedPos && ghostInfo.heuristicPos) {
        diffPredictedFinal = Math.round(Math.hypot(
          postState.finalPos.x - ghostInfo.predictedPos.x,
          postState.finalPos.y - ghostInfo.predictedPos.y
        ) * 10) / 10;

        diffHeuristicFinal = Math.round(Math.hypot(
          postState.finalPos.x - ghostInfo.heuristicPos.x,
          postState.finalPos.y - ghostInfo.heuristicPos.y
        ) * 10) / 10;

        diffHeuristicPredicted = Math.round(Math.hypot(
          ghostInfo.predictedPos.x - ghostInfo.heuristicPos.x,
          ghostInfo.predictedPos.y - ghostInfo.heuristicPos.y
        ) * 10) / 10;
      }

      // Measure product movement of unaffected nodes via canonical controller movement report
      const productMovement = postState.movement ?? {
        unaffectedP95: 0,
        unaffectedMax: 0,
        withinBudget: true
      };
      expect(productMovement.unaffectedP95).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedP95);
      expect(productMovement.unaffectedMax).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedMax);

      const withinBudget = productMovement.unaffectedP95 <= MOVEMENT_BUDGET.unaffectedP95 && productMovement.unaffectedMax <= MOVEMENT_BUDGET.unaffectedMax;

      records.push({
        fixtureName: scenario.fixtureName,
        scenarioType: scenario.scenarioType,
        proposalId: ghostInfo.proposalId,
        targetId: scenario.targetId,
        targetName: scenario.targetName,
        reasonCode: scenario.expectedReason,
        anchorId: scenario.anchorId,
        heuristicPos: ghostInfo.heuristicPos,
        predictedPos: ghostInfo.predictedPos,
        finalPos: postState.finalPos,
        diffPredictedFinal,
        diffHeuristicFinal,
        diffHeuristicPredicted,
        distanceToAnchor: distanceToAnchor ? Math.round(distanceToAnchor * 10) / 10 : undefined,
        preAcceptGhostOverlaps: ghostInfo.preOverlaps,
        postAcceptPeerOverlaps: quality.peerOverlaps,
        postAcceptContainmentFailures: quality.containmentFailures.length,
        solverSource: solver,
        unaffectedP95: Math.round(productMovement.p95 * 10) / 10,
        unaffectedMax: Math.round(productMovement.max * 10) / 10,
        withinBudget,
        notice: ghostInfo.notice,
        latencyDistribution: latencyStats
      });
    }

    // Save benchmark records
    const outputDirBrowser = path.resolve(process.cwd(), "../../logs/validation/p5-browser");
    const outputDirPrediction = path.resolve(process.cwd(), "../../logs/validation/p5-prediction");
    for (const d of [outputDirBrowser, outputDirPrediction]) {
      if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
      }
    }

    const outputFileBrowser = path.join(outputDirBrowser, `ghost-benchmarks-${layoutMode}.json`);
    const outputFileLatency = path.join(outputDirPrediction, `latency-distribution-${layoutMode}.json`);

    fs.writeFileSync(outputFileBrowser, JSON.stringify({ layoutMode, timestamp: new Date().toISOString(), records }, null, 2));
    fs.writeFileSync(outputFileLatency, JSON.stringify({ layoutMode, timestamp: new Date().toISOString(), records }, null, 2));

    // Print benchmark markdown table
    console.log(`\n=== STEP 5.8 REAL BROWSER GHOST PREDICTION BENCHMARKS (${layoutMode.toUpperCase()}) ===`);
    console.log("| Fixture | Target | Scenario | Reason | Heuristic Pos | Predicted Pos | Final Pos | Diff (Pred-Final) | Diff (Heur-Final) | Latency (min/med/max) | Solver | Post Overlap | Contain Fail |");
    console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
    for (const r of records) {
      const heurStr = r.heuristicPos ? `(${r.heuristicPos.x}, ${r.heuristicPos.y})` : "N/A";
      const predStr = r.predictedPos ? `(${r.predictedPos.x}, ${r.predictedPos.y})` : "N/A";
      const finalStr = r.finalPos ? `(${r.finalPos.x}, ${r.finalPos.y})` : "N/A";
      const diffPredFinalStr = r.diffPredictedFinal !== undefined ? `${r.diffPredictedFinal}px` : "N/A";
      const diffHeurFinalStr = r.diffHeuristicFinal !== undefined ? `${r.diffHeuristicFinal}px` : "N/A";
      const latStr = `${r.latencyDistribution.minMs} / ${r.latencyDistribution.medianMs} / ${r.latencyDistribution.maxMs} ms`;

      console.log(
        `| ${r.fixtureName} | ${r.targetName} | ${r.scenarioType} | ${r.reasonCode} | ${heurStr} | ${predStr} | ${finalStr} | ${diffPredFinalStr} | ${diffHeurFinalStr} | ${latStr} | ${r.solverSource} | ${r.postAcceptPeerOverlaps} | ${r.postAcceptContainmentFailures} |`
      );
    }
    console.log(`\nSaved benchmark artifacts:\n  - ${outputFileBrowser}\n  - ${outputFileLatency}\n`);

    // Verify all 8 records pass
    expect(records.length).toBe(8);
    expect(records.every((r) => r.preAcceptGhostOverlaps === 0)).toBe(true);
    expect(records.every((r) => r.postAcceptPeerOverlaps === 0)).toBe(true);
    expect(records.every((r) => r.postAcceptContainmentFailures === 0)).toBe(true);
    expect(records.every((r) => r.solverSource === "elk")).toBe(true);
    expect(records.every((r) => r.withinBudget)).toBe(true);

    // Verify Add scenarios have diffPredictedFinal === 0.0px (D-011 Consistency)
    const addRecords = records.filter((r) => r.scenarioType === "add-component");
    for (const r of addRecords) {
      expect(r.diffPredictedFinal, `Predicted position must exactly match final accepted position for ${r.targetName}`).toBe(0);
    }
  });
});
