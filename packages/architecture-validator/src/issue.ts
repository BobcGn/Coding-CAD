import type { Severity } from "./severity.js";

/**
 * Explainable architecture review finding.
 * Issues must say what is wrong, why it matters, and how a human or Agent can
 * improve the design; the validator never patches the architecture itself.
 */
export interface ValidationIssue {
  readonly id: string;
  readonly severity: Severity;
  readonly title: string;
  readonly description: string;
  readonly affectedComponent?: string;
  readonly suggestion?: string;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly issues: readonly ValidationIssue[];
  readonly summary: string;
}
