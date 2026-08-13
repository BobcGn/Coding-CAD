import assert from "node:assert/strict";
import { compileArchitectureProjection } from "../../compiler/compiler.js";
import { layoutFixture } from "../../compiler/test-fixture.js";
import { createFallbackResult, toElkGraph, validateLayoutResult } from "./elk-adapter.js";

const layoutGraph = compileArchitectureProjection(layoutFixture).layoutGraph;
const elkGraph = toElkGraph(layoutGraph);

assert.equal(elkGraph.layoutOptions?.["elk.algorithm"], "layered");
assert.equal(elkGraph.layoutOptions?.["elk.direction"], "RIGHT");
assert.equal(elkGraph.children?.some((node) => node.id === "group:module:commerce"), true);
assert.equal(elkGraph.edges?.length, layoutGraph.edges.length);

const fallback = createFallbackResult(layoutGraph, {
  code: "SOLVER_FAILURE",
  severity: "warning",
  message: "fixture failure"
});
assert.equal(fallback.status, "fallback");
assert.equal(fallback.nodes.every((node) => Number.isFinite(node.position.x) && Number.isFinite(node.position.y)), true);
assert.doesNotThrow(() => validateLayoutResult(layoutGraph, fallback));

console.log("architecture-layout ELK adapter tests passed");
