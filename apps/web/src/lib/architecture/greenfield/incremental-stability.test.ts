import { describe, expect, it } from "vitest";
import type { ArchitectureProject, ComponentType } from "@coding-cad/architecture-ir";
import {
  compileArchitectureProjection,
  createLayoutEngine,
  layoutArchitectureGraph,
  MOVEMENT_BUDGET,
  type MovementReport
} from "@coding-cad/architecture-layout";
import { pointsSystemFixture } from "../projection/points-system-fixture.js";
import { CODING_CAD_EXPECTED_BASELINE } from "../compliance/baseline-presets.js";
import {
  calculateGhostPlacement,
  type Rect
} from "$lib/cad/canvas/adapters/ghost-placement.js";
import { WorkspaceShellController } from "./workspace-shell-controller.js";

interface DisplacementSample {
  readonly fixtureName: string;
  readonly componentName: string;
  readonly ghostPos: { x: number; y: number };
  readonly finalPos: { x: number; y: number };
  readonly distance: number;
  readonly movement: MovementReport;
}

function calculateStats(samples: readonly number[]) {
  if (samples.length === 0) return { mean: 0, median: 0, max: 0 };
  const sorted = [...samples].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / sorted.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const max = sorted[sorted.length - 1];
  return { mean, median, max };
}

