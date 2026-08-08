import type { ArchitectureGraph } from "./architecture.js";
import type { Constraint } from "./constraint.js";
import type { ArchitectureDecision } from "./decision.js";
import type { DomainModel } from "./domain.js";
import type { EvolutionPlan } from "./evolution.js";
import type { ProjectIntent } from "./project.js";

/**
 * Top-level Architecture IR document.
 * This is the stable handoff object between humans, DSLs, visualization tools,
 * and AI Agents. It describes software architecture intent, not generated code.
 */
export interface ArchitectureProject {
  /**
   * Version of the IR document schema, not the product being modeled.
   */
  readonly version: string;

  /**
   * Business and quality goals that make the system worth building.
   */
  readonly intent: ProjectIntent;

  /**
   * Domain vocabulary the architecture is meant to protect.
   */
  readonly domain: DomainModel;

  /**
   * Component graph that shows structure and communication boundaries.
   */
  readonly architecture: ArchitectureGraph;

  /**
   * Non-negotiable or explicitly tracked architecture limits.
   */
  readonly constraints: readonly Constraint[];

  /**
   * Rationale records that explain why important tradeoffs were accepted.
   */
  readonly decisions: readonly ArchitectureDecision[];

  /**
   * Optional future path; absence means the current model only describes now.
   */
  readonly evolution?: EvolutionPlan;
}
