import assert from "node:assert/strict";
import type { ArchitectureIR } from "@coding-cad/architecture-ir";
import { validateArchitecture } from "./validator.js";

const ir: ArchitectureIR = {
  schemaVersion: "0.1",
  project: {
    name: "PointSystem",
    requirements: {
      consistency: "strong"
    }
  },
  architecture: {
    components: [
      {
        id: "PointService",
        name: "PointService",
        kind: "backend-service",
        capabilities: ["point-ledger"]
      },
      {
        id: "RewardService",
        name: "RewardService",
        kind: "backend-service",
        capabilities: ["reward-policy"]
      },
      {
        id: "RedisStore",
        name: "RedisStore",
        kind: "database",
        technology: "Redis",
        logicalRole: "transactional-storage",
        capabilities: ["kv-storage"]
      },
      {
        id: "DocumentStore",
        name: "DocumentStore",
        kind: "database",
        technology: "MongoDB",
        logicalRole: "strong-transaction-boundary",
        capabilities: ["document-storage"]
      }
    ],
    connections: [
      {
        id: "point_to_reward",
        from: "PointService",
        to: "RewardService",
        protocol: "HTTP"
      },
      {
        id: "reward_to_point",
        from: "RewardService",
        to: "PointService",
        protocol: "HTTP"
      }
    ]
  }
};

const diagnostics = validateArchitecture(ir);

assert.equal(diagnostics.some((diagnostic) => diagnostic.id === "technology.redis-transactional-storage"), true);
assert.equal(diagnostics.some((diagnostic) => diagnostic.id === "technology.mongodb-strong-transaction-boundary"), true);
assert.equal(diagnostics.some((diagnostic) => diagnostic.id === "dependency.service-cycle"), true);

console.log("validator tests passed");
