import type { ArchitectureDecision } from "@coding-cad/architecture-ir";
import type { ArchitectureVersion } from "./version.js";

export type DecisionStatus = "proposed" | "accepted" | "deprecated" | "superseded";

/** Lifecycle metadata around an Architecture IR decision. */
export interface DecisionRecord {
  readonly id: string;
  readonly architectureVersion: ArchitectureVersion;
  readonly createdAt: string;
  readonly status: DecisionStatus;
  readonly decision: ArchitectureDecision;
}

export interface AddDecisionOptions {
  readonly id?: string;
  readonly architectureVersion?: ArchitectureVersion;
  readonly status?: DecisionStatus;
}
