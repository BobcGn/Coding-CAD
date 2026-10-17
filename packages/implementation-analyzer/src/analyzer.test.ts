import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { ImplementationAnalyzer } from "./analyzer.js";
import { decodeComponentEvidence, decodeConnectionEvidence } from "./codec/evidence-codec.js";
import "./codec/evidence-codec.test.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const exampleFixtureRoot = path.join(packageRoot, "fixtures", "example-project");
const smallMonoFixtureRoot = path.join(packageRoot, "fixtures", "small-monorepo");
const edgeCasesFixtureRoot = path.join(packageRoot, "fixtures", "edge-cases-repo");
const analyzer = new ImplementationAnalyzer();

// Test suite 1: Single repository (example-project)
{
  const inspection = await analyzer.inspect(exampleFixtureRoot);
  assert.deepEqual(inspection.snapshot.languages, ["TypeScript"]);
  assert.deepEqual(inspection.snapshot.configFiles, ["package.json", "tsconfig.json"]);
  assert.deepEqual(inspection.snapshot.dependencies, ["@nestjs/core", "pg", "redis"]);
  assert.deepEqual(inspection.technology.frameworks, ["NestJS"]);
  assert.deepEqual(inspection.technology.databases, ["PostgreSQL", "Redis"]);
  assert.deepEqual(
    inspection.modules.map((module) => module.name),
    ["OrderService", "PaymentService", "UserService"]
  );
  assert.ok(inspection.dependencyGraph.moduleDependencies.some((edge) =>
    edge.fromModuleId === "order-service" && edge.toModuleId === "payment-service"
  ));
  assert.ok(inspection.dependencyGraph.externalDependencies.some((usage) =>
    usage.moduleId === "payment-service" && usage.dependency === "pg"
  ));

  const architecture: ArchitectureProject = await analyzer.analyze(exampleFixtureRoot);
  assert.equal(architecture.version, "0.1");
  assert.equal(architecture.intent.name, "example-project");
  assert.deepEqual(architecture.intent.purpose, [
    "Describe the architecture reverse-engineered from repository example-project."
  ]);
  assert.deepEqual(
    architecture.architecture.components.map((component) => component.id),
    ["order-service", "payment-service", "user-service", "postgresql", "redis"]
  );
  assert.ok(architecture.architecture.connections.some((connection) =>
    connection.from === "order-service" && connection.to === "payment-service"
  ));
  assert.ok(architecture.architecture.connections.some((connection) =>
    connection.from === "payment-service" && connection.to === "postgresql"
  ));
  assert.ok(architecture.architecture.connections.some((connection) =>
    connection.from === "user-service" && connection.to === "redis"
  ));
  assert.equal(architecture.constraints.length, 0);
  assert.equal(architecture.decisions.length, 0);

  // Check evidence and confidence on components via typed codec
  const orderServiceComp = architecture.architecture.components.find((c) => c.id === "order-service")!;
  const decodedEvidence = decodeComponentEvidence(orderServiceComp);
  assert.equal(decodedEvidence.source, "resolved");
  assert.equal(decodedEvidence.confidence, 0.90);
  // Verify capabilities is NOT polluted with export:
  assert.ok(!orderServiceComp.capabilities.some((cap) => cap.startsWith("export:")));
  assert.deepEqual(orderServiceComp.capabilities, ["repository-derived-module"]);
  // Verify exports are preserved in tags and decoded properly
  assert.ok(orderServiceComp.tags?.some((t) => t.startsWith("export:")));
  assert.ok(decodedEvidence.exports.includes("OrderService"));
}

// Test suite 2: Monorepo pnpm workspace (small-monorepo)
{
  const monoInspection = await analyzer.inspect(smallMonoFixtureRoot);
  assert.equal(monoInspection.snapshot.workspacePackages?.length, 3);
  assert.deepEqual(
    monoInspection.snapshot.workspacePackages?.map((pkg) => pkg.name),
    ["@small-monorepo/auth", "@small-monorepo/billing", "@small-monorepo/gateway"]
  );
  assert.deepEqual(
    monoInspection.modules.map((m) => m.id),
    ["auth-service", "billing-service", "gateway-service"]
  );

  const monoArch = await analyzer.analyze(smallMonoFixtureRoot);
  assert.equal(monoArch.architecture.components.length, 3);

  // Assert declared confidence and source tags
  for (const comp of monoArch.architecture.components) {
    const decoded = decodeComponentEvidence(comp);
    assert.equal(decoded.source, "declared");
    assert.equal(decoded.confidence, 1.00);
    assert.ok(comp.capabilities.includes("workspace-package"));
    assert.ok(!comp.capabilities.some((c) => c.startsWith("export:")));
  }

  // Assert declared connections and confidence
  assert.equal(monoArch.architecture.connections.length, 3);
  for (const conn of monoArch.architecture.connections) {
    const decoded = decodeConnectionEvidence(conn);
    assert.equal(decoded.source, "declared");
    assert.equal(decoded.confidence, 1.00);
    assert.equal(decoded.dependencyKind, "runtime");
    assert.equal(decoded.usageStatus, "declared-and-used");
  }
}

