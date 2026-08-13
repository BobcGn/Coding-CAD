import assert from "node:assert/strict";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { compileArchitectureProjection } from "../compiler/compiler.js";
import { layoutFixture } from "../compiler/test-fixture.js";
import { layoutArchitectureGraph } from "./incremental-layout.js";

const initialGraph = compileArchitectureProjection(withoutRedis(layoutFixture)).layoutGraph;
const initial = await layoutArchitectureGraph(initialGraph);
assert.equal(initial.appliedMode, "FULL");

const noPrior = await layoutArchitectureGraph(initialGraph, { mode: "INCREMENTAL" });
assert.equal(noPrior.requestedMode, "INCREMENTAL");
assert.equal(noPrior.appliedMode, "FULL", "missing previous state must safely fall back to FULL");

const redisGraph = compileArchitectureProjection(layoutFixture).layoutGraph;
const snapshot = JSON.stringify(redisGraph);
const first = await layoutArchitectureGraph(redisGraph, { mode: "INCREMENTAL", previousState: initial.state });
const second = await layoutArchitectureGraph(redisGraph, { mode: "INCREMENTAL", previousState: initial.state });
assert.equal(first.appliedMode, "INCREMENTAL");
assert.deepEqual(second, first, "identical graph and previous state must remain deterministic");
assert.equal(JSON.stringify(redisGraph), snapshot, "incremental layout must not mutate LayoutGraph");
assert.equal(first.movement?.withinBudget, true);
assert.equal(first.movement?.unaffectedP95, 0);
assert.equal(first.movement?.unaffectedMax, 0);
assert.equal(first.movement?.relativeOrderReversed, false);

const previousPositions = new Map(initial.state.nodes.map((node) => [node.id, node.position]));
const currentPositions = new Map(first.result.nodes.map((node) => [node.id, node.position]));
for (const nodeId of ["customer", "gateway", "payments", "postgres", "events", "billing"]) {
  assert.deepEqual(currentPositions.get(nodeId), previousPositions.get(nodeId), `${nodeId} should preserve its mental-map position`);
}
assert.notDeepEqual(currentPositions.get("redis"), undefined);
assert.ok(first.result.nodes.every((node) => node.position.x + node.size.width <= first.result.size.width));
assert.ok(first.result.nodes.every((node) => node.position.y + node.size.height <= first.result.size.height));

const connectionAddedProject: ArchitectureProject = {
  ...withoutRedis(layoutFixture),
  architecture: {
    ...withoutRedis(layoutFixture).architecture,
    connections: [
      ...withoutRedis(layoutFixture).architecture.connections,
      { id: "gateway-payments", from: "gateway", to: "payments", protocol: "HTTPS" }
    ]
  }
};
const connectionAdded = await layoutArchitectureGraph(
  compileArchitectureProjection(connectionAddedProject).layoutGraph,
  { mode: "INCREMENTAL", previousState: initial.state }
);
assert.equal(connectionAdded.appliedMode, "INCREMENTAL");
assert.equal(connectionAdded.movement?.withinBudget, true);
assert.equal(connectionAdded.movement?.unaffectedP95, 0);

const removedProject: ArchitectureProject = {
  ...withoutRedis(layoutFixture),
  architecture: {
    components: withoutRedis(layoutFixture).architecture.components.filter((component) => component.id !== "billing"),
    connections: withoutRedis(layoutFixture).architecture.connections.filter((connection) => connection.id !== "payments-billing")
  }
};
const removed = await layoutArchitectureGraph(
  compileArchitectureProjection(removedProject).layoutGraph,
  { mode: "INCREMENTAL", previousState: initial.state }
);
assert.equal(removed.appliedMode, "INCREMENTAL");
assert.equal(removed.movement?.withinBudget, true);
assert.equal(removed.result.nodes.some((node) => node.id === "billing"), false);

const directionChanged = await layoutArchitectureGraph(
  compileArchitectureProjection(layoutFixture, { direction: "TB" }).layoutGraph,
  { mode: "INCREMENTAL", previousState: initial.state }
);
assert.equal(directionChanged.appliedMode, "FULL", "direction changes must not reuse incompatible state");

console.log("architecture-layout incremental stability tests passed");

function withoutRedis(project: ArchitectureProject): ArchitectureProject {
  return {
    ...project,
    architecture: {
      components: project.architecture.components.filter((component) => component.id !== "redis"),
      connections: project.architecture.connections.filter((connection) => connection.id !== "orders-redis")
    }
  };
}
