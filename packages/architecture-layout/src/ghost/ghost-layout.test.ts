import assert from "node:assert/strict";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { compileArchitectureProjection } from "../compiler/compiler.js";
import { layoutFixture } from "../compiler/test-fixture.js";
import { layoutArchitectureGraph } from "../incremental/incremental-layout.js";
import { createGhostLayoutProjection } from "./ghost-layout.js";

const acceptedProject = withoutRedis(layoutFixture);
const acceptedGraph = compileArchitectureProjection(acceptedProject).layoutGraph;
const acceptedLayout = await layoutArchitectureGraph(acceptedGraph);
const acceptedSnapshot = JSON.stringify(acceptedProject);
const stateSnapshot = JSON.stringify(acceptedLayout.state);
const proposedGraph = compileArchitectureProjection(layoutFixture).layoutGraph;

const first = createGhostLayoutProjection("proposal-redis", acceptedGraph, proposedGraph, acceptedLayout.state);
const second = createGhostLayoutProjection("proposal-redis", acceptedGraph, proposedGraph, acceptedLayout.state);
assert.deepEqual(second, first);
assert.deepEqual(first.nodes.map((node) => node.sourceId), ["redis"]);
assert.equal(first.nodes[0]?.id, "ghost:proposal-redis:node:redis");
assert.equal(first.edges[0]?.id, "ghost:proposal-redis:edge:orders-redis");
assert.equal(first.edges[0]?.from, "orders");
assert.equal(first.edges[0]?.to, "ghost:proposal-redis:node:redis");
assert.equal(JSON.stringify(acceptedProject), acceptedSnapshot, "Ghost projection must not modify accepted ArchitectureProject");
assert.equal(JSON.stringify(acceptedLayout.state), stateSnapshot, "Ghost projection must not modify accepted LayoutState");
assert.equal(first.nodes.every((node) => node.proposalId === "proposal-redis"), true);
assert.throws(() => createGhostLayoutProjection("", acceptedGraph, proposedGraph, acceptedLayout.state), /must not be empty/);

console.log("architecture-layout Ghost protocol tests passed");

function withoutRedis(project: ArchitectureProject): ArchitectureProject {
  return {
    ...project,
    architecture: {
      components: project.architecture.components.filter((component) => component.id !== "redis"),
      connections: project.architecture.connections.filter((connection) => connection.id !== "orders-redis")
    }
  };
}
