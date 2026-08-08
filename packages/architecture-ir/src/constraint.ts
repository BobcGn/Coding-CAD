import type { JsonValue } from "./common.js";

export type ConstraintType =
  | "performance"
  | "consistency"
  | "availability"
  | "security"
  | "cost";

/**
 * Architecture-level rule that should shape implementation decisions.
 * Constraints are intentionally separate from components so they can describe
 * cross-cutting qualities such as consistency, latency, and cost.
 */
export interface Constraint {
  /**
   * Quality axis affected by the constraint.
   */
  readonly type: ConstraintType;

  /**
   * Human-readable rule the architecture should respect.
   */
  readonly description: string;

  /**
   * Optional machine-readable threshold or setting, such as 200 or "strong".
   */
  readonly value?: JsonValue;
}