describe("Step 5.4 Incremental Layout & Stability Metrics", () => {
  it("verifies unaffected node stability on Greenfield fixture (p95 <= 48px, max <= 144px)", async () => {
    const controller = new WorkspaceShellController(pointsSystemFixture, {
      engineFactory: () => createLayoutEngine()
    });

    // Initial formal layout
    await controller.updateAcceptedArchitecture(pointsSystemFixture);
    const formalBefore = controller.state().accepted;
    const initialLayoutState = controller.state().layoutState;
    expect(initialLayoutState).toBeDefined();

    // Add Kafka component connected to point-service
    await controller.executeCommand({
      type: "add-component",
      component: {
        id: "kafka-queue",
        name: "Kafka",
        type: "queue",
        capabilities: ["async-events"]
      }
    });

    // Accept proposal, which triggers incremental layout with stability pass
    await controller.acceptCandidate("Approve adding Kafka queue");

    const state = controller.state();
    expect(state.accepted.architecture.components.some((c) => c.id === "kafka-queue")).toBe(true);
    const movement = controller.movement();
    expect(movement).toBeDefined();

    // Stability budget assertions
    expect(movement!.unaffectedP95).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedP95);
    expect(movement!.unaffectedMax).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedMax);
    expect(movement!.withinBudget).toBe(true);
  });

  it("verifies unaffected node stability on Medium Brownfield fixture (15 components, 42 edges)", async () => {
    const controller = new WorkspaceShellController(CODING_CAD_EXPECTED_BASELINE, {
      engineFactory: () => createLayoutEngine()
    });

    // Initial formal layout
    await controller.updateAcceptedArchitecture(CODING_CAD_EXPECTED_BASELINE);
    expect(controller.state().layoutState).toBeDefined();

    // Add a new package service
    await controller.executeCommand({
      type: "add-component",
      component: {
        id: "telemetry-server",
        name: "TelemetryServer",
        type: "service",
        capabilities: ["metrics-collection"]
      }
    });

    // Accept proposal
    await controller.acceptCandidate("Approve adding TelemetryServer");

    const movement = controller.movement();
    expect(movement).toBeDefined();

    // Stability budget assertions
    expect(movement!.unaffectedP95).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedP95);
    expect(movement!.unaffectedMax).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedMax);
    expect(movement!.withinBudget).toBe(true);
  });

  it("measures Ghost -> Final position displacement across Greenfield and Medium fixtures", async () => {
    const samples: DisplacementSample[] = [];

    // Helper to evaluate a test scenario
    async function evaluateScenario(
      fixtureName: string,
      baseProject: ArchitectureProject,
      component: { id: string; name: string; type: ComponentType; capabilities: string[] },
      connectedToId?: string
    ) {
      const controller = new WorkspaceShellController(baseProject, {
        engineFactory: () => createLayoutEngine()
      });
      await controller.updateAcceptedArchitecture(baseProject);

      // Execute Add command
      await controller.executeCommand({
        type: "add-component",
        component
      });

      const formalRects: Rect[] = controller.layout()!.nodes.map((n) => ({
        id: n.id,
        x: n.position.x,
        y: n.position.y,
        width: n.size.width,
        height: n.size.height,
        parentId: n.parentId,
        kind: n.kind
      }));

      // Compute Ghost position via local adapter
      const ghostPlacement = calculateGhostPlacement({
        ghostId: component.id,
        relatedComponentIds: connectedToId ? [connectedToId] : [],
        formalNodes: formalRects,
        direction: controller.layout()!.direction
      });

      // Accept proposal -> triggers incremental layout
      await controller.acceptCandidate(`Approve ${component.name}`);

      const finalLayout = controller.layout()!;
      const finalNode = finalLayout.nodes.find((n) => n.id === component.id);
      expect(finalNode).toBeDefined();

      const distance = Math.hypot(
        finalNode!.position.x - ghostPlacement.position.x,
        finalNode!.position.y - ghostPlacement.position.y
      );

      const movement = controller.movement()!;
      samples.push({
        fixtureName,
        componentName: component.name,
        ghostPos: ghostPlacement.position,
        finalPos: finalNode!.position,
        distance,
        movement
      });
    }

    // Greenfield trials
    await evaluateScenario("Greenfield (Points System)", pointsSystemFixture, {
      id: "kafka",
      name: "Kafka",
      type: "queue",
      capabilities: ["events"]
    }, "point-service");

    await evaluateScenario("Greenfield (Points System)", pointsSystemFixture, {
      id: "redis-replica",
      name: "RedisReplica",
      type: "cache",
      capabilities: ["read-cache"]
    }, "redis");

    await evaluateScenario("Greenfield (Points System)", pointsSystemFixture, {
      id: "notification-svc",
      name: "NotificationService",
      type: "service",
      capabilities: ["email", "sms"]
    }, "gateway");

    // Medium Brownfield trials
    await evaluateScenario("Medium (Coding-CAD Baseline)", CODING_CAD_EXPECTED_BASELINE, {
      id: "architecture-doc-gen",
      name: "DocGen",
      type: "service",
      capabilities: ["documentation"]
    }, "architecture-ir");

    await evaluateScenario("Medium (Coding-CAD Baseline)", CODING_CAD_EXPECTED_BASELINE, {
      id: "telemetry",
      name: "Telemetry",
      type: "service",
      capabilities: ["metrics"]
    }, "server");

    await evaluateScenario("Medium (Coding-CAD Baseline)", CODING_CAD_EXPECTED_BASELINE, {
      id: "artifact-viewer",
      name: "ArtifactViewer",
      type: "service",
      capabilities: ["ui-view"]
    }, "web");

    // Log the empirical metrics table
    console.log("\n=== STEP 5.4 EMPIRICAL MEASUREMENT DATA ===");
    console.log("| Fixture | Component | Ghost Position | Final Layout Position | Displacement (px) | Unaffected p95 (px) | Unaffected Max (px) | Within Budget |");
    console.log("| --- | --- | --- | --- | --- | --- | --- | --- |");
    for (const s of samples) {
      console.log(
        `| ${s.fixtureName} | ${s.componentName} | (${s.ghostPos.x.toFixed(1)}, ${s.ghostPos.y.toFixed(1)}) | (${s.finalPos.x.toFixed(1)}, ${s.finalPos.y.toFixed(1)}) | ${s.distance.toFixed(1)} | ${s.movement.unaffectedP95.toFixed(1)} | ${s.movement.unaffectedMax.toFixed(1)} | ${s.movement.withinBudget ? "YES" : "NO"} |`
      );
    }

    const greenfieldDistances = samples.filter((s) => s.fixtureName.startsWith("Greenfield")).map((s) => s.distance);
    const mediumDistances = samples.filter((s) => s.fixtureName.startsWith("Medium")).map((s) => s.distance);

    const greenfieldStats = calculateStats(greenfieldDistances);
    const mediumStats = calculateStats(mediumDistances);

    console.log("\n=== SUMMARY DISPLACEMENT STATISTICS ===");
    console.log(`Greenfield -> Mean: ${greenfieldStats.mean.toFixed(1)}px, Median: ${greenfieldStats.median.toFixed(1)}px, Max: ${greenfieldStats.max.toFixed(1)}px`);
    console.log(`Medium     -> Mean: ${mediumStats.mean.toFixed(1)}px, Median: ${mediumStats.median.toFixed(1)}px, Max: ${mediumStats.max.toFixed(1)}px`);

    // Verify all unaffected movements are strictly within budget
    for (const s of samples) {
      expect(s.movement.unaffectedP95).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedP95);
      expect(s.movement.unaffectedMax).toBeLessThanOrEqual(MOVEMENT_BUDGET.unaffectedMax);
      expect(s.movement.withinBudget).toBe(true);
    }
  });
});
