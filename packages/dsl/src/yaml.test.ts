import assert from "node:assert/strict";
import { parseArchitectureYaml } from "./yaml.js";

const source = `
project:
  name: PointSystem
  mission: Reward users with auditable points.
  scale:
    users: 100000
    peak_qps: 1000
  requirements:
    consistency: strong

domain:
  entities:
    PointAccount:
      fields:
        balance:
          type: Integer
          required: true

architecture:
  components:
    PointService:
      type: backend-service
      capabilities:
        - point-ledger
      interfaces:
        PointCommandApi:
          direction: provided
          protocol: HTTP
    Database:
      type: database
      technology: PostgreSQL
      logical_role: transactional-storage
      capabilities:
        - strong-transaction
  connections:
    - from: PointService
      to: Database
      protocol: SQL

technology_bindings:
  - logical_role: transactional-storage
    technology: PostgreSQL
    component_id: Database
    rationale: Point balance changes need strong consistency.

evolution:
  phases:
    - id: Phase1
      name: PostgreSQL first
      changes:
        - type: add
          target: Database
          description: Use PostgreSQL as the initial system of record.
`;

const ir = parseArchitectureYaml(source);

assert.equal(ir.project.name, "PointSystem");
assert.equal(ir.project.requirements?.consistency, "strong");
assert.equal(ir.project.scale?.peakQps, 1000);
assert.equal(ir.domain?.entities?.[0]?.name, "PointAccount");
assert.equal(ir.architecture.components.length, 2);
assert.equal(ir.technologyBindings?.[0]?.componentId, "Database");
assert.equal(ir.evolution?.phases[0]?.id, "Phase1");

console.log("dsl yaml tests passed");
