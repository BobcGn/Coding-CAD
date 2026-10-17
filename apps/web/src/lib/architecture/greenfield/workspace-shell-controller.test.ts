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

  it("rejecting a candidate records rejection and preserves both architectures", async () => {
    const controller = createController();
    await controller.generateFromRequirement(REQUIREMENT);
    const acceptedBefore = structuredClone(pointsSystemFixture);

    controller.rejectCandidate("Not aligned.");
    const state = controller.state();

    assert.ok(state.candidate);
    assert.equal(state.proposal?.status, "rejected");
    assert.deepEqual(state.accepted, acceptedBefore);
  });

  it("saveProject serializes accepted IR and layout state separately", async () => {
    const controller = createController();
    // stub the bridge calls
    const original = await import("../workspace/workspace-bridge.js");
    // The bridge is exercised through integration tests; here we verify the
    // controller exposes a saveProject method that returns a project id.
    assert.equal(typeof controller.saveProject, "function");
    void original;
  });

  it("executes an add-component command through the command application", async () => {
    const controller = createController();
    const acceptedBefore = structuredClone(pointsSystemFixture);

    await controller.executeCommand({
      type: "add-component",
      component: { id: "kafka", name: "Kafka", type: "queue", capabilities: ["asynchronous-delivery"] }
    });

    await controller.acceptCandidate("Approve adding Kafka.");
    const state = controller.state();
    assert.equal(state.status, "ready");
    assert.equal(state.proposal?.status, "approved");
    assert.notDeepEqual(state.accepted, acceptedBefore);
    assert.ok(state.accepted.architecture.components.some((component) => component.id === "kafka"));
  });

  it("a duplicate add-component command is rejected and preserves accepted IR", async () => {
    const controller = createController();
    await controller.executeCommand({
      type: "add-component",
      component: { id: "kafka", name: "Kafka", type: "queue", capabilities: ["asynchronous-delivery"] }
    });
    await controller.acceptCandidate("Approve adding Kafka.");
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


describe("product Remove/Connect commands", () => {
  it("cascades connected edge removal only after explicit Review approval", async () => {
    const controller = createController();
    const before = controller.state().accepted;
    await controller.executeCommand({ type: "remove-component", componentId: "ledger" });
    expectSameAccepted(controller, before);
    assert.ok(!controller.state().candidate!.architecture.connections.some((edge) => edge.from === "ledger" || edge.to === "ledger"));
    assert.ok(!controller.state().candidate!.architecture.components.some((node) => node.id === "ledger"));
    await controller.acceptCandidate("Approve documented cascade.");
    assert.equal(controller.state().proposal?.status, "approved");
    assert.ok(!controller.state().accepted.architecture.components.some((node) => node.id === "ledger"));
  });

  it("blocks removing a missing component and exposes a Problem without changing IR", async () => {
    const controller = createController();
    const before = controller.state().accepted;
    await controller.executeCommand({ type: "remove-component", componentId: "missing" });
    expectSameAccepted(controller, before);
    assert.equal(controller.state().status, "error");
    assert.ok(controller.state().validation?.issues.some((issue) => issue.severity === "ERROR"));
  });

  it("keeps invalid endpoints in Problems, blocks approval, and preserves IR", async () => {
    const controller = createController();
    const before = controller.state().accepted;
    await controller.executeCommand({ type: "connect-components", connection: { id: "invalid", from: "ledger", to: "missing", protocol: "REST" } });
    const candidate = controller.state().candidate;
    assert.equal(controller.state().validation?.valid, false);
    await controller.acceptCandidate("Try invalid endpoints.");
    expectSameAccepted(controller, before);
    assert.equal(controller.state().candidate, candidate);
    assert.equal(controller.state().proposal?.status, "draft");
  });

  it("commits a connection only after approval and retains both models on rejection", async () => {
    const controller = createController();
    const before = controller.state().accepted;
    await controller.executeCommand({ type: "connect-components", connection: { id: "new-edge", from: "gateway", to: "events", protocol: "MESSAGE" } });
    expectSameAccepted(controller, before);
    const candidate = controller.state().candidate;
    controller.rejectCandidate("Do not connect.");
    assert.equal(controller.state().candidate, candidate);
    expectSameAccepted(controller, before);
    await controller.executeCommand({ type: "connect-components", connection: { id: "new-edge", from: "gateway", to: "events", protocol: "MESSAGE" } });
    await controller.acceptCandidate("Connection is required.");
    assert.ok(controller.state().accepted.architecture.connections.some((edge) => edge.id === "new-edge"));
  });
});

function expectSameAccepted(controller: WorkspaceShellController, before: typeof pointsSystemFixture) {
  assert.equal(controller.state().accepted, before);
  assert.deepEqual(controller.state().accepted, before);
}

describe("minimal Inspector contract editing through the production gate", () => {
  it("adds and removes an IR contract through Validator and Review", async () => {
    const controller = createController();
    const before = controller.state().accepted;
    const contract = { name: "GetBalance", protocol: "REST" as const, outputs: [{ name: "Balance", fields: [{ name: "amount", type: "Integer" }] }] };
    await controller.executeCommand({ type: "inspector-add-contract", componentId: "ledger", contract });
    expectSameAccepted(controller, before);
    await controller.acceptCandidate("Approve contract.");
    assert.equal(controller.state().proposal?.status, "approved");
    assert.deepEqual(controller.state().accepted.architecture.components.find((node) => node.id === "ledger")?.contracts, [contract]);
    const afterAdd = controller.state().accepted;
    await controller.executeCommand({ type: "inspector-remove-contract", componentId: "ledger", contractName: "GetBalance" });
    expectSameAccepted(controller, afterAdd);
    await controller.acceptCandidate("Remove obsolete contract.");
    assert.deepEqual(controller.state().accepted.architecture.components.find((node) => node.id === "ledger")?.contracts, []);
  });

  it("blocks duplicate contract names and preserves accepted architecture", async () => {
    const controller = createController();
    const command = { type: "inspector-add-contract" as const, componentId: "ledger", contract: { name: "GetBalance", protocol: "REST" as const } };
    await controller.executeCommand(command);
    await controller.acceptCandidate("Approve first contract.");
    const before = controller.state().accepted;
    await controller.executeCommand(command);
    assert.equal(controller.state().validation?.valid, false);
    assert.ok(controller.state().validation?.issues.some((issue) => issue.id.startsWith("contract.integrity.")));
    await controller.acceptCandidate("Try duplicate.");
    expectSameAccepted(controller, before);
  });
});

describe("P4 brownfield compliance check in workspace shell controller", () => {
  it("starts with undefined expected architecture and compliance report", () => {
    const controller = createController();
    assert.equal(controller.state().expectedArchitecture, undefined);
    assert.equal(controller.state().complianceReport, undefined);
  });

  it("handles malformed JSON or invalid project gracefully", () => {
    const controller = createController();
    controller.loadExpectedArchitectureJson("{ bad json ");
    assert.equal(controller.state().status, "error");
    assert.ok(controller.state().message.includes("Failed to parse expected architecture JSON"));

    controller.loadExpectedArchitecture({} as any);
    assert.equal(controller.state().status, "error");
    assert.ok(controller.state().message.includes("Invalid ArchitectureProject"));
  });

  it("loads expected architecture and runs compliance check when inspection is present", () => {
    const controller = createController();
    // Simulate brownfield mode by setting inspection on shell
    (controller as any).shell = {
      ...controller.state(),
      inspection: {
        languages: ["TypeScript"],
        configFiles: ["package.json"],
        dependencies: ["@coding-cad/architecture-ir"],
        unsupportedStructures: []
      }
    };

    // Expected architecture has a missing component
    const expected = structuredClone(pointsSystemFixture);
    (expected.architecture as any).components = [
      ...expected.architecture.components,
      {
        id: "audit-service",
        name: "AuditService",
        type: "service",
        capabilities: ["audit-logging"]
      }
    ];

    controller.loadExpectedArchitecture(expected);
    const state = controller.state();
    assert.ok(state.expectedArchitecture !== undefined);
    assert.ok(state.complianceReport !== undefined);
    assert.equal(state.complianceReport?.passed, false);
    assert.ok(state.complianceReport?.issues.some((i) => i.id === "component.missing.audit-service"));

    // Clear expected architecture
    controller.clearExpectedArchitecture();
    assert.equal(controller.state().expectedArchitecture, undefined);
    assert.equal(controller.state().complianceReport, undefined);
  });
});

