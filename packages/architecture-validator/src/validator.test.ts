import assert from "node:assert/strict";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { ArchitectureValidator } from "./index.js";

function createPointSystem(storageName: "PostgreSQL" | "Redis"): ArchitectureProject {
  const storageId = storageName.toLowerCase();

  return {
    version: "0.1",
    intent: {
      name: "PointSystem",
      purpose: ["Reward users with auditable points."],
      scale: {
        users: 100000
      },
      requirements: {
        consistency: "strong",
        latencyMs: 200
      }
    },
    domain: {
      entities: [
        {
          name: "PointAccount",
          description: "Owns the current point balance for one user.",
          fields: [
            {
              name: "balance",
              type: "Integer",
              required: true
            }
          ],
          invariants: ["Balance must never be corrupted."]
        },
        {
          name: "PointTransaction",
          description: "Auditable point balance change.",
          fields: [
            {
              name: "amount",
              type: "Integer",
              required: true
            }
          ]
        }
      ]
    },
    architecture: {
      components: [
        {
          id: "point-service",
          name: "Point Service",
          description: "Owns point commands.",
          type: "service",
          capabilities: ["point-ledger"]
        },
        {
          id: storageId,
          name: storageName,
          description: "Primary source of truth for point balance ledger.",
          type: "database",
          capabilities: ["transaction", "strong-consistency", "ledger"]
        }
      ],
      connections: [
        {
          id: "point-service-to-storage",
          from: "point-service",
          to: storageId,
          protocol: "SQL",
          description: "Persist point balance and transaction records."
        }
      ]
    },
    constraints: [
      {
        type: "consistency",
        description: "Point balance updates must be strongly consistent.",
        value: "strong"
      }
    ],
    decisions: [
      {
        title: "Use durable source of truth for point ledger",
        context: "Point balances require correctness.",
        decision: `Use ${storageName} for point ledger storage.`,
        rationale: "The storage component must support transactional correctness."
      }
    ]
  };
}

const validator = new ArchitectureValidator();

const validResult = validator.validate(createPointSystem("PostgreSQL"));
assert.equal(validResult.valid, true);
assert.equal(validResult.issues.some((issue) => issue.severity === "ERROR"), false);

const redisResult = validator.validate(createPointSystem("Redis"));
assert.equal(redisResult.valid, false);
assert.equal(redisResult.issues.some((issue) => issue.severity === "ERROR"), true);
assert.equal(redisResult.issues.some((issue) => issue.title.includes("primary storage")), true);

const cyclicProject: ArchitectureProject = {
  ...createPointSystem("PostgreSQL"),
  architecture: {
    components: [
      {
        id: "service-a",
        name: "Service A",
        type: "service",
        capabilities: ["workflow-a"]
      },
      {
        id: "service-b",
        name: "Service B",
        type: "service",
        capabilities: ["workflow-b"]
      }
    ],
    connections: [
      {
        id: "a-to-b",
        from: "service-a",
        to: "service-b",
        protocol: "REST"
      },
      {
        id: "b-to-a",
        from: "service-b",
        to: "service-a",
        protocol: "REST"
      }
    ]
  }
};

const cycleResult = validator.validate(cyclicProject);
assert.equal(cycleResult.valid, false);
assert.equal(cycleResult.issues.some((issue) => issue.id.startsWith("dependency.circular")), true);

const malformedGraphProject: ArchitectureProject = {
  ...createPointSystem("PostgreSQL"),
  architecture: {
    components: [
      ...createPointSystem("PostgreSQL").architecture.components,
      {
        id: "postgresql",
        name: "Duplicate Store",
        type: "database",
        capabilities: ["transaction"]
      }
    ],
    connections: [
      {
        id: "missing-source-to-storage",
        from: "missing-service",
        to: "postgresql",
        protocol: "SQL"
      },
      {
        id: "service-to-missing-target",
        from: "point-service",
        to: "missing-storage",
        protocol: "SQL"
      }
    ]
  }
};

const malformedGraphResult = validator.validate(malformedGraphProject);
assert.equal(malformedGraphResult.valid, false);
assert.equal(malformedGraphResult.issues.some((issue) => issue.id.includes("duplicate-component")), true);
assert.equal(malformedGraphResult.issues.some((issue) => issue.id.includes("missing-source")), true);
assert.equal(malformedGraphResult.issues.some((issue) => issue.id.includes("missing-target")), true);
assert.equal(malformedGraphResult.issues.every((issue) => issue.description.length > 0), true);
assert.equal(malformedGraphResult.issues.every((issue) => issue.suggestion !== undefined), true);

console.log("architecture-validator tests passed");
