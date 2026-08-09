export type ReviewDecision = "approve" | "request-changes" | "reject";

/** Immutable human decision recorded against one submitted proposal. */
export interface Approval {
  readonly id: string;
  readonly proposalId: string;
  readonly reviewer: string;
  readonly decision: ReviewDecision;
  readonly rationale: string;
  readonly createdAt: string;
}

export interface RecordApprovalInput {
  readonly reviewer: string;
  readonly decision: ReviewDecision;
  readonly rationale: string;
}