// Test suite 3: Edge cases fixture (edge-cases-repo)
{
  const inspection = await analyzer.inspect(edgeCasesFixtureRoot);
  const architecture = await analyzer.analyze(edgeCasesFixtureRoot);

  // 1. Verify all 5 workspace packages are discovered
  assert.equal(inspection.snapshot.workspacePackages?.length, 5);
  const componentIds = architecture.architecture.components.map((c) => c.id).sort();
  assert.deepEqual(componentIds, [
    "pkg-circular-a",
    "pkg-circular-b",
    "pkg-consumer",
    "pkg-core",
    "pkg-undeclared"
  ]);

  // 2. Edge case 1: Barrel export * from submodule
  const pkgCore = architecture.architecture.components.find((c) => c.id === "pkg-core")!;
  const coreEvidence = decodeComponentEvidence(pkgCore);
  assert.ok(
    coreEvidence.exports.includes("coreUtility"),
    "Barrel export * should expose coreUtility in decoded exports"
  );

  // 3. Edge case 2, 3, 4: Dynamic import, type-only import, and tsconfig paths
  const consumerToCore = architecture.architecture.connections.find(
    (c) => c.from === "pkg-consumer" && c.to === "pkg-core"
  );
  assert.ok(consumerToCore !== undefined, "pkg-consumer -> pkg-core connection must exist");
  const consumerEvidence = decodeConnectionEvidence(consumerToCore);
  assert.equal(consumerEvidence.source, "declared");
  assert.equal(consumerEvidence.usageStatus, "declared-and-used");
  assert.equal(consumerEvidence.dependencyKind, "runtime");

  // 4. Edge case 5: Circular imports (circular-a <-> circular-b)
  const aToB = architecture.architecture.connections.find(
    (c) => c.from === "pkg-circular-a" && c.to === "pkg-circular-b"
  );
  const bToA = architecture.architecture.connections.find(
    (c) => c.from === "pkg-circular-b" && c.to === "pkg-circular-a"
  );
  assert.ok(aToB !== undefined, "pkg-circular-a -> pkg-circular-b must exist in circular import");
  assert.ok(bToA !== undefined, "pkg-circular-b -> pkg-circular-a must exist in circular import");
  assert.equal(decodeConnectionEvidence(aToB).usageStatus, "declared-and-used");
  assert.equal(decodeConnectionEvidence(bToA).usageStatus, "declared-and-used");

  // 5. Edge case 6: Undeclared workspace import (pkg-undeclared imports @edge/pkg-core without declaration)
  const undeclaredToCore = architecture.architecture.connections.find(
    (c) => c.from === "pkg-undeclared" && c.to === "pkg-core"
  );
  assert.ok(undeclaredToCore !== undefined, "Undeclared workspace import must be detected as edge");
  const undeclaredEvidence = decodeConnectionEvidence(undeclaredToCore);
  assert.equal(undeclaredEvidence.source, "resolved");
  assert.equal(undeclaredEvidence.usageStatus, "undeclared-used");
  assert.equal(undeclaredEvidence.confidence, 0.90);

  // 6. Edge case 7: Unparseable syntax in broken.ts must be explicitly reported
  assert.ok(
    inspection.unsupportedStructures?.some(
      (report) => report.type === "unparseable-syntax" && report.scope.includes("broken.ts")
    ),
    "broken.ts must produce an explicit unparseable-syntax report without crash or silent drop"
  );
}

// Test suite 4: Rejection on missing directory
await assert.rejects(() => analyzer.analyze(path.join(exampleFixtureRoot, "missing")), /not a directory/);

console.log("implementation-analyzer tests passed");

