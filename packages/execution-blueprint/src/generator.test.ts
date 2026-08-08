import assert from "node:assert/strict";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { generateExecutionBlueprint } from "./generator.js";

const pointSystem: ArchitectureProject = {
  version: "0.1",
  intent: {
    name: "PointSystem",
    purpose: ["Track durable point balances for users."],
    requirements: {
      consistency: "strong",
      extensibility: "high"
    }
  },
  domain: {
    entities: [
      {
        name: "User",
        fields: [
          {
            name: "userId",
            type: "UserId",
            required: true
          }
        ]
      },
      {
        name: "PointAccount",
        fields: [
          {
            name: "balance",
            type: "Integer",
            required: true
          }
        ],
        invariants: ["Balance changes must be derived from durable point transactions."]
      }
    ]
  },
  architecture: {
    components: [
      {
        id: "point-service",
        name: "PointService",
        type: "service",
        capabilities: ["domain-service", "transactional-command-handling"],
        logicalRole: "point-ledger-owner"
      },
      {
        id: "postgresql",
        name: "PostgreSQL",
        type: "database",
        technology: "postgresql",
        capabilities: ["transaction", "relational-storage", "strong-consistency", "source-of-truth"],
        logicalRole: "primary-storage"
      },
      {
        id: "redis",
        name: "Redis",
        type: "cache",
        technology: "redis",
        capabilities: ["cache", "key-value", "high-performance-read"],
        limitations: ["not-primary-storage"],
        logicalRole: "read-cache"
      }
    ],
    connections: [
      {
        id: "point-service-to-postgresql",
        from: "point-service",
        to: "postgresql",
        protocol: "SQL",
        description: "Persist point accounts and transactions in durable storage."
      },
      {
        id: "point-service-to-redis",
        from: "point-service",
        to: "redis",
        protocol: "Redis protocol",
        description: "Read and refresh derived point summaries."
      }
    ]
  },
  constraints: [
    {
      type: "consistency",
      description: "Point balance must be strongly consistent.",
      value: "strong"
    }
  ],
  decisions: [
    {
      title: "Use PostgreSQL for point ledger",
      context: "Point transactions cannot be lost.",
      decision: "Use PostgreSQL as the transactional source of truth for point accounts and point transactions.",
      alternatives: ["Use Redis as primary storage"],
      rationale: "Point transactions require atomic updates, durability, and strong consistency."
    },
    {
      title: "Use Redis only as cache",
      context: "High read volume needs acceleration.",
      decision: "Use Redis for derived read models, not authoritative balances.",
      alternatives: ["Serve every read from PostgreSQL"],
      rationale: "Redis is useful for hot reads but should not own durable ledger truth."
    }
  ]
};

const blueprint = generateExecutionBlueprint(pointSystem);

assert.equal(blueprint.projectName, "PointSystem");
assert.equal(blueprint.architectureReference, "PointSystem@architecture-ir:0.1");

assert.ok(blueprint.tasks.some((task) => task.title === "Create PointService"));
assert.ok(blueprint.tasks.some((task) => task.title === "Create Point repository"));
assert.ok(blueprint.tasks.some((task) => task.title === "Implement transaction logic"));
assert.ok(blueprint.tasks.some((task) => task.title === "Add Redis cache integration"));

assert.ok(blueprint.constraints.some((constraint) =>
  constraint.source === "architecture-decision"
  && constraint.description.includes("PostgreSQL")
));
assert.ok(blueprint.constraints.some((constraint) =>
  constraint.source === "component-limitation"
  && constraint.description.includes("not-primary-storage")
));

assert.ok(blueprint.agentGuide.systemContext.includes("external Coding Agent"));
assert.ok(blueprint.agentGuide.architectureSummary.includes("PointSystem"));
assert.ok(blueprint.agentGuide.decisions.some((decision) => decision.includes("Use PostgreSQL")));
assert.ok(blueprint.agentGuide.forbiddenChanges.some((change) => change.includes("Architecture IR")));
assert.ok(blueprint.agentGuide.acceptanceCriteria.some((criterion) => criterion.includes("Architecture Decisions")));

console.log("execution-blueprint tests passed");
