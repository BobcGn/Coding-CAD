import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import type { Approval, RecordApprovalInput } from "./approval.js";
import { analyzeImpact } from "./impact-analysis.js";
import type { CreateProposalInput, Proposal, ProposalStatus } from "./proposal.js";
import type { AddReviewCommentInput, ReviewComment } from "./review-comment.js";

export interface ArchitectureReviewOptions {
  readonly clock?: () => Date;
  readonly idGenerator?: () => string;
}

/** In-memory proposal workflow. Persistence belongs to a surrounding application or Workspace integration. */
export class ArchitectureReview {
  private readonly proposals = new Map<string, Proposal>();
  private readonly clock: () => Date;
  private readonly idGenerator: () => string;

  constructor(options: ArchitectureReviewOptions = {}) {
    this.clock = options.clock ?? (() => new Date());
    this.idGenerator = options.idGenerator ?? browserSafeIdGenerator;
  }

  createProposal(input: CreateProposalInput): Proposal {
    assertNonEmpty(input.title, "Proposal title");
    assertNonEmpty(input.summary, "Proposal summary");
    assertNonEmpty(input.author, "Proposal author");
    if (!Number.isSafeInteger(input.baseVersion) || input.baseVersion < 1) {
      throw new Error("Proposal base version must be a positive integer.");
    }
    const requiredApprovals = input.requiredApprovals ?? 1;
    if (!Number.isSafeInteger(requiredApprovals) || requiredApprovals < 1) {
      throw new Error("A proposal must require at least one approval.");
    }

    const timestamp = this.now();
    const change = {
      baseVersion: input.baseVersion,
      proposedVersion: input.baseVersion + 1,
      baseArchitecture: clone(input.baseArchitecture),
      proposedArchitecture: clone(input.proposedArchitecture)
    };
    const proposal: Proposal = {
      id: this.idGenerator(),
      title: input.title,
      summary: input.summary,
      author: input.author,
      status: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
      requiredApprovals,
      change,
      validation: clone(input.validation),
      impactAnalysis: analyzeImpact(change, input.validation),
      comments: [],
      approvals: []
    };
    this.proposals.set(proposal.id, proposal);
    return clone(proposal);
  }

  submitProposal(proposalId: string): Proposal {
    const proposal = this.requireProposal(proposalId);
    this.assertStatus(proposal, ["draft"], "submit");
    const timestamp = this.now();
    return this.replace({
      ...proposal,
      status: "in-review",
      submittedAt: timestamp,
      updatedAt: timestamp
    });
  }

  addComment(proposalId: string, input: AddReviewCommentInput): ReviewComment {
    const proposal = this.requireProposal(proposalId);
    this.assertStatus(proposal, ["draft", "in-review", "changes-requested"], "comment on");
    assertNonEmpty(input.author, "Comment author");
    assertNonEmpty(input.body, "Comment body");
    const comment: ReviewComment = {
      id: this.idGenerator(),
      proposalId,
      author: input.author,
      kind: input.kind ?? "comment",
      body: input.body,
      createdAt: this.now()
    };
    this.replace({
      ...proposal,
      updatedAt: comment.createdAt,
      comments: [...proposal.comments, comment]
    });
    return clone(comment);
  }

  recordApproval(proposalId: string, input: RecordApprovalInput): Approval {
    const proposal = this.requireProposal(proposalId);
    this.assertStatus(proposal, ["in-review"], "review");
    assertNonEmpty(input.reviewer, "Reviewer");
    assertNonEmpty(input.rationale, "Approval rationale");
    if (proposal.approvals.some((approval) => approval.reviewer === input.reviewer)) {
      throw new Error(`Reviewer ${input.reviewer} has already decided proposal ${proposalId}.`);
    }
    if (input.decision === "approve" && !proposal.validation.valid) {
      throw new Error("A proposal with validation errors cannot be approved.");
    }

    const approval: Approval = {
      id: this.idGenerator(),
      proposalId,
      reviewer: input.reviewer,
      decision: input.decision,
      rationale: input.rationale,
      createdAt: this.now()
    };
    const approvals = [...proposal.approvals, approval];
    const status = statusAfterDecision(proposal, approvals, input.decision);
    this.replace({
      ...proposal,
      status,
      updatedAt: approval.createdAt,
      ...(isResolved(status) ? { resolvedAt: approval.createdAt } : {}),
      approvals
    });
    return clone(approval);
  }

  withdrawProposal(proposalId: string): Proposal {
    const proposal = this.requireProposal(proposalId);
    this.assertStatus(proposal, ["draft", "in-review", "changes-requested"], "withdraw");
    const timestamp = this.now();
    return this.replace({
      ...proposal,
      status: "withdrawn",
      updatedAt: timestamp,
      resolvedAt: timestamp
    });
  }

  getProposal(proposalId: string): Proposal {
    return clone(this.requireProposal(proposalId));
  }

  listProposals(status?: ProposalStatus): readonly Proposal[] {
    return [...this.proposals.values()]
      .filter((proposal) => status === undefined || proposal.status === status)
      .map((proposal) => clone(proposal));
  }

  /** Gate for the existing Execution Blueprint generator. No Blueprint is generated here. */
  getApprovedArchitecture(proposalId: string): ArchitectureProject {
    const proposal = this.requireProposal(proposalId);
    if (proposal.status !== "approved") {
      throw new Error(`Proposal ${proposalId} is ${proposal.status}; only approved architecture can proceed.`);
    }
    return clone(proposal.change.proposedArchitecture);
  }

  private requireProposal(proposalId: string): Proposal {
    const proposal = this.proposals.get(proposalId);
    if (proposal === undefined) throw new Error(`Architecture proposal ${proposalId} does not exist.`);
    return proposal;
  }

  private replace(proposal: Proposal): Proposal {
    this.proposals.set(proposal.id, proposal);
    return clone(proposal);
  }

  private assertStatus(proposal: Proposal, allowed: readonly ProposalStatus[], action: string): void {
    if (!allowed.includes(proposal.status)) {
      throw new Error(`Cannot ${action} proposal ${proposal.id} while it is ${proposal.status}.`);
    }
  }

  private now(): string {
    return this.clock().toISOString();
  }
}

function statusAfterDecision(
  proposal: Proposal,
  approvals: readonly Approval[],
  decision: RecordApprovalInput["decision"]
): ProposalStatus {
  if (decision === "reject") return "rejected";
  if (decision === "request-changes") return "changes-requested";
  const approvalCount = approvals.filter((approval) => approval.decision === "approve").length;
  return approvalCount >= proposal.requiredApprovals ? "approved" : "in-review";
}

function isResolved(status: ProposalStatus): boolean {
  return status === "approved" || status === "rejected" || status === "withdrawn";
}

function assertNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) throw new Error(`${field} must not be empty.`);
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

/**
 * Browser-safe default id generator. Avoids a Node-only randomUUID import so
 * the package can be consumed from a browser bundle (P3-D1) without pulling
 * node:* modules into the client.
 */
function browserSafeIdGenerator(): string {
  const cryptoObject = globalThis.crypto;
  if (cryptoObject !== undefined && typeof cryptoObject.randomUUID === "function") {
    return cryptoObject.randomUUID();
  }
  return `proposal-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
