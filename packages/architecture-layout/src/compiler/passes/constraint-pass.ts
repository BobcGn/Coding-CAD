import type { LayoutConstraint, LayoutDirection } from "../../constraints/constraint.js";
import type { LayoutGraph } from "../../ir/layout-graph.js";
import type { VisualGraph } from "../../ir/visual-graph.js";

export function runConstraintPass(visualGraph: VisualGraph, direction: LayoutDirection = "LR"): LayoutGraph {
  const constraints: LayoutConstraint[] = [
    { kind: "direction", direction, strength: "required" },
    ...visualGraph.nodes.filter((node) => node.kind === "component").map((node) => ({
      kind: "rank" as const,
      nodeId: node.id,
      rank: node.hints.preferredRank,
      strength: "preferred" as const
    })),
    ...visualGraph.nodes.filter((node) => node.kind === "group").map((group) => ({
      kind: "group" as const,
      groupId: group.id,
      memberIds: visualGraph.nodes.filter((node) => node.parentId === group.id).map((node) => node.id).sort(),
      groupKind: group.groupKind!,
      strength: "required" as const
    })),
    ...visualGraph.edges.flatMap((edge) => {
      const target = visualGraph.nodes.find((node) => node.id === edge.to);
      return target?.role === "cache"
        ? [{ kind: "proximity" as const, nodeIds: [edge.from, edge.to] as const, reason: "ownership" as const, strength: "preferred" as const }]
        : [];
    })
  ];
  return { direction, nodes: visualGraph.nodes, edges: visualGraph.edges, constraints };
}
