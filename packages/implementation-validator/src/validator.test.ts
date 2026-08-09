import assert from "node:assert/strict";
import type { ArchitectureProject, Component } from "@coding-cad/architecture-ir";
import type { RepositoryInspection, TechnologyInfo } from "@coding-cad/implementation-analyzer";
import { formatComplianceReport } from "./report/formatter.js";
import type { ComplianceRule, ImplementationModel } from "./types.js";
import { createImplementationModel } from "./types.js";
import { ImplementationValidator } from "./validator.js";

const pointService: Component = {
  id: "point-service",
  name: "PointService",
  type: "service",
  capabilities: ["transactional-command-handling"],
  contracts: [{
    name: "POST /point/add",
    protocol: "REST"
  }]
};
const postgresql: Component = {
  id: "postgresql",
  name: "PostgreSQL",
  type: "database",
  technology: "postgresql",
  capabilities: ["relational-storage", "durable-storage"]
};
const redisCache: Component = {
  id: "redis",
  name: "Redis",
  type: "cache",
  technology: "redis",
  capabilities: ["cache", "key-value"],
  limitations: ["not-primary-storage"]
};

const expected = architecture(
  [pointService, postgresql, redisCache],
  [{
    id: "point-service-to-postgresql",
    from: "point-service",
    to: "postgresql",
    protocol: "SQL"
  }]
);
const compliantActual = architecture(
  [pointService, postgresql, redisCache],
  [{
    id: "point-service-to-postgresql",
    from: "point-service",
    to: "postgresql",
    protocol: "database-client",
    description: "src/point/point.service.ts imports pg."
  }]
);

const validator = new ImplementationValidator();

// Test 1: fully compliant implementation.
const compliantReport = validator.validate({
  architecture: expected,
  implementation: implementationModel(compliantActual, {
    languages: ["TypeScript"],
    frameworks: ["NestJS"],
    databases: ["PostgreSQL", "Redis"],
    libraries: []
  })
});
assert.equal(compliantReport.passed, true);
assert.equal(compliantReport.issues.length, 0);

// Test 2: required component is missing.
const expectedWithUser = architecture([
  ...expected.architecture.components,
  {
    id: "user-service",
    name: "UserService",
    type: "service",
    capabilities: ["user-management"]
  }
], expected.architecture.connections);
const missingReport = validator.validate({
  architecture: expectedWithUser,
  implementation: implementationModel(compliantActual)
});
assert.equal(missingReport.passed, false);
assert.ok(missingReport.issues.some((issue) =>
  issue.id === "component.missing.user-service" && issue.severity === "ERROR"
));

// Test 3: infrastructure role exists but technology differs.
const mongodb: Component = {
  id: "mongodb",
  name: "MongoDB",
  type: "database",
  technology: "mongodb",
  capabilities: ["document-storage", "durable-storage"]
};
const mongoActual = architecture(
  [pointService, mongodb, redisCache],
  [{
    id: "point-service-to-mongodb",
    from: "point-service",
    to: "mongodb",
    protocol: "database-client",
    description: "Implementation Analyzer detected a MongoDB client import."
  }]
);
const technologyReport = validator.validate({
  architecture: expected,
  implementation: implementationModel(mongoActual, {
    languages: ["TypeScript"],
    frameworks: ["NestJS"],
    databases: ["MongoDB", "Redis"],
    libraries: []
  })
});
assert.equal(technologyReport.passed, true);
assert.ok(technologyReport.issues.some((issue) =>
  issue.id === "technology.deviation.postgresql" && issue.severity === "WARNING"
));
assert.ok(!technologyReport.issues.some((issue) => issue.id === "component.missing.postgresql"));

// Test 4: Redis is detected as authoritative primary storage.
const primaryRedis: Component = {
  ...redisCache,
  capabilities: ["cache", "source-of-truth"],
  logicalRole: "primary-storage"
};
const primaryRedisActual = architecture([pointService, postgresql, primaryRedis], expected.architecture.connections);
const constraintReport = validator.validate({
  architecture: expected,
  implementation: implementationModel(primaryRedisActual)
});
assert.equal(constraintReport.passed, false);
assert.ok(constraintReport.issues.some((issue) =>
  issue.id.startsWith("constraint.violation.redis") && issue.severity === "ERROR"
));

