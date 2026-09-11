import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { ArchitectureReview } from "@coding-cad/architecture-review";
import { pointsSystemFixture } from "../projection/points-system-fixture.js";
import { CandidateFlow } from "./candidate-flow.js";

const REQUIREMENT = "设计一个积分系统。100万用户。积分不能丢失。未来支持活动兑换。";

describe("P3.2 candidate -> minimal review gate integration", () => {
  it("accepting a candidate through the review gate updates accepted IR", async () => {
    const review = new ArchitectureReview({
      clock: () => new Date("2026-08-15T00:00:00.000Z"),
      idGenerator: (() => { let id = 0; return () => `proposal-${++id}`; })()
    });
    const flow = new CandidateFlow({ review });
    const result = await flow.generate(REQUIREMENT, pointsSystemFixture);

    const submitted = review.submitProposal(result.proposal.id);
    assert.equal(submitted.status, "in-review");

    const approval = review.recordApproval(result.proposal.id, {
      reviewer: "user-1",
      decision: "approve",
      rationale: "Candidate meets requirements."
    });
    assert.equal(approval.decision, "approve");

    const finalProposal = review.getProposal(result.proposal.id);
    assert.equal(finalProposal.status, "approved");
  });

  it("rejecting a candidate leaves the accepted IR untouched", async () => {
    const review = new ArchitectureReview({
      clock: () => new Date("2026-08-15T00:00:00.000Z"),
      idGenerator: (() => { let id = 100; return () => `proposal-${++id}`; })()
    });
    const flow = new CandidateFlow({ review });
    const result = await flow.generate(REQUIREMENT, pointsSystemFixture);
    const acceptedBefore = structuredClone(pointsSystemFixture);

    review.submitProposal(result.proposal.id);
    const approval = review.recordApproval(result.proposal.id, {
      reviewer: "user-1",
      decision: "reject",
      rationale: "Not aligned with the accepted baseline."
    });
    assert.equal(approval.decision, "reject");

    assert.deepEqual(pointsSystemFixture, acceptedBefore);
  });
});
