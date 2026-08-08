import type { ConsistencyLevel } from "./common.js";

/**
 * Human intent for the project. This section describes why the software should
 * exist and what qualities it must satisfy, before any implementation choice.
 */
export interface ProjectIntent {
  /**
   * Product or system name, independent of repository or package names.
   */
  readonly name: string;

  /**
   * Reasons the system exists. Keep these as explicit statements so Agents can
   * preserve product intent when suggesting architecture changes.
   */
  readonly purpose: readonly string[];

  /**
   * Compatibility alias from the early DSL. Prefer `purpose` for new documents.
   */
  readonly mission?: string;

  readonly scale?: ProjectScale;
  readonly requirements?: ProjectRequirements;

  /**
   * Human groups or systems whose needs shape architecture decisions.
   */
  readonly stakeholders?: readonly string[];

  /**
   * Explicitly excluded goals, useful for preventing AI tools from overbuilding.
   */
  readonly nonGoals?: readonly string[];
}

/**
 * Approximate operating scale. These values guide architecture reasoning but
 * should not be treated as capacity-planning proof.
 */
export interface ProjectScale {
  readonly users?: number;
  readonly peakQps?: number;
  readonly dataVolumeGb?: number;
  readonly availabilityTarget?: string;
}

/**
 * Quality requirements that shape design choices before technology selection.
 */
export interface ProjectRequirements {
  readonly consistency?: ConsistencyLevel;
  readonly availability?: string;
  readonly latencyMs?: number;
  readonly latencyMsP95?: number;
  readonly compliance?: readonly string[];
  readonly deployment?: readonly string[];
  readonly extensibility?: "low" | "medium" | "high" | "strong";
}
