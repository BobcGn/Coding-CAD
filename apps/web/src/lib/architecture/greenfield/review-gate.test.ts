import { describe, expect, it, vi } from "vitest";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { ArchitectureReview } from "@coding-cad/architecture-review";
import { ArchitectureValidator } from "@coding-cad/architecture-validator";
import { pointsSystemFixture } from "../projection/points-system-fixture.js";
import { CandidateFlow } from "./candidate-flow.js";
import { WorkspaceShellController } from "./workspace-shell-controller.js";

function setup(invalid = false) {
  const review = new ArchitectureReview();
  const flow = new CandidateFlow({
    review,
    ...(invalid ? { validator: new ArchitectureValidator([{
      id: "test-invalid", name: "Invalid fixture", description: "Inject a Validator failure",
      validate: () => [{ id: "invalid", severity: "ERROR", title: "Invalid", description: "Invalid candidate" }]
    }]) } : {})
  });
  const layout = vi.fn(async () => ({
    status: "success" as const, direction: "LR" as const,
    size: { width: 100, height: 100 }, nodes: [], edges: [], diagnostics: []
  }));
  const controller = new WorkspaceShellController(pointsSystemFixture, { flow, review, engineFactory: () => ({ layout }) });
  return { controller, review, layout };
}

describe("production controller Review gate", () => {
  it("commits only an approved architecture and exactly once, including repeated Accept", async () => {
    const { controller, review, layout } = setup();
    const before = controller.state().accepted;
    await controller.generateFromRequirement("积分系统");
    const pending = controller.state();
    expect(pending.accepted).toBe(before);
    expect(review.getProposal(pending.proposal!.id).status).toBe("draft");
    const first = controller.acceptCandidate("Meets the requirements.");
    const committed = controller.state().accepted;
    expect(committed).not.toBe(before);
    expect(committed).toEqual(pending.candidate);
    await controller.acceptCandidate("Repeated click.");
    await first;
    expect(controller.state().accepted).toBe(committed);
    expect(controller.state().candidate).toBeUndefined();
    const proposal = review.getProposal(pending.proposal!.id);
    expect(proposal.status).toBe("approved");
    expect(proposal.approvals).toHaveLength(1);
    expect(proposal.approvals[0]).toMatchObject({ reviewer: "local-user", decision: "approve", rationale: "Meets the requirements." });
    expect(layout).toHaveBeenCalledTimes(2);
  });

  it("leaves candidate and accepted references unchanged when Validator fails", async () => {
    const { controller, review } = setup(true);
    await controller.generateFromRequirement("积分系统");
    const pending = controller.state();
    await controller.acceptCandidate("Try anyway.");
    expect(controller.state().accepted).toBe(pending.accepted);
    expect(controller.state().candidate).toBe(pending.candidate);
    expect(review.getProposal(pending.proposal!.id).status).toBe("draft");
    expect(review.getProposal(pending.proposal!.id).approvals).toHaveLength(0);
  });

  it("records rejection and retains both architectures unchanged", async () => {
    const { controller, review } = setup();
    await controller.generateFromRequirement("积分系统");
    const pending = controller.state();
    controller.rejectCandidate("Wrong scope.");
    expect(controller.state().accepted).toBe(pending.accepted);
    expect(controller.state().candidate).toBe(pending.candidate);
    expect(review.getProposal(pending.proposal!.id).status).toBe("rejected");
    await controller.acceptCandidate("Cannot revive rejected proposal.");
    expect(controller.state().accepted).toBe(pending.accepted);
    expect(review.getProposal(pending.proposal!.id).approvals).toHaveLength(1);
  });

  it("preserves both architectures when approval throws and permits retry", async () => {
    const { controller, review } = setup();
    await controller.generateFromRequirement("积分系统");
    const pending = controller.state();
    const record = vi.spyOn(review, "recordApproval").mockImplementationOnce(() => { throw new Error("Approval unavailable"); });
    await controller.acceptCandidate("Meets requirements.");
    expect(controller.state().accepted).toBe(pending.accepted);
    expect(controller.state().candidate).toBe(pending.candidate);
    expect(controller.state().message).toBe("Approval unavailable");
    expect(review.getProposal(pending.proposal!.id).status).toBe("in-review");
    expect(review.getProposal(pending.proposal!.id).approvals).toHaveLength(0);
    record.mockRestore();
    await controller.acceptCandidate("Retry.");
    expect(controller.state().proposal?.status).toBe("approved");
  });

  it("requires a nonempty user rationale before submitting", async () => {
    const { controller, review } = setup();
    await controller.generateFromRequirement("积分系统");
    const pending = controller.state();
    await controller.acceptCandidate("   ");
    expect(controller.state().accepted).toBe(pending.accepted);
    expect(controller.state().candidate).toBe(pending.candidate);
    expect(review.getProposal(pending.proposal!.id).status).toBe("draft");
  });
});

