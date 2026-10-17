import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { ImplementationAnalyzer } from "@coding-cad/implementation-analyzer";
import { createImplementationModel } from "./types.js";
import { ImplementationValidator } from "./validator.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(packageRoot, "../..");
const syntheticFixtureRoot = path.join(
  repoRoot,
  "packages/implementation-analyzer/fixtures/synthetic-large-repo"
);

const analyzer = new ImplementationAnalyzer();
const validator = new ImplementationValidator();

// Test suite 1: Reverse-engineered Coding-CAD repository compatibility
{
  const inspection = await analyzer.inspect(repoRoot);
  const actualArchitecture = await analyzer.analyze(repoRoot);

  // Minimal viable expected architecture matching key core packages
  const expectedArchitecture: ArchitectureProject = {
    version: "0.1",
    intent: {
      name: "Coding-CAD",
      purpose: ["Reverse-engineered architecture validation test."]
    },
    domain: { entities: [] },
    architecture: {
      components: [
        {
          id: "architecture-ir",
          name: "architecture-ir",
          type: "service",
          capabilities: ["workspace-package"],
          limitations: ["not-primary-storage"]
        },
        {
          id: "architecture-layout",
          name: "architecture-layout",
          type: "service",
          capabilities: ["workspace-package"]
        },
        {
          id: "component-registry",
          name: "component-registry",
          type: "service",
          capabilities: ["workspace-package"]
        }
      ],
      connections: [
        {
          id: "layout-to-ir",
          from: "architecture-layout",
          to: "architecture-ir",
          protocol: "module-import"
        }
      ]
    },
    constraints: [],
    decisions: []
  };

  const model = createImplementationModel(inspection, actualArchitecture);
  const report = validator.validate({
    architecture: expectedArchitecture,
    implementation: model
  });

  // Verify that evidence tags (source:declared, confidence:1.00, path:..., export:...)
  // do NOT trigger limitation false positives like 'not-primary-storage'
  const constraintIssues = report.issues.filter((i) => i.id.startsWith("constraint.violation."));
  assert.equal(
    constraintIssues.length,
    0,
    `Evidence tags should not trigger constraint false positives. Found: ${JSON.stringify(constraintIssues)}`
  );

  // The minimal expected components and connections exist in actual architecture
  assert.equal(
    report.issues.filter((i) => i.id.startsWith("component.missing.")).length,
    0,
    "Expected core components must exist in Coding-CAD actual reverse-engineered architecture"
  );
  assert.equal(
    report.issues.filter((i) => i.id.startsWith("dependency.missing.")).length,
    0,
    "Expected connection must exist in Coding-CAD actual reverse-engineered architecture"
  );
}

// Test suite 2: Synthetic large repository compatibility
{
  const inspection = await analyzer.inspect(syntheticFixtureRoot);
  const actualArchitecture = await analyzer.analyze(syntheticFixtureRoot);

  // Build expected architecture directly matching the synthetic components
  const expectedArchitecture: ArchitectureProject = {
    version: "0.1",
    intent: {
      name: "synthetic-large-repo",
      purpose: ["Synthetic large repo validation test."]
    },
    domain: { entities: [] },
    architecture: {
      components: actualArchitecture.architecture.components.slice(0, 10).map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type ?? "service",
        capabilities: [...c.capabilities],
        limitations: ["not-primary-storage"]
      })),
      connections: actualArchitecture.architecture.connections.slice(0, 5).map((conn) => ({
        id: conn.id,
        from: conn.from,
        to: conn.to,
        protocol: conn.protocol
      }))
    },
    constraints: [],
    decisions: []
  };

  const model = createImplementationModel(inspection, actualArchitecture);
  const report = validator.validate({
    architecture: expectedArchitecture,
    implementation: model
  });

  // Zero false positives from evidence strings/tags
  const constraintIssues = report.issues.filter((i) => i.id.startsWith("constraint.violation."));
  assert.equal(
    constraintIssues.length,
    0,
    `Synthetic fixture evidence should not trigger false positives. Found: ${JSON.stringify(constraintIssues)}`
  );
  assert.equal(
    report.issues.filter((i) => i.severity === "ERROR").length,
    0,
    `Synthetic fixture validation must pass with zero errors. Issues: ${JSON.stringify(report.issues)}`
  );
}

console.log("implementation-validator analyzer-compatibility tests passed");
