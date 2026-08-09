import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { ImplementationAnalyzer } from "./analyzer.js";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = path.join(packageRoot, "fixtures", "example-project");
const analyzer = new ImplementationAnalyzer();

const inspection = await analyzer.inspect(fixtureRoot);
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

const architecture: ArchitectureProject = await analyzer.analyze(fixtureRoot);
assert.equal(architecture.version, "0.1");
assert.equal(architecture.intent.name, "example-project");
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

await assert.rejects(() => analyzer.analyze(path.join(fixtureRoot, "missing")), /not a directory/);

console.log("implementation-analyzer tests passed");
