import assert from "node:assert/strict";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { ArchitectureValidator } from "@coding-cad/architecture-validator";
import { generateExecutionBlueprint } from "@coding-cad/execution-blueprint";
import { ArchitectureReview } from "./architecture-review.js";
import { analyzeImpact } from "./impact-analysis.js";

const baseline: ArchitectureProject = {
  version: "0.1",
  intent: {
    name: "ReviewedSystem",
    purpose: ["Demonstrate human-reviewed architecture changes."]
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
        protocol: "SQL"
      }
    ]
  },
  constraints: [],
  decisions: []
};

const candidate: ArchitectureProject = {
  ...baseline,
  architecture: {
    components: [
      {
        ...baseline.architecture.components[0]!,
        capabilities: ["request-handling", "cached-read"]
      },
      baseline.architecture.components[1]!,
      {
        id: "cache",
        name: "Read Cache",
        type: "cache",
        capabilities: ["low-latency-read"]
      }
    ],
    connections: [
      ...baseline.architecture.connections,
      {
        id: "api-to-cache",
        from: "api",
        to: "cache",
        protocol: "Redis protocol"
      }
    ]
  },
  decisions: [
    {
      title: "Add derived read cache",
      context: "Read traffic is growing.",
      decision: "Add a cache for derived reads without changing data ownership.",
      alternatives: ["Scale primary store reads"],
      rationale: "This preserves the durable store as the source of truth."
    }
  ]
};

let id = 0;
const review = new ArchitectureReview({
  clock: () => new Date("2026-08-09T08:00:00.000Z"),
  idGenerator: () => `review-${++id}`
});
const validation = new ArchitectureValidator().validate(candidate);
assert.equal(validation.valid, true);

const proposal = review.createProposal({
  title: "Introduce a derived read cache",
  summary: "Reduce read latency while retaining durable ownership.",
  author: "architecture-agent",
  baseVersion: 3,
  baseArchitecture: baseline,
  proposedArchitecture: candidate,
  validation,
  requiredApprovals: 2
});

assert.equal(proposal.status, "draft");
assert.equal(proposal.change.baseVersion, 3);
assert.equal(proposal.change.proposedVersion, 4);
assert.deepEqual(proposal.impactAnalysis.changedAreas, ["components", "connections", "decisions"]);
assert.deepEqual(proposal.impactAnalysis.diff.components.added.map((value) => value.id), ["cache"]);
assert.deepEqual(proposal.impactAnalysis.diff.components.changed.map((value) => value.after.id), ["api"]);
assert.deepEqual(proposal.impactAnalysis.affectedComponentIds, ["cache", "api"]);

assert.throws(() => review.getApprovedArchitecture(proposal.id), /only approved architecture/);
review.addComment(proposal.id, {
  author: "platform-owner",
  kind: "question",
  body: "Does the primary store remain authoritative?"
});
review.submitProposal(proposal.id);

review.recordApproval(proposal.id, {
  reviewer: "platform-owner",
  decision: "approve",
  rationale: "Data ownership remains explicit."
});
assert.equal(review.getProposal(proposal.id).status, "in-review");
assert.throws(
  () => review.recordApproval(proposal.id, {
    reviewer: "platform-owner",
    decision: "approve",
    rationale: "Duplicate vote."
  }),
  /already decided/
);

review.recordApproval(proposal.id, {
  reviewer: "security-owner",
  decision: "approve",
  rationale: "The new boundary adds no authoritative data."
});
assert.equal(review.getProposal(proposal.id).status, "approved");
assert.equal(review.listProposals("approved").length, 1);

const approvedArchitecture = review.getApprovedArchitecture(proposal.id);
assert.deepEqual(approvedArchitecture, candidate);
const blueprint = generateExecutionBlueprint(approvedArchitecture, { validationResult: validation });
assert.equal(blueprint.projectName, "ReviewedSystem");

const invalidProposal = review.createProposal({
  title: "Invalid proposal",
  summary: "Exercise the validation approval gate.",
  author: "architecture-agent",
  baseVersion: 4,
  baseArchitecture: candidate,
  proposedArchitecture: candidate,
  validation: {
    valid: false,
    issues: [{
      id: "invalid-boundary",
      severity: "ERROR",
      title: "Invalid boundary",
      description: "The candidate violates an architecture constraint."
    }],
    summary: "Architecture validation found 1 error."
  }
});
review.submitProposal(invalidProposal.id);
assert.throws(
  () => review.recordApproval(invalidProposal.id, {
    reviewer: "reviewer",
    decision: "approve",
    rationale: "Attempt to bypass validation."
  }),
  /validation errors/
);
const changeRequest = review.recordApproval(invalidProposal.id, {
  reviewer: "reviewer",
  decision: "request-changes",
  rationale: "Resolve the validation error before resubmitting a new proposal."
});
assert.equal(changeRequest.decision, "request-changes");
assert.equal(review.getProposal(invalidProposal.id).status, "changes-requested");

const removalImpact = analyzeImpact({
  baseVersion: 4,
  proposedVersion: 5,
  baseArchitecture: candidate,
  proposedArchitecture: baseline
}, new ArchitectureValidator().validate(baseline));
assert.equal(removalImpact.risk, "high");
assert.ok(removalImpact.reasons.some((reason) => reason.includes("removed")));

console.log("architecture-review tests passed");
