import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { ArchitectureReview } from "@coding-cad/architecture-review";
import { pointsSystemFixture } from "../projection/points-system-fixture.js";
import { CandidateFlow } from "./candidate-flow.js";
import { WorkspaceShellController } from "./workspace-shell-controller.js";

const REQUIREMENT = "设计一个积分系统。100万用户。积分不能丢失。未来支持活动兑换。";

function createController(accepted = pointsSystemFixture): WorkspaceShellController {
  return new WorkspaceShellController(accepted, {
    flow: new CandidateFlow({
      review: new ArchitectureReview({
        clock: () => new Date("2026-08-15T00:00:00.000Z"),
        idGenerator: (() => { let id = 0; return () => `proposal-${++id}`; })()
      })
    }),
    engineFactory: () => ({
      layout: async () => ({
        status: "success" as const,
        direction: "LR" as const,
        size: { width: 800, height: 600 },
        nodes: [],
        edges: [],
        diagnostics: []
      }),
      dispose: () => undefined
    })
  });
}

describe("P3.3 workspace shell controller", () => {
  it("starts idle with the accepted baseline and no selection", () => {
    const controller = createController();
    const state = controller.state();
    assert.equal(state.status, "idle");
    assert.deepEqual(state.accepted, pointsSystemFixture);
    assert.deepEqual(state.selectedNodeIds, []);
  });

  it("generates a candidate without mutating accepted IR", async () => {
    const controller = createController();
    const acceptedBefore = structuredClone(pointsSystemFixture);

    await controller.generateFromRequirement(REQUIREMENT);
    const state = controller.state();

    assert.equal(state.status, "ready");
    assert.ok(state.candidate !== undefined);
    assert.ok(state.validation !== undefined);
    assert.ok(state.proposal !== undefined);
    assert.deepEqual(state.accepted, acceptedBefore);
  });

  it("rejects an empty requirement with an error status", async () => {
    const controller = createController();
    await controller.generateFromRequirement("   ");
    const state = controller.state();
    assert.equal(state.status, "error");
    assert.ok(state.message.includes("empty"));
  });

  it("selecting nodes only updates UI state, not architecture", async () => {
    const controller = createController();
    controller.selectNodeIds(["gateway"]);
    const state = controller.state();
    assert.deepEqual(state.selectedNodeIds, ["gateway"]);
    assert.deepEqual(state.accepted, pointsSystemFixture);
  });

  it("rejecting a candidate clears it and keeps accepted IR", async () => {
    const controller = createController();
    await controller.generateFromRequirement(REQUIREMENT);
    const acceptedBefore = structuredClone(pointsSystemFixture);

    controller.rejectCandidate();
    const state = controller.state();

    assert.equal(state.candidate, undefined);
    assert.equal(state.proposal, undefined);
    assert.deepEqual(state.accepted, acceptedBefore);
  });

  it("executes an add-component command through the command application", async () => {
    const controller = createController();
    const acceptedBefore = structuredClone(pointsSystemFixture);

    await controller.executeCommand({
      type: "add-component",
      component: { id: "kafka", name: "Kafka", type: "queue", capabilities: ["asynchronous-delivery"] }
    });

    const state = controller.state();
    assert.equal(state.status, "ready");
    assert.ok(state.message.includes("Add component kafka"));
    assert.notDeepEqual(state.accepted, acceptedBefore);
    assert.ok(state.accepted.architecture.components.some((component) => component.id === "kafka"));
  });

  it("a duplicate add-component command is rejected and preserves accepted IR", async () => {
    const controller = createController();
    await controller.executeCommand({
      type: "add-component",
      component: { id: "kafka", name: "Kafka", type: "queue", capabilities: ["asynchronous-delivery"] }
    });
    const acceptedAfterFirst = structuredClone(controller.state().accepted);

    await controller.executeCommand({
      type: "add-component",
      component: { id: "kafka", name: "Kafka", type: "queue", capabilities: ["asynchronous-delivery"] }
    });

    const state = controller.state();
    assert.equal(state.status, "error");
    assert.deepEqual(state.accepted, acceptedAfterFirst);
  });
});
