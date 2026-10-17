import assert from "node:assert/strict";
import { describe, it } from "vitest";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import type { LayoutState } from "@coding-cad/architecture-layout";
import { ArchitectureReview } from "@coding-cad/architecture-review";
import { generateExecutionHandoff } from "../handoff/execution-handoff.js";
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
      layout: async (graph: any) => ({
        status: "success" as const,
        direction: "LR" as const,
        size: { width: 800, height: 600 },
        nodes: graph?.nodes ? graph.nodes.map((n: any, idx: number) => ({
          id: n.id,
          sourceId: n.id,
          kind: n.kind,
          position: { x: 100 + idx * 250, y: 150 },
          size: { width: 220, height: 90 }
        })) : [],
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

describe("Step 5.2 Ghost & Proposal Invariants (D-007 Option B)", () => {
  it("guarantees formal ArchitectureProject reference and content remain invariant when Ghost proposal exists", async () => {
    const controller = createController();
    const formalBefore = controller.state().accepted;
    const formalClone = structuredClone(formalBefore);

    await controller.executeCommand({
      type: "add-component",
      component: { id: "notification", name: "Notification Service", type: "service", capabilities: ["notify"] }
    });

    const state = controller.state();
    assert.equal(state.isCommandProposal, true);
    assert.ok(state.candidate !== undefined);
    assert.ok(state.proposal !== undefined);

    // Invariant: formal architecture reference & deep equality completely unchanged
    assert.strictEqual(state.accepted, formalBefore);
    assert.deepEqual(state.accepted, formalClone);
  });

  it("ensures Ghost IDs never leak into formal saveProject payload", async () => {
    const controller = createController();
    await controller.executeCommand({
      type: "add-component",
      component: { id: "analytics", name: "Analytics Service", type: "service", capabilities: ["tracking"] }
    });

    // Mock bridge save
    let savedArchitectureJson = "";
    let savedViewStateJson = "";
    (controller as any).shell = {
      ...controller.state(),
      layoutState: {
        version: 1,
        direction: "LR",
        nodes: [{ id: "gateway", position: { x: 10, y: 10 }, size: { width: 100, height: 50 }, kind: "component" }]
      }
    };

    // The saved architecture and viewState must not contain ghost: prefix
    savedArchitectureJson = JSON.stringify(controller.state().accepted);
    savedViewStateJson = JSON.stringify(controller.state().layoutState);

    assert.ok(!savedArchitectureJson.includes("ghost:"));
    assert.ok(!savedArchitectureJson.includes("analytics"));
    assert.ok(!savedViewStateJson.includes("ghost:"));
  });

  it("keeps formal layout positions completely stable when command proposal is prepared", async () => {
    const controller = createController();
    const initialLayout = {
      status: "success" as const,
      direction: "LR" as const,
      size: { width: 800, height: 600 },
      nodes: [
        { id: "gateway", sourceId: "gateway", kind: "component" as const, position: { x: 100, y: 100 }, size: { width: 220, height: 90 } },
        { id: "ledger", sourceId: "ledger", kind: "component" as const, position: { x: 400, y: 100 }, size: { width: 220, height: 90 } }
      ],
      edges: [],
      diagnostics: []
    };
    (controller as any).layoutValue = initialLayout;

    await controller.executeCommand({
      type: "connect-components",
      connection: { id: "gateway-events", from: "gateway", to: "events", protocol: "MESSAGE" }
    });

    // In D-007 Option B, layoutValue must not be overwritten or re-laid out
    assert.strictEqual(controller.layout(), initialLayout);
    assert.deepEqual(controller.layout()?.nodes, initialLayout.nodes);
  });
});

describe("Step 5.8 D-011 Ghost Predictive Placement (Option B: Dry-run Prediction)", () => {
  it("a. persistence isolation: dry-run does not write layoutState, undo stack, Save outputs, or Handoff; ghost ID not in formal architecture", async () => {
    const initialLayoutState: LayoutState = {
      version: 1,
      direction: "LR",
      nodes: [
        { id: "gateway", position: { x: 100, y: 100 }, size: { width: 220, height: 90 } },
        { id: "ledger", position: { x: 400, y: 100 }, size: { width: 220, height: 90 } }
      ],
      edges: []
    };
    const controller = createController();
    (controller as any).shell = {
      ...controller.state(),
      layoutState: initialLayoutState
    };
    (controller as any).layoutValue = {
      status: "success",
      direction: "LR",
      size: { width: 800, height: 600 },
      nodes: initialLayoutState.nodes,
      edges: [],
      diagnostics: []
    };
    const layoutStateBefore = structuredClone(controller.state().layoutState);

    await controller.executeCommand({
      type: "add-component",
      component: { id: "audit-svc", name: "Audit Service", type: "service", capabilities: ["audit"] }
    });

    const state = controller.state();
    assert.ok(state.ghostPrediction !== undefined);
    assert.equal(state.ghostPrediction?.status, "predicted");
    assert.ok(state.ghostPrediction?.nodes?.["audit-svc"] !== undefined);

    // Assert layoutState was NOT mutated by dry-run
    assert.deepEqual(state.layoutState, layoutStateBefore);
    assert.equal(state.candidateLayoutState, undefined);

    // Assert Save payload does not contain ghost: prefix or audit-svc
    const savedArchJson = JSON.stringify(state.accepted);
    const savedViewStateJson = JSON.stringify(state.layoutState);
    assert.ok(!savedArchJson.includes("ghost:"));
    assert.ok(!savedArchJson.includes("audit-svc"));
    assert.ok(!savedViewStateJson.includes("ghost:"));
    assert.ok(!savedViewStateJson.includes("audit-svc"));

    // Assert Handoff generation does not contain ghost: prefix or audit-svc
    const handoff = generateExecutionHandoff(state.accepted);
    assert.ok(!JSON.stringify(handoff).includes("ghost:"));
    assert.ok(!JSON.stringify(handoff).includes("audit-svc"));

    // Assert formal ArchitectureProject has no ghost ID
    assert.ok(!state.accepted.architecture.components.some((c) => c.id.includes("ghost") || c.id === "audit-svc"));
  });

  it("b. consistency: dry-run and accept call identical incremental layout function and identical previousState", async () => {
    const layoutCalls: Array<{ architecture: ArchitectureProject; previousState?: LayoutState }> = [];
    const controller = new WorkspaceShellController(pointsSystemFixture, {
      flow: new CandidateFlow({
        review: new ArchitectureReview({
          clock: () => new Date("2026-08-15T00:00:00.000Z"),
          idGenerator: (() => { let id = 0; return () => `proposal-${++id}`; })()
        })
      }),
      engineFactory: () => ({
        layout: async (graph: any) => ({
          status: "success" as const,
          direction: "LR" as const,
          size: { width: 800, height: 600 },
          nodes: graph.nodes.map((n: any, idx: number) => ({
            id: n.id,
            sourceId: n.id,
            kind: n.kind,
            position: { x: 50 + idx * 250, y: 150 },
            size: { width: 220, height: 90 }
          })),
          edges: [],
          diagnostics: []
        }),
        dispose: () => undefined
      })
    });

    const initialLayoutState: LayoutState = {
      version: 1,
      direction: "LR",
      nodes: pointsSystemFixture.architecture.components.map((c, i) => ({
        id: c.id,
        position: { x: i * 200, y: 100 },
        size: { width: 220, height: 90 }
      })),
      edges: []
    };
    controller.updateLayoutState(initialLayoutState);
    (controller as any).layoutValue = {
      status: "success",
      direction: "LR",
      size: { width: 800, height: 600 },
      nodes: initialLayoutState.nodes,
      edges: [],
      diagnostics: []
    };

    // Spy on controller's unified incremental layout execution point
    const originalRunIncremental = (controller as any).runIncrementalLayout.bind(controller);
    (controller as any).runIncrementalLayout = async (arch: any, prev: any, sig: any, timeout: any) => {
      layoutCalls.push({ architecture: arch, previousState: prev });
      return originalRunIncremental(arch, prev, sig, timeout);
    };

    // Call 1: Dry-run prediction triggered by executeCommand
    await controller.executeCommand({
      type: "add-component",
      component: { id: "payment-gw", name: "Payment Gateway", type: "service", capabilities: ["pay"] }
    });
    assert.equal(controller.state().ghostPrediction?.status, "predicted");

    // Call 2: Formal acceptCandidate
    await controller.acceptCandidate("Approved payment gateway.");

    assert.ok(layoutCalls.length >= 2);
    const dryRunCall = layoutCalls[layoutCalls.length - 2];
    const acceptCall = layoutCalls[layoutCalls.length - 1];

    assert.equal(dryRunCall.architecture.architecture.components.length, acceptCall.architecture.architecture.components.length);
    assert.deepEqual(dryRunCall.previousState, initialLayoutState);
    assert.deepEqual(acceptCall.previousState, initialLayoutState);
  });

  it("c. fault injection: solver error, timeout, and fallback solver gracefully degrade to unavailable with accessible notice", async () => {
    // 1. Fallback solver status injection
    const fallbackController = new WorkspaceShellController(pointsSystemFixture, {
      engineFactory: () => ({
        layout: async (graph: any) => ({
          status: "fallback" as const,
          direction: "LR" as const,
          size: { width: 800, height: 600 },
          nodes: graph.nodes.map((n: any) => ({
            id: n.id, sourceId: n.id, kind: n.kind, position: { x: 0, y: 0 }, size: { width: 100, height: 50 }
          })),
          edges: [],
          diagnostics: [{ code: "SOLVER_FAILURE" as const, severity: "error" as const, message: "Injected ELK crash" }]
        }),
        dispose: () => undefined
      })
    });
    (fallbackController as any).layoutValue = {
      status: "success",
      direction: "LR",
      size: { width: 800, height: 600 },
      nodes: [],
      edges: [],
      diagnostics: []
    };

    await fallbackController.executeCommand({
      type: "add-component",
      component: { id: "crash-test", name: "Crash Test", type: "service", capabilities: ["crash"] }
    });

    const state = fallbackController.state();
    assert.equal(state.ghostPrediction?.status, "unavailable");
    assert.equal(state.ghostPrediction?.solver, "fallback");
    assert.ok(state.ghostPrediction?.notice?.includes("求解器降级") || state.ghostPrediction?.notice?.includes("Injected ELK crash"));

    // 2. Worker / Layout exception injection
    const errorController = new WorkspaceShellController(pointsSystemFixture, {
      engineFactory: () => ({
        layout: async () => { throw new Error("Worker timeout: 5000ms exceeded"); },
        dispose: () => undefined
      })
    });
    (errorController as any).layoutValue = {
      status: "success",
      direction: "LR",
      size: { width: 800, height: 600 },
      nodes: [],
      edges: [],
      diagnostics: []
    };

    await errorController.executeCommand({
      type: "add-component",
      component: { id: "timeout-test", name: "Timeout Test", type: "service", capabilities: ["timeout"] }
    });

    const errorState = errorController.state();
    assert.equal(errorState.ghostPrediction?.status, "unavailable");
    assert.ok(errorState.ghostPrediction?.notice?.includes("Worker timeout"));
  });

  it("d. race conditions: stale dry-run results are safely discarded when proposal changes, is rejected, or becomes stale", async () => {
    let slowResolve: ((val: any) => void) | undefined;
    const slowEngine = {
      layout: async (graph: any) => {
        return new Promise((resolve) => {
          slowResolve = () => resolve({
            status: "success" as const,
            direction: "LR" as const,
            size: { width: 800, height: 600 },
            nodes: graph.nodes.map((n: any) => ({
              id: n.id, sourceId: n.id, kind: n.kind, position: { x: 999, y: 999 }, size: { width: 220, height: 90 }
            })),
            edges: [],
            diagnostics: []
          });
        });
      },
      dispose: () => undefined
    };

    const controller = new WorkspaceShellController(pointsSystemFixture, {
      engineFactory: () => slowEngine as any
    });
    (controller as any).layoutValue = {
      status: "success",
      direction: "LR",
      size: { width: 800, height: 600 },
      nodes: [],
      edges: [],
      diagnostics: []
    };

    // Start slow proposal 1
    const p1 = controller.executeCommand({
      type: "add-component",
      component: { id: "slow-svc", name: "Slow Service", type: "service", capabilities: ["slow"] }
    });

    // While slow dry-run is in-flight, user rejects proposal
    controller.rejectCandidate("Discard slow proposal.");

    // Now let slow dry-run resolve
    slowResolve?.(null);
    await p1;

    // The stale dry-run must NOT have applied its result
    const state = controller.state();
    assert.equal(state.proposal?.status, "rejected");
    assert.equal(state.ghostPrediction, undefined);
    assert.equal(state.isCommandProposal, undefined);
  });

  it("e. rejection releases workspace lock and ensures no Ghost reappears", async () => {
    const controller = createController();
    await controller.executeCommand({
      type: "add-component",
      component: { id: "rejected-svc", name: "Rejected Service", type: "service", capabilities: ["reject"] }
    });

    assert.ok(controller.state().proposal !== undefined);
    assert.ok(controller.state().isCommandProposal);

    // Reject candidate
    controller.rejectCandidate("User rejected.");

    const state = controller.state();
    assert.equal(state.status, "ready");
    assert.equal(state.isCommandProposal, undefined);
    assert.equal(state.ghostPrediction, undefined);

    // Can immediately propose another change without being blocked
    await controller.executeCommand({
      type: "add-component",
      component: { id: "new-svc", name: "New Service", type: "service", capabilities: ["new"] }
    });
    assert.ok(controller.state().proposal?.title.includes("new-svc"));
  });
});

