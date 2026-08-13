import type { ArchitectureProject, Component } from "@coding-cad/architecture-ir";
import type { VisualGroupKind } from "../../ir/visual-graph.js";
import type { SemanticClassification } from "../../semantic/roles.js";

export interface AbstractionGroup {
  readonly id: string;
  readonly label: string;
  readonly kind: VisualGroupKind;
  readonly memberIds: readonly string[];
  readonly provenance: string;
}

export interface AbstractionResult {
  readonly groups: readonly AbstractionGroup[];
  readonly parentByComponentId: Readonly<Record<string, string>>;
}

export function runAbstractionPass(
  project: ArchitectureProject,
  classifications: readonly SemanticClassification[]
): AbstractionResult {
  const candidates = new Map<string, Omit<AbstractionGroup, "memberIds"> & { memberIds: string[] }>();

  for (const component of project.architecture.components) {
    const classification = classifications.find((item) => item.componentId === component.id);
    const group = explicitGroup(component) ?? infrastructureGroup(classification);
    if (group === undefined) continue;

    const current = candidates.get(group.id) ?? { ...group, memberIds: [] };
    current.memberIds.push(component.id);
    candidates.set(group.id, current);
  }

  const groups = [...candidates.values()]
    .map((group) => ({ ...group, memberIds: [...group.memberIds].sort() }))
    .sort((left, right) => left.id.localeCompare(right.id));
  const parentEntries = groups.flatMap((group) => group.memberIds.map((id) => [id, group.id] as const));
  return { groups, parentByComponentId: Object.fromEntries(parentEntries) };
}

function explicitGroup(component: Component): Omit<AbstractionGroup, "memberIds"> | undefined {
  for (const tag of component.tags ?? []) {
    const match = /^(module|domain):(.+)$/.exec(tag.trim());
    if (match === null) continue;
    const kind = match[1] as "module" | "domain";
    const value = match[2]!.trim();
    if (value.length === 0) continue;
    return { id: `group:${kind}:${value}`, label: value, kind, provenance: `component.tags:${tag}` };
  }
  return undefined;
}

function infrastructureGroup(
  classification: SemanticClassification | undefined
): Omit<AbstractionGroup, "memberIds"> | undefined {
  if (classification === undefined || !["database", "storage", "cache", "queue", "external"].includes(classification.role)) {
    return undefined;
  }
  return {
    id: "group:infrastructure",
    label: "Infrastructure",
    kind: "infrastructure",
    provenance: "layout semantic role"
  };
}
