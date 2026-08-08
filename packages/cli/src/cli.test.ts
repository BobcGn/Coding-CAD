import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const fixtureDir = mkdtempSync(join(tmpdir(), "coding-cad-cli-"));

const validPath = join(fixtureDir, "valid.yaml");
writeFileSync(validPath, `
version: "0.1"
project:
  name: PointSystem
  intent:
    purpose:
      - Reward users with auditable points.
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
    - id: postgres
      name: PostgreSQL
      type: database
      description: Source of truth for point balances.
      capabilities:
        - transaction
        - strong-consistency
  connections:
    - from: point-service
      to: postgres
      protocol: SQL
constraints:
  - type: consistency
    value: strong
    description: Point balances must be consistent.
decisions:
  - title: Use PostgreSQL
    context: Point balances require consistency.
    decision: Use transactional storage.
    rationale: PostgreSQL supports transaction and strong consistency.
`);

const warningPath = join(fixtureDir, "warning.yaml");
writeFileSync(warningPath, `
version: "0.1"
project:
  name: CacheAsTruth
  intent:
    purpose:
      - Demonstrate warning output.
domain:
  entities:
    - name: Session
      fields:
        - name: id
          type: String
architecture:
  components:
    - id: redis
      name: Redis
      type: database
      description: Primary source of truth for temporary session state.
      capabilities:
        - cache
  connections: []
constraints: []
decisions: []
`);

const invalidPath = join(fixtureDir, "invalid.yaml");
writeFileSync(invalidPath, `
version: "0.1"
project:
  name: Broken
  intent:
    purpose:
      - Missing component name.
domain:
  entities:
    - name: BrokenEntity
      fields:
        - name: id
          type: String
architecture:
  components:
    - id: broken
      type: service
`);

const validResult = runCliProcess(["validate", validPath]);
assert.equal(validResult.status, 0);
assert.equal(validResult.stdout.includes("Coding CAD Validation Report"), true);
assert.equal(validResult.stdout.includes("Errors: 0"), true);

const warningResult = runCliProcess(["validate", warningPath]);
assert.equal(warningResult.status, 0);
assert.equal(warningResult.stdout.includes("WARNING"), true);
assert.equal(warningResult.stdout.includes("primary storage"), true);

const invalidResult = runCliProcess(["validate", invalidPath]);
assert.equal(invalidResult.status, 1);
assert.equal(invalidResult.stderr.includes("Architecture DSL Error"), true);
assert.equal(invalidResult.stderr.includes("architecture.components[0].name: missing field"), true);
assert.equal(invalidResult.stderr.includes("at "), false);

const inspectResult = runCliProcess(["inspect", validPath]);
assert.equal(inspectResult.status, 0);
assert.equal(inspectResult.stdout.includes("Databases:"), true);
assert.equal(inspectResult.stdout.includes("- PostgreSQL"), true);

const formatResult = runCliProcess(["format", validPath]);
assert.equal(formatResult.status, 0);
assert.equal(formatResult.stdout.includes("version: \"0.1\""), true);

const jsonResult = runCliProcess(["validate", warningPath, "--json"]);
assert.equal(jsonResult.status, 0);
assert.equal(JSON.parse(jsonResult.stdout).issues[0].severity, "WARNING");

console.log("cli tests passed");

function runCliProcess(args: readonly string[]): { readonly status: number | null; readonly stdout: string; readonly stderr: string } {
  const result = spawnSync(process.execPath, [join("dist", "index.js"), ...args], {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8"
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr
  };
}
