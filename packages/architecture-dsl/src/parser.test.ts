import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { ArchitectureDSLError, generateDSL, parseDSL } from "./index.js";

const currentDir = dirname(fileURLToPath(import.meta.url));
const examplePath = join(currentDir, "..", "src", "examples", "point-system.yaml");
const source = readFileSync(examplePath, "utf8");

const project = parseDSL(source);

assert.equal(project.version, "0.1");
assert.equal(project.intent.name, "PointSystem");
assert.equal(project.intent.requirements?.consistency, "strong");
assert.equal(project.domain.entities.some((entity) => entity.name === "PointAccount"), true);
assert.equal(project.architecture.components.some((component) => component.id === "postgres"), true);
assert.equal(project.architecture.connections.length, 3);
assert.equal(project.constraints[0]?.type, "consistency");
assert.equal(project.decisions[0]?.title, "Use PostgreSQL");

const generated = generateDSL(project);
const reparsed = parseDSL(generated);
assert.equal(reparsed.intent.name, project.intent.name);
assert.equal(reparsed.architecture.components.length, project.architecture.components.length);
assert.equal(reparsed.architecture.components[0]?.contracts?.[0]?.inputs?.[0]?.fields?.[0]?.name, "userId");

const minimalProject: ArchitectureProject = {
  version: "0.1",
  intent: {
    name: "Minimal",
    purpose: ["Show generator output."]
  },
  domain: {
    entities: [
      {
        name: "Thing",
        fields: [
          {
            name: "id",
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
        id: "service",
        name: "Service",
        type: "service",
        capabilities: ["business-workflow"]
      }
    ],
    connections: []
  },
  constraints: [],
  decisions: []
};

assert.equal(parseDSL(generateDSL(minimalProject)).intent.name, "Minimal");

assert.throws(
  () => parseDSL(`
version: "0.1"
project:
  name: Broken
  intent:
    purpose:
      - missing component name
domain:
  entities:
    - name: BrokenEntity
      fields:
        - name: id
          type: String
architecture:
  components:
    - id: broken-component
      type: service
`),
  (error) => {
    assert.equal(error instanceof ArchitectureDSLError, true);
    assert.equal(String(error).includes("architecture.components[0].name: missing field"), true);
    return true;
  }
);

console.log("architecture-dsl tests passed");
