import assert from "node:assert/strict";
import type { ArchitectureProject } from "./index.js";

const pointSystem: ArchitectureProject = {
  version: "0.1",
  intent: {
    name: "PointSystem",
    purpose: [
      "Reward users with auditable points.",
      "Keep point balance changes strongly consistent."
    ],
    scale: {
      users: 100000,
      peakQps: 1000
    },
    requirements: {
      consistency: "strong",
      availability: "99.9%",
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
            name: "userId",
            type: "UserId",
            required: true
          },
          {
            name: "balance",
            type: "Integer",
            required: true
          }
        ],
        relations: [
          {
            name: "transactions",
            targetEntity: "PointTransaction",
            type: "one-to-many"
          }
        ]
      },
      {
        name: "PointTransaction",
        description: "Auditable record of one point balance change.",
        fields: [
          {
            name: "amount",
            type: "Integer",
            required: true
          },
          {
            name: "reason",
            type: "String",
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
        description: "Owns point account commands and transaction history.",
        type: "service",
        capabilities: ["transactional-command-handling", "point-ledger"],
        limitations: ["does-not-render-ui"],
        contracts: [
          {
            name: "AddPoint",
            protocol: "REST",
            inputs: [
              {
                name: "AddPointRequest",
                fields: [
                  {
                    name: "userId",
                    type: "UserId",
                    required: true
                  },
                  {
                    name: "amount",
                    type: "Integer",
                    required: true
                  }
                ]
              }
            ],
            outputs: [
              {
                name: "PointResult",
                fields: [
                  {
                    name: "balance",
                    type: "Integer",
                    required: true
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: "ledger-store",
        name: "Ledger Store",
        description: "Durable system of record for point transactions.",
        type: "database",
        capabilities: ["transactional-storage", "durable-ledger"],
        limitations: ["not-a-cache"]
      }
    ],
    connections: [
      {
        id: "point-service-to-ledger-store",
        from: "point-service",
        to: "ledger-store",
        protocol: "SQL",
        description: "Persist point account mutations and transaction records."
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
      title: "Use transactional storage for point ledger",
      context: "Point transactions require correctness before scale-out complexity.",
      decision: "Store point ledger data in a transactional storage component.",
      alternatives: ["Use cache as primary ledger"],
      rationale: "Cache-first storage cannot provide the required durability and consistency boundary."
    }
  ],
  evolution: {
    phases: [
      {
        name: "V1",
        description: "Launch with a service and transactional ledger store.",
        changes: ["Create Point Service", "Create Ledger Store"]
      },
      {
        name: "V2",
        description: "Add read cache when query load exceeds target.",
        changes: ["Add read cache component"]
      }
    ]
  }
};

const serialized = JSON.stringify(pointSystem);
const parsed = JSON.parse(serialized) as ArchitectureProject;

assert.equal(pointSystem.intent.name, "PointSystem");
assert.equal(pointSystem.domain.entities[0]?.name, "PointAccount");
assert.equal(pointSystem.architecture.components[0]?.type, "service");
assert.equal(pointSystem.architecture.connections[0]?.from, "point-service");
assert.equal(pointSystem.constraints[0]?.type, "consistency");
assert.equal(parsed.decisions[0]?.rationale.includes("durability"), true);

console.log("architecture-ir project tests passed");
