import assert from "node:assert/strict";
import { generateDSL, parseDSL } from "@coding-cad/architecture-dsl";
import { ArchitectureValidator } from "@coding-cad/architecture-validator";
import { createComponentRegistry } from "@coding-cad/component-registry";

const source = `
version: "0.1"
project:
  name: IntegrationPointSystem
  intent:
    purpose:
      - Keep a strongly consistent point ledger.
    requirements:
      consistency: strong
domain:
  entities:
    - name: PointAccount
      fields:
        - name: balance
          type: Integer
          required: true
architecture:
  components:
    - id: point-service
      name: PointService
      type: service
      capabilities:
        - point-ledger
    - id: postgresql
      name: PostgreSQL
      type: database
      description: Primary source of truth for the point ledger.
      capabilities:
        - transaction
        - strong-consistency
  connections:
    - from: point-service
      to: postgresql
      protocol: SQL
constraints:
  - type: consistency
    value: strong
    description: Point balance updates must be strongly consistent.
decisions:
  - title: Use transactional storage
    context: Point balances must remain correct.
    decision: Use a transactional source of truth.
    rationale: The registry records transaction and strong-consistency capabilities.
`;

const project = parseDSL(source);
const registry = createComponentRegistry();
const validator = new ArchitectureValidator(undefined, { registry });
const result = validator.validate(project);

assert.equal(project.intent.name, "IntegrationPointSystem");
assert.equal(registry.get("postgresql")?.capabilities.some((item) => item.id === "transaction"), true);
assert.equal(result.valid, true);
assert.equal(result.issues.some((issue) => issue.severity === "ERROR"), false);

const roundTripped = parseDSL(generateDSL(project));
assert.deepEqual(roundTripped, project);

console.log("core pipeline integration tests passed");