// Dependency and contract rules are independently observable.
const extraDependencyActual = architecture(
  compliantActual.architecture.components,
  [
    ...compliantActual.architecture.connections,
    {
      id: "point-service-to-redis",
      from: "point-service",
      to: "redis",
      protocol: "Redis protocol",
      description: "PointService directly imports Redis."
    }
  ]
);
const dependencyReport = validator.validate({
  architecture: expected,
  implementation: implementationModel(extraDependencyActual)
});
assert.ok(dependencyReport.issues.some((issue) =>
  issue.id === "dependency.unapproved.point-service.redis" && issue.severity === "WARNING"
));

const contractlessPoint: Component = { ...pointService, contracts: [] };
const contractlessActual = architecture(
  [contractlessPoint, postgresql, redisCache],
  compliantActual.architecture.connections
);
const contractReport = validator.validate({
  architecture: expected,
  implementation: implementationModel(contractlessActual)
});
assert.equal(contractReport.passed, false);
assert.ok(contractReport.issues.some((issue) =>
  issue.id.includes("contract.missing.point-service") && issue.severity === "ERROR"
));

for (const report of [missingReport, technologyReport, constraintReport, dependencyReport, contractReport]) {
  for (const issue of report.issues) {
    assert.ok(issue.description.length > 0);
    assert.ok(issue.architectureExpectation.length > 0);
    assert.ok(issue.implementationEvidence.length > 0);
    assert.ok(issue.recommendation.length > 0);
  }
}

const formatted = formatComplianceReport(contractReport);
assert.ok(formatted.includes("Implementation Compliance: FAILED"));
assert.ok(formatted.includes("Architecture expectation:"));
assert.ok(formatted.includes("Recommendation:"));

const customRule: ComplianceRule = {
  id: "custom-evidence",
  name: "Custom Evidence Rule",
  description: "Demonstrates the plugin rule contract.",
  validate: () => [{
    id: "custom.info",
    severity: "INFO",
    title: "Custom observation",
    description: "A custom compliance rule ran.",
    architectureExpectation: "Custom architecture expectation.",
    implementationEvidence: "Custom implementation evidence.",
    recommendation: "No action required."
  }]
};
const customReport = new ImplementationValidator([customRule]).validate({
  architecture: expected,
  implementation: implementationModel(compliantActual)
});
assert.equal(customReport.passed, true);
assert.equal(customReport.issues[0]?.severity, "INFO");

console.log("implementation-validator tests passed");

function architecture(
  components: readonly Component[],
  connections: ArchitectureProject["architecture"]["connections"] = []
): ArchitectureProject {
  return {
    version: "0.1",
    intent: {
      name: "PointSystem",
      purpose: ["Keep point implementation compliant with approved architecture."]
    },
    domain: { entities: [] },
    architecture: { components, connections },
    constraints: [],
    decisions: []
  };
}

function implementationModel(
  actual: ArchitectureProject,
  technology: TechnologyInfo = {
    languages: ["TypeScript"],
    frameworks: ["NestJS"],
    databases: ["PostgreSQL", "Redis"],
    libraries: []
  }
): ImplementationModel {
  const inspection: RepositoryInspection = {
    snapshot: {
      rootPath: "/example/point-system",
      files: ["src/point/point.service.ts"],
      languages: technology.languages,
      configFiles: ["package.json"],
      dependencies: []
    },
    technology,
    modules: actual.architecture.components
      .filter((component) => component.type === "service")
      .map((component) => ({
        id: component.id,
        name: component.name,
        path: `src/${component.id}`,
        files: [`src/${component.id}/${component.id}.ts`],
        confidence: 0.9,
        evidence: `Detected ${component.name}.`
      })),
    dependencyGraph: {
      moduleDependencies: [],
      externalDependencies: []
    }
  };
  return createImplementationModel(inspection, actual);
}
