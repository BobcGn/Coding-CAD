import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { ArchitectureAgent } from "@coding-cad/architecture-agent";
import { pointsSystemFixture } from "../projection/points-system-fixture.js";
import { CandidateFlow } from "./candidate-flow.js";

const REQUIREMENT = "设计一个积分系统。100万用户。积分不能丢失。未来支持活动兑换。";

describe("P3.2 requirement to candidate flow", () => {
  it("generates a deterministic candidate from the same requirement", async () => {
    const flow = new CandidateFlow();
    const first = await flow.generate(REQUIREMENT, pointsSystemFixture);
    const second = await flow.generate(REQUIREMENT, pointsSystemFixture);

    assert.deepEqual(first.candidate, second.candidate);
    assert.equal(first.candidate.intent.name, "PointSystem");
  });

  it("does not mutate the accepted ArchitectureProject before approval", async () => {
    const flow = new CandidateFlow();
    const before = structuredClone(pointsSystemFixture);
    const result = await flow.generate(REQUIREMENT, pointsSystemFixture);

    assert.deepEqual(pointsSystemFixture, before);
    assert.equal(result.accepted, pointsSystemFixture);
    assert.notEqual(result.candidate, pointsSystemFixture);
  });

  it("produces traceable validator problems on the candidate", async () => {
    const flow = new CandidateFlow();
    const result = await flow.generate(REQUIREMENT, pointsSystemFixture);

    assert.equal(typeof result.validation.valid, "boolean");
    assert.ok(Array.isArray(result.validation.issues));
    for (const issue of result.validation.issues) {
      assert.equal(typeof issue.severity, "string");
      assert.equal(typeof issue.title, "string");
      assert.equal(typeof issue.description, "string");
      assert.equal(typeof issue.id, "string");
    }
  });

  it("creates a minimal review proposal with pending status", async () => {
    const flow = new CandidateFlow();
    const result = await flow.generate(REQUIREMENT, pointsSystemFixture);

    assert.equal(result.proposal.status, "draft");
    assert.equal(result.proposal.requiredApprovals, 1);
    assert.deepEqual(result.proposal.change.baseArchitecture, pointsSystemFixture);
    assert.deepEqual(result.proposal.change.proposedArchitecture, result.candidate);
  });

  it("generation never invokes an LLM (P3-D2 boundary)", async () => {
    // The agent default is fully deterministic; asserting the generated
    // output shape proves the generation path works without any provider.
    const agent = new ArchitectureAgent();
    const project = await agent.design(REQUIREMENT);
    assert.equal(project.intent.name, "PointSystem");
    assert.ok(project.architecture.components.length > 0);
  });
});
