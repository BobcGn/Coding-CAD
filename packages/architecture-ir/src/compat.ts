import type { Identifier, DiagnosticSeverity, RequirementLevel } from "./common.js";
import type { ArchitectureGraph } from "./architecture.js";
import type { Component } from "./component.js";
import type { DomainModel } from "./domain.js";
import type { ArchitectureDecision } from "./decision.js";
import type { EvolutionPlan } from "./evolution.js";

export type ConstraintCategory =
  | "consistency"
  | "availability"
  | "scalability"
  | "security"
  | "dependency"
  | "technology"
  | "domain"
  | "operational";

/**
 * Document provenance for imported or generated IR.
 */
export interface ArchitectureMetadata {
  readonly source?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
  readonly tags?: readonly string[];
}

/**
 * Early project-intent shape kept so existing DSL code can compile while the
 * canonical model moves to ProjectIntent.
 */
export interface LegacyProjectIntent {
  readonly name: string;
  readonly purpose?: readonly string[];
  readonly mission?: string;
  readonly scale?: {
    readonly users?: number;
    readonly peakQps?: number;
    readonly dataVolumeGb?: number;
    readonly availabilityTarget?: string;
  };
  readonly requirements?: {
    readonly consistency?: RequirementLevel;
    readonly latencyMsP95?: number;
    readonly compliance?: readonly string[];
    readonly deployment?: readonly string[];
    readonly extensibility?: RequirementLevel;
  };
  readonly stakeholders?: readonly string[];
  readonly nonGoals?: readonly string[];
}

/**
 * Early technology-binding shape. The new IR avoids binding components to
 * concrete technologies at the core layer, but existing validators still read
 * this data during the transition.
 */
export interface TechnologyBinding {
  readonly id: Identifier;
  readonly logicalRole: string;
  readonly technology: string;
  readonly componentId?: Identifier;
  readonly rationale?: string;
  readonly alternatives?: readonly string[];
  readonly phase?: string;
}

/**
 * Early constraint shape used by current validator diagnostics.
 * New ArchitectureProject documents should use Constraint.
 */
export interface ArchitectureConstraint {
  readonly id: Identifier;
  readonly category: ConstraintCategory;
  readonly severity: DiagnosticSeverity;
  readonly statement: string;
  readonly appliesTo?: readonly Identifier[];
  readonly rationale?: string;
}

/**
 * Diagnostic contract shared with validator packages.
 */
export interface ArchitectureDiagnostic {
  readonly id: string;
  readonly severity: DiagnosticSeverity;
  readonly message: string;
  readonly componentId?: Identifier;
  readonly connectionId?: Identifier;
  readonly rationale?: string;
}

/**
 * Compatibility shape used by the first DSL and validator packages.
 * New code should use ArchitectureProject as the canonical IR entry point.
 */
export interface ArchitectureIR {
  readonly schemaVersion: string;
  readonly project: LegacyProjectIntent;
  readonly domain?: DomainModel;
  readonly architecture: ArchitectureGraph;
  readonly technologyBindings?: readonly TechnologyBinding[];
  readonly constraints?: readonly ArchitectureConstraint[];
  readonly decisions?: readonly ArchitectureDecision[];
  readonly evolution?: EvolutionPlan;
  readonly metadata?: ArchitectureMetadata;
}

export type LegacyComponent = Component;
