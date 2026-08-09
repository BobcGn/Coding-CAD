import type { ValidationIssue, ValidationResult } from "@coding-cad/architecture-validator";
import { compareArchitectures, type ArchitectureDiff } from "@coding-cad/workspace";
import type { ArchitectureChange } from "./proposal.js";

export type ImpactRisk = "low" | "medium" | "high";
export type ArchitectureArea =
  | "intent"
  | "domain"
  | "components"
  | "connections"
  | "constraints"
  | "decisions"
  | "evolution";

export interface ImpactAnalysis {
  readonly risk: ImpactRisk;
  readonly summary: string;
  readonly changedAreas: readonly ArchitectureArea[];
  readonly affectedComponentIds: readonly string[];
  readonly reasons: readonly string[];
  readonly validationIssues: readonly ValidationIssue[];
  readonly diff: ArchitectureDiff;
}

export function analyzeImpact(
  change: ArchitectureChange,
  validation: ValidationResult
): ImpactAnalysis {
  const { baseArchitecture: before, proposedArchitecture: after } = change;
  const diff = compareArchitectures(
    before,
    after,
    change.baseVersion,
    change.proposedVersion
  );
  const changedAreas = detectChangedAreas(before, after, diff);
  const affectedComponentIds = unique([
    ...diff.components.added.map((component) => component.id),
    ...diff.components.removed.map((component) => component.id),
    ...diff.components.changed.flatMap((component) => [component.before.id, component.after.id]),
    ...diff.connections.added.flatMap((connection) => [connection.from, connection.to]),
    ...diff.connections.removed.flatMap((connection) => [connection.from, connection.to]),
    ...diff.connections.changed.flatMap((connection) => [
      connection.before.from,
      connection.before.to,
      connection.after.from,
      connection.after.to
    ]),
    ...validation.issues.flatMap((issue) => issue.affectedComponent ? [issue.affectedComponent] : [])
  ]);
  const reasons = buildReasons(diff, validation);
  const risk = determineRisk(diff, validation);

  return {
    risk,
    summary: changedAreas.length === 0
      ? "The proposal contains no observable Architecture IR changes."
      : `${risk.toUpperCase()} impact across ${changedAreas.join(", ")}.`,
    changedAreas,
    affectedComponentIds,
    reasons,
    validationIssues: validation.issues,
    diff
  };
}

function detectChangedAreas(
  before: ArchitectureChange["baseArchitecture"],
  after: ArchitectureChange["proposedArchitecture"],
  diff: ArchitectureDiff
): ArchitectureArea[] {
  const areas: ArchitectureArea[] = [];
  if (!sameValue(before.intent, after.intent)) areas.push("intent");
  if (!sameValue(before.domain, after.domain)) areas.push("domain");
  if (hasCollectionChanges(diff.components)) areas.push("components");
  if (hasCollectionChanges(diff.connections)) areas.push("connections");
  if (hasCollectionChanges(diff.constraints)) areas.push("constraints");
  if (!sameValue(before.decisions, after.decisions)) areas.push("decisions");
  if (!sameValue(before.evolution, after.evolution)) areas.push("evolution");
  return areas;
}

function determineRisk(diff: ArchitectureDiff, validation: ValidationResult): ImpactRisk {
  if (
    !validation.valid
    || diff.components.removed.length > 0
    || diff.connections.removed.length > 0
  ) {
    return "high";
  }
  if (
    diff.components.changed.length > 0
    || diff.connections.changed.length > 0
    || diff.constraints.changed.length > 0
    || validation.issues.some((issue) => issue.severity === "WARNING")
  ) {
    return "medium";
  }
  return "low";
}

function buildReasons(diff: ArchitectureDiff, validation: ValidationResult): string[] {
  const reasons: string[] = [];
  if (!validation.valid) reasons.push("The proposed Architecture IR has validation errors.");
  if (diff.components.added.length > 0) reasons.push(`${diff.components.added.length} component(s) added.`);
  if (diff.components.removed.length > 0) reasons.push(`${diff.components.removed.length} component(s) removed.`);
  if (diff.components.changed.length > 0) reasons.push(`${diff.components.changed.length} component(s) changed.`);
  if (diff.connections.added.length > 0) reasons.push(`${diff.connections.added.length} connection(s) added.`);
  if (diff.connections.removed.length > 0) reasons.push(`${diff.connections.removed.length} connection(s) removed.`);
  if (diff.connections.changed.length > 0) reasons.push(`${diff.connections.changed.length} connection(s) changed.`);
  if (hasCollectionChanges(diff.constraints)) reasons.push("Architecture constraints changed.");
  return reasons;
}

function hasCollectionChanges(value: {
  readonly added: readonly unknown[];
  readonly removed: readonly unknown[];
  readonly changed: readonly unknown[];
}): boolean {
  return value.added.length > 0 || value.removed.length > 0 || value.changed.length > 0;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function sameValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
