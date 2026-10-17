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
  inspection: Partial<RepositoryInspection> | {
    readonly languages?: readonly string[];
    readonly configFiles?: readonly string[];
    readonly dependencies?: readonly string[];
    readonly unsupportedStructures?: readonly unknown[];
    readonly truncated?: unknown;
  },
  architecture: ArchitectureProject
): ImplementationModel {
  const record = inspection as Record<string, unknown>;
  const languages = Array.isArray(record.languages) ? (record.languages as readonly string[]) : [];
  const configFiles = Array.isArray(record.configFiles) ? (record.configFiles as readonly string[]) : [];
  const dependencies = Array.isArray(record.dependencies) ? (record.dependencies as readonly string[]) : [];

  return {
    snapshot: (record.snapshot as RepositoryInspection["snapshot"]) ?? {
      root: "",
      languages,
      configFiles,
      files: [],
      dependencies
    },
    technology: (record.technology as RepositoryInspection["technology"]) ?? {
      languages,
      frameworks: [],
      databases: [],
      libraries: dependencies
    },
    modules: (record.modules as RepositoryInspection["modules"]) ?? [],
    dependencyGraph: (record.dependencyGraph as RepositoryInspection["dependencyGraph"]) ?? {
      modules: [],
      moduleDependencies: []
    },
    unsupportedStructures: record.unsupportedStructures as RepositoryInspection["unsupportedStructures"],
    isTruncated: typeof record.isTruncated === "boolean" ? record.isTruncated : record.truncated !== undefined,
    truncationReason: typeof record.truncationReason === "string" ? record.truncationReason : undefined,
    architecture
  };
}

export interface IssueTarget {
  readonly type: "component" | "connection";
  readonly targetId: string;
  readonly from?: string | undefined;
  readonly to?: string | undefined;
}

export function resolveIssueTarget(issue: ComplianceIssue): IssueTarget | undefined {
  if (issue.id.startsWith("component.missing.")) {
    const componentId = issue.id.replace("component.missing.", "");
    return { type: "component", targetId: componentId };
  }
  if (issue.id.startsWith("technology.deviation.")) {
    const componentId = issue.id.replace("technology.deviation.", "");
    return { type: "component", targetId: componentId };
  }
  if (issue.id.startsWith("component.limitation.")) {
    const parts = issue.id.split(".");
    const componentId = parts[2] ?? "";
    return { type: "component", targetId: componentId };
  }
  if (issue.id.startsWith("dependency.unapproved.")) {
    const rest = issue.id.replace("dependency.unapproved.", "");
    const [from, to] = rest.split(".");
    return { type: "connection", targetId: `${from}->${to}`, from, to };
  }
  if (issue.id.startsWith("dependency.missing.")) {
    const rest = issue.id.replace("dependency.missing.", "");
    const parts = rest.split("-to-");
    const from = parts[0];
    const to = parts[1];
    return { type: "connection", targetId: rest, from, to };
  }
  if (issue.id.startsWith("contract.")) {
    const parts = issue.id.split(".");
    const componentId = parts[2] ?? "";
    return { type: "component", targetId: componentId };
  }
  return undefined;
}

export function isContractIssue(issue: ComplianceIssue): boolean {
  return issue.id.startsWith("contract.");
}

