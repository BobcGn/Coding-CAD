import assert from "node:assert/strict";
import { runAbstractionPass } from "./abstraction-pass.js";
import { runConstraintPass } from "./constraint-pass.js";
import { runSemanticPass } from "./semantic-pass.js";
import { runVisualIrPass } from "./visual-ir-pass.js";
import { layoutFixture } from "../test-fixture.js";

const snapshot = JSON.stringify(layoutFixture);
const classifications = runSemanticPass(layoutFixture);
assert.deepEqual(
  Object.fromEntries(classifications.map((item) => [item.componentId, item.role])),
  {
    customer: "actor",
    gateway: "gateway",
    orders: "service",
    payments: "service",
    postgres: "database",
    redis: "cache",
    events: "queue",
    billing: "external"
  }
);

const abstraction = runAbstractionPass(layoutFixture, classifications);
assert.deepEqual(abstraction.groups.map((group) => group.id), ["group:infrastructure", "group:module:commerce"]);
assert.deepEqual(abstraction.groups.find((group) => group.id === "group:module:commerce")?.memberIds, ["orders", "payments"]);
assert.deepEqual(
  abstraction.groups.find((group) => group.id === "group:infrastructure")?.memberIds,
  ["billing", "events", "postgres", "redis"]
);

const visualGraph = runVisualIrPass(layoutFixture, classifications, abstraction);
assert.equal(visualGraph.nodes.find((node) => node.id === "redis")?.parentId, "group:infrastructure");
assert.equal(visualGraph.nodes.find((node) => node.id === "orders")?.parentId, "group:module:commerce");
assert.equal(visualGraph.edges.find((edge) => edge.id === "orders-events")?.asynchronous, true);

const layoutGraph = runConstraintPass(visualGraph);
assert.equal(layoutGraph.direction, "LR");
assert.ok(layoutGraph.constraints.some((item) => item.kind === "rank" && item.nodeId === "postgres" && item.rank === "data"));
assert.ok(layoutGraph.constraints.some((item) => item.kind === "rank" && item.nodeId === "billing" && item.rank === "external"));
assert.ok(layoutGraph.constraints.some((item) => item.kind === "proximity" && item.nodeIds[0] === "orders" && item.nodeIds[1] === "redis"));
assert.equal(JSON.stringify(layoutFixture), snapshot, "compiler passes must not mutate ArchitectureProject");

console.log("architecture-layout pass tests passed");
