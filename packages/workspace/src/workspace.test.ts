import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { ArchitectureValidator } from "@coding-cad/architecture-validator";
import { generateExecutionBlueprint } from "@coding-cad/execution-blueprint";
import { Workspace } from "./workspace.js";

const initialArchitecture: ArchitectureProject = {
  version: "0.1",
  intent: {
    name: "LifecycleSystem",
    purpose: ["Exercise architecture lifecycle management."]
  },
  domain: { entities: [] },
  architecture: {
    components: [
      {
        id: "api",
        name: "API",
        type: "service",
        capabilities: ["request-handling"]
      },
      {
        id: "store",
        name: "Store",
        type: "database",
        capabilities: ["durable-storage"]
      }
    ],
    connections: [
      {
        id: "api-to-store",
        from: "api",
        to: "store",
        protocol: "SQL",
        description: "Persist API state."
      }
    ]
  },
  constraints: [
    {
      type: "availability",
      description: "The API should reach 99.9% availability.",
      value: "99.9%"
    }
  ],
  decisions: []
};

const evolvedArchitecture: ArchitectureProject = {
  ...initialArchitecture,
  architecture: {
    components: [
      initialArchitecture.architecture.components[0]!,
      {
        id: "cache",
        name: "Cache",
        type: "cache",
        capabilities: ["low-latency-read"]
      }
    ],
    connections: [
      {
        id: "api-to-store",
        from: "api",
        to: "cache",
        protocol: "Redis protocol",
        description: "Read derived state."
      }
    ]
  },
  constraints: [
    {
      type: "availability",
      description: "The API must reach 99.99% availability.",
      value: "99.99%"
    }
  ]
};

const directory = await mkdtemp(path.join(tmpdir(), "coding-cad-workspace-"));
let idIndex = 0;

try {
  const workspace = await Workspace.create(directory, initialArchitecture, {
    clock: () => new Date("2026-08-09T00:00:00.000Z"),
    idGenerator: () => `record-${++idIndex}`
  });

  assert.equal(workspace.name, "LifecycleSystem");
  assert.equal(workspace.latestVersion, 1);
  assert.deepEqual(workspace.loadLatestArchitecture(), initialArchitecture);

  const secondSnapshot = await workspace.saveSnapshot(evolvedArchitecture);
  assert.equal(secondSnapshot.version, 2);
  assert.deepEqual(workspace.loadLatestArchitecture(), evolvedArchitecture);

  const diff = workspace.compareVersions(1, 2);
  assert.deepEqual(diff.components.added.map((component) => component.id), ["cache"]);
  assert.deepEqual(diff.components.removed.map((component) => component.id), ["store"]);
  assert.equal(diff.components.changed.length, 0);
  assert.equal(diff.connections.changed.length, 1);
  assert.equal(diff.connections.changed[0]?.after.to, "cache");
  assert.equal(diff.constraints.changed.length, 1);
  assert.equal(diff.constraints.changed[0]?.after.value, "99.99%");

  const adr = await workspace.addDecision({
    title: "Add a derived read cache",
    context: "Read latency has become a product constraint.",
    decision: "Serve derived reads from a cache while preserving the durable source of truth.",
    alternatives: ["Scale durable storage reads only"],
    rationale: "The cache isolates read traffic without becoming authoritative storage."
  });
  assert.equal(adr.architectureVersion, 2);
  assert.equal(adr.status, "accepted");

  const validation = new ArchitectureValidator().validate(evolvedArchitecture);
  const blueprint = generateExecutionBlueprint(evolvedArchitecture, { validationResult: validation });
  await workspace.recordValidation(validation);
  await workspace.recordBlueprint(blueprint);

  const report = workspace.exportReport();
  assert.equal(report.latestVersion, 2);
  assert.equal(report.snapshots.length, 2);
  assert.equal(report.decisions.length, 1);
  assert.equal(report.validationHistory.length, 1);
  assert.equal(report.blueprintHistory.length, 1);
  assert.deepEqual(report.currentArchitecture, evolvedArchitecture);

  const reopened = await Workspace.open(directory);
  assert.equal(reopened.latestVersion, 2);
  assert.deepEqual(reopened.loadLatestArchitecture(), evolvedArchitecture);
  assert.equal(reopened.exportReport().decisions[0]?.decision.title, "Add a derived read cache");

  const stored = JSON.parse(await readFile(path.join(directory, "workspace.json"), "utf8")) as {
    formatVersion: number;
    snapshots: unknown[];
  };
  assert.equal(stored.formatVersion, 1);
  assert.equal(stored.snapshots.length, 2);

  await assert.rejects(
    () => Workspace.create(directory, initialArchitecture),
    /already exists/
  );
} finally {
  await rm(directory, { recursive: true, force: true });
}

console.log("workspace tests passed");
