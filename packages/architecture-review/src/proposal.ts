import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import type { ValidationResult } from "@coding-cad/architecture-validator";
import type { ArchitectureVersion } from "@coding-cad/workspace";
import type { Approval } from "./approval.js";
import type { ImpactAnalysis } from "./impact-analysis.js";
import type { ReviewComment } from "./review-comment.js";

export type ProposalStatus =
  | "draft"
  | "in-review"
  | "changes-requested"
  | "approved"
  | "rejected"
  | "withdrawn";

/** The immutable baseline and candidate IR documents being considered. */
export interface ArchitectureChange {
  readonly baseVersion: ArchitectureVersion;
  readonly proposedVersion: ArchitectureVersion;
  readonly baseArchitecture: ArchitectureProject;
  readonly proposedArchitecture: ArchitectureProject;
}

export interface Proposal {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly author: string;
  readonly status: ProposalStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly submittedAt?: string;
  readonly resolvedAt?: string;
  readonly requiredApprovals: number;
  readonly change: ArchitectureChange;
  readonly validation: ValidationResult;
  readonly impactAnalysis: ImpactAnalysis;
  readonly comments: readonly ReviewComment[];
  readonly approvals: readonly Approval[];
}

export interface CreateProposalInput {
  readonly title: string;
  readonly summary: string;
  readonly author: string;
  readonly baseVersion: ArchitectureVersion;
  readonly baseArchitecture: ArchitectureProject;
  readonly proposedArchitecture: ArchitectureProject;
  readonly validation: ValidationResult;
  readonly requiredApprovals?: number;
}
