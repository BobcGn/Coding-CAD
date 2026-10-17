import assert from "node:assert/strict";
import {
  encodeComponentTags,
  decodeComponentEvidence,
  encodeConnectionConstraints,
  decodeConnectionEvidence,
  formatLayerPriorExplanation,
  type ComponentEvidence,
  type ConnectionEvidence
} from "./evidence-codec.js";

// Test 1: Component evidence round-trip
{
  const evidence: ComponentEvidence = {
    source: "declared",
    confidence: 1.0,
    path: "packages/architecture-ir",
    exports: ["ArchitectureProject", "Component", "Connection"]
  };

  const tags = encodeComponentTags(evidence);
  assert.ok(tags.includes("implementation-analyzer"));
  assert.ok(tags.includes("source:declared"));
  assert.ok(tags.includes("confidence:1.00"));
  assert.ok(tags.includes("path:packages/architecture-ir"));
  assert.ok(tags.includes("export:ArchitectureProject"));

  const decoded = decodeComponentEvidence({ tags });
  assert.equal(decoded.source, "declared");
  assert.equal(decoded.confidence, 1.0);
  assert.equal(decoded.path, "packages/architecture-ir");
  assert.deepEqual(decoded.exports, ["ArchitectureProject", "Component", "Connection"]);
}

// Test 2: Connection evidence round-trip (declared-and-used runtime dependency)
{
  const evidence: ConnectionEvidence = {
    source: "declared",
    confidence: 1.0,
    dependencyKind: "runtime",
    usageStatus: "declared-and-used",
    evidencePath: "packages/architecture-agent/package.json",
    humanDescription: "Declared dependency confirmed by code imports."
  };

  const constraints = encodeConnectionConstraints(evidence);
  assert.ok(constraints.includes("source:declared"));
  assert.ok(constraints.includes("Detection confidence: 1.00"));
  assert.ok(constraints.includes("kind:runtime"));
  assert.ok(constraints.includes("usage:declared-and-used"));
  assert.ok(constraints.includes("evidence:packages/architecture-agent/package.json"));

  const decoded = decodeConnectionEvidence({
    constraints,
    description: evidence.humanDescription
  });
  assert.equal(decoded.source, "declared");
  assert.equal(decoded.confidence, 1.0);
  assert.equal(decoded.dependencyKind, "runtime");
  assert.equal(decoded.usageStatus, "declared-and-used");
  assert.equal(decoded.evidencePath, "packages/architecture-agent/package.json");
  assert.equal(decoded.humanDescription, evidence.humanDescription);
}

// Test 3: Undeclared code import connection
{
  const evidence: ConnectionEvidence = {
    source: "resolved",
    confidence: 0.9,
    usageStatus: "undeclared-used",
    evidencePath: "packages/pkg-b/src/index.ts"
  };

  const constraints = encodeConnectionConstraints(evidence);
  const decoded = decodeConnectionEvidence({ constraints });
  assert.equal(decoded.source, "resolved");
  assert.equal(decoded.confidence, 0.9);
  assert.equal(decoded.usageStatus, "undeclared-used");
  assert.equal(decoded.evidencePath, "packages/pkg-b/src/index.ts");
}

// Test 4: Layer prior explanation
{
  const explanation = formatLayerPriorExplanation("declared", 1.0);
  assert.ok(explanation.includes("Layer Prior"));
  assert.ok(explanation.includes("Declared"));
}

console.log("evidence-codec tests passed");
