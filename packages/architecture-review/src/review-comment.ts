export type ReviewCommentKind = "comment" | "question" | "change-request";

/** Human discussion attached to a proposal; comments never mutate Architecture IR. */
export interface ReviewComment {
  readonly id: string;
  readonly proposalId: string;
  readonly author: string;
  readonly kind: ReviewCommentKind;
  readonly body: string;
  readonly createdAt: string;
}

export interface AddReviewCommentInput {
  readonly author: string;
  readonly body: string;
  readonly kind?: ReviewCommentKind;
}