describe("Step 5.3 Review Integration & Lifecycle Hardening (Ghost & Stale Proposal)", () => {
  it("associates Ghost command proposal with Accept: formal ArchitectureProject updates, Ghost clears, triggers layout", async () => {
    const { controller, review, layout } = setup();
    await controller.executeCommand({
      type: "add-component",
      component: { id: "audit-svc", name: "AuditService", type: "service", capabilities: ["audit"] }
    });

    const pending = controller.state();
    expect(pending.isCommandProposal).toBe(true);
    expect(pending.candidate?.architecture.components.some((c) => c.id === "audit-svc")).toBe(true);
    expect(pending.accepted.architecture.components.some((c) => c.id === "audit-svc")).toBe(false);
    expect(review.getProposal(pending.proposal!.id).status).toBe("draft");

    // Accept proposal
    await controller.acceptCandidate("Approve adding AuditService to formal architecture.");

    const acceptedState = controller.state();
    expect(acceptedState.isCommandProposal).toBeUndefined();
    expect(acceptedState.candidate).toBeUndefined();
    expect(acceptedState.proposal?.status).toBe("approved");
    expect(acceptedState.accepted.architecture.components.some((c) => c.id === "audit-svc")).toBe(true);
    expect(layout).toHaveBeenCalled();
  });

  it("associates Ghost command proposal with Reject: Ghost clears immediately, formal architecture unchanged, candidate preserved in memory", async () => {
    const { controller, review } = setup();
    const formalBefore = controller.state().accepted;
    await controller.executeCommand({
      type: "add-component",
      component: { id: "audit-svc", name: "AuditService", type: "service", capabilities: ["audit"] }
    });

    // Reject proposal
    controller.rejectCandidate("AuditService is deferred to V2.");

    const rejectedState = controller.state();
    expect(rejectedState.isCommandProposal).toBeUndefined();
    expect(rejectedState.proposal?.status).toBe("rejected");
    expect(review.getProposal(rejectedState.proposal!.id).status).toBe("rejected");
    // Formal architecture completely unchanged
    expect(rejectedState.accepted).toBe(formalBefore);
    expect(rejectedState.accepted.architecture.components.some((c) => c.id === "audit-svc")).toBe(false);
    // Candidate retained in memory per approved semantics ("拒绝保留候选")
    expect(rejectedState.candidate?.architecture.components.some((c) => c.id === "audit-svc")).toBe(true);
  });

  it("marks proposal as stale when formal architecture changes, disables Accept, and permits Reject for cleanup", async () => {
    const { controller } = setup();
    await controller.executeCommand({
      type: "add-component",
      component: { id: "cache-svc", name: "CacheService", type: "cache", capabilities: [] }
    });

    expect(controller.state().isProposalStale).toBeUndefined();

    // External reload/update of formal architecture
    const externalProject: ArchitectureProject = {
      ...pointsSystemFixture,
      intent: {
        ...pointsSystemFixture.intent,
        mission: "Updated externally by another contributor"
      }
    };
    await controller.updateAcceptedArchitecture(externalProject);

    // Detected as stale
    expect(controller.state().isProposalStale).toBe(true);
    expect(controller.state().message).toContain("正式架构已变化，提案已失效，请重新提议。");

    // Accept is blocked on stale proposal
    await controller.acceptCandidate("Try to accept stale proposal");
    expect(controller.state().status).toBe("error");
    expect(controller.state().message).toMatch(/formal architecture has changed; the pending proposal is stale/i);
    expect(controller.state().accepted).toBe(externalProject);
    expect(controller.state().accepted.architecture.components.some((c) => c.id === "cache-svc")).toBe(false);

    // Reject operation is available to clean up stale proposal
    controller.rejectCandidate("Dismiss stale proposal");
    expect(controller.state().isProposalStale).toBeUndefined();
    expect(controller.state().proposal?.status).toBe("rejected");

    // After cleanup, new commands can be executed
    await controller.executeCommand({
      type: "add-component",
      component: { id: "new-queue", name: "NewQueue", type: "queue", capabilities: [] }
    });
    expect(controller.state().isProposalStale).toBeUndefined();
    expect(controller.state().isCommandProposal).toBe(true);
  });

  it("strictly enforces single proposal lock: blocks subsequent edits while a proposal is pending or stale", async () => {
    const { controller } = setup();
    await controller.executeCommand({
      type: "add-component",
      component: { id: "svc-1", name: "Service1", type: "service", capabilities: [] }
    });

    // Attempt second command while first is pending
    await controller.executeCommand({
      type: "add-component",
      component: { id: "svc-2", name: "Service2", type: "service", capabilities: [] }
    });
    expect(controller.state().status).toBe("error");
    expect(controller.state().message).toBe("Review the pending candidate before editing.");
    expect(controller.state().candidate?.architecture.components.some((c) => c.id === "svc-2")).toBe(false);

    // Make stale
    const externalProject = structuredClone(pointsSystemFixture);
    await controller.updateAcceptedArchitecture(externalProject);
    expect(controller.state().isProposalStale).toBe(true);

    // Attempt command while stale
    await controller.executeCommand({
      type: "add-component",
      component: { id: "svc-3", name: "Service3", type: "service", capabilities: [] }
    });
    expect(controller.state().status).toBe("error");
    expect(controller.state().message).toContain("pending proposal is stale");
  });

  it("handles repeated Accept/Reject idempotently without throwing", async () => {
    const { controller } = setup();
    await controller.executeCommand({
      type: "add-component",
      component: { id: "svc-a", name: "ServiceA", type: "service", capabilities: [] }
    });

    // Repeated reject
    controller.rejectCandidate("First reject.");
    expect(controller.state().proposal?.status).toBe("rejected");
    expect(() => controller.rejectCandidate("Second reject.")).not.toThrow();
    expect(controller.state().proposal?.status).toBe("rejected");

    // Cannot accept after reject
    await controller.acceptCandidate("Accept after reject");
    expect(controller.state().proposal?.status).toBe("rejected");
  });

  it("permits rejecting an invalid candidate proposal while blocking Accept", async () => {
    const { controller } = setup(true); // invalid validator fixture
    await controller.generateFromRequirement("积分系统");
    const pending = controller.state();
    expect(pending.validation?.valid).toBe(false);

    // Accept is blocked
    await controller.acceptCandidate("Attempt invalid accept");
    expect(controller.state().status).toBe("error");
    expect(controller.state().message).toContain("validation errors; approval is blocked");

    // Reject succeeds and clears proposal
    controller.rejectCandidate("Reject invalid candidate");
    expect(controller.state().proposal?.status).toBe("rejected");
  });
});

