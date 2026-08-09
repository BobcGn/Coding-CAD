import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import type { ExecutionBlueprint } from "@coding-cad/execution-blueprint";
import type { RepositoryInspection } from "@coding-cad/implementation-analyzer";

/** Analyzer evidence plus its Architecture IR projection; not a parallel architecture model. */
export interface ImplementationModel extends RepositoryInspection {
  readonly architecture: ArchitectureProject;
}

export interface ComplianceContext {
  readonly architecture: ArchitectureProject;
  readonly implementation: ImplementationModel;
  readonly blueprint?: ExecutionBlueprint;
}

export type ComplianceSeverity = "INFO" | "WARNING" | "ERROR";

/** Explainable divergence between approved architecture and detected implementation. */
export interface ComplianceIssue {
  readonly id: string;
  readonly severity: ComplianceSeverity;
  readonly title: string;
  readonly description: string;
  readonly architectureExpectation: string;
  readonly implementationEvidence: string;
  readonly recommendation: string;
}

export interface ComplianceReport {
  readonly passed: boolean;
  readonly issues: readonly ComplianceIssue[];
  readonly summary: string;
}

export interface ComplianceRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  validate(context: ComplianceContext): readonly ComplianceIssue[];
}

export function createImplementationModel(
  inspection: RepositoryInspection,
  architecture: ArchitectureProject
): ImplementationModel {
  return { ...inspection, architecture };
}
