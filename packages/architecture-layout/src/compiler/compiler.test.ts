import assert from "node:assert/strict";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { compileArchitectureProjection } from "./compiler.js";
import { layoutFixture } from "./test-fixture.js";

const first = compileArchitectureProjection(layoutFixture);
const second = compileArchitectureProjection(layoutFixture);
assert.deepEqual(second, first, "identical input and options must be deterministic");
assert.doesNotThrow(() => JSON.stringify(first), "Checkpoint 1 contracts must remain serializable");

const tb = compileArchitectureProjection(layoutFixture, { direction: "TB" });
assert.equal(tb.layoutGraph.direction, "TB");
assert.equal(first.layoutGraph.direction, "LR");

const componentIds = new Set(layoutFixture.architecture.components.map((component) => component.id));
const projectedComponents = first.visualGraph.nodes.filter((node) => node.kind === "component");
assert.equal(projectedComponents.length, componentIds.size);
assert.equal(new Set(first.visualGraph.nodes.map((node) => node.id)).size, first.visualGraph.nodes.length);
assert.ok(first.visualGraph.edges.every((edge) => componentIds.has(edge.from) && componentIds.has(edge.to)));

const malformed: ArchitectureProject = {
  ...layoutFixture,
  architecture: {
    components: layoutFixture.architecture.components,
    connections: [{ id: "dangling", from: "orders", to: "missing", protocol: "HTTP" }]
  }
};
assert.throws(() => compileArchitectureProjection(malformed), /Unknown connection target: missing/);

assertNoForbiddenKeys(first);
const json = JSON.stringify(first).toLowerCase();
for (const forbiddenType of ["svelte", "elk", "html", "dom"] ) {
  assert.equal(json.includes(forbiddenType), false, `projection leaked forbidden type ${forbiddenType}`);
}

console.log("architecture-layout compiler integration tests passed");

function assertNoForbiddenKeys(value: unknown): void {
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach(assertNoForbiddenKeys);
    return;
  }
  const forbiddenKeys = new Set(["x", "y", "width", "height", "viewport", "cssClass"]);
  for (const [key, child] of Object.entries(value)) {
    assert.equal(forbiddenKeys.has(key), false, `projection leaked forbidden key ${key}`);
    assertNoForbiddenKeys(child);
  }
}
