import { describe, expect, it, vi } from "vitest";
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
  const controller = new WorkspaceShellController(pointsSystemFixture, { flow, engineFactory: () => ({ layout }) });
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
