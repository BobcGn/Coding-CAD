import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import type { VisualGraph, VisualNode } from "../../ir/visual-graph.js";
import { hintsForRole } from "../../semantic/hints.js";
import type { SemanticClassification } from "../../semantic/roles.js";
import type { AbstractionResult } from "./abstraction-pass.js";

export function runVisualIrPass(
  project: ArchitectureProject,
  classifications: readonly SemanticClassification[],
  abstraction: AbstractionResult
): VisualGraph {
  const groups: VisualNode[] = abstraction.groups.map((group) => ({
    id: group.id,
    sourceId: group.id,
    kind: "group",
    label: group.label,
    role: "unknown",
    groupKind: group.kind,
    hints: hintsForRole("unknown")
  }));

  const components: VisualNode[] = project.architecture.components.map((component) => {
    const classification = classifications.find((item) => item.componentId === component.id);
    if (classification === undefined) throw new Error(`Missing semantic classification for component ${component.id}`);
    const parentId = abstraction.parentByComponentId[component.id];
    return {
      id: component.id,
      sourceId: component.id,
      kind: "component",
      label: component.name,
      role: classification.role,
      ...(parentId === undefined ? {} : { parentId }),
      classification,
      hints: hintsForRole(classification.role)
    };
  });

  return {
    nodes: [...groups, ...components],
    edges: project.architecture.connections.map((connection) => {
      const label = connection.description ?? connection.purpose;
      return {
        id: connection.id,
        sourceId: connection.id,
        from: connection.from,
        to: connection.to,
        ...(label === undefined ? {} : { label }),
        asynchronous: connection.mode === "async"
      };
    })
  };
}
