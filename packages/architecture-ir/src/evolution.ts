/**
 * Planned architecture evolution. This is a roadmap of intent, not a migration
 * runner or release checklist.
 */
export interface EvolutionPlan {
  readonly phases: readonly EvolutionPhase[];
}

export interface EvolutionPhase {
  readonly id?: string;
  readonly name: string;

  /**
   * Condition that makes the phase relevant, such as scale, latency, or product
   * requirements.
   */
  readonly trigger?: string;

  readonly description: string;

  /**
   * Human-readable changes or structured change records. Strings keep v0.1 easy
   * to author; structured records support future visual diffs.
   */
  readonly changes: readonly (EvolutionChange | string)[];

  /**
   * Decision titles or ids that justify this phase.
   */
  readonly decisions?: readonly string[];
}

/**
 * Structured change for tools that need to compare architecture states.
 */
export interface EvolutionChange {
  readonly type: "add" | "replace" | "remove" | "scale" | "split" | "merge";
  readonly target: string;
  readonly description: string;
}
