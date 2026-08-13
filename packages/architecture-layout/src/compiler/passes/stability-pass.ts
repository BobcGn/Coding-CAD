import type { LayoutGraph } from "../../ir/layout-graph.js";
import type { LayoutResult } from "../../ir/layout-result.js";
import type { LayoutState } from "../../ir/layout-state.js";
import { localPositionFor, type LayoutChangeSet } from "../../incremental/mental-map.js";

export function runStabilityPass(
  graph: LayoutGraph,
  fresh: LayoutResult,
  previous: LayoutState,
  changes: LayoutChangeSet
): LayoutResult {
  const previousById = new Map(previous.nodes.map((node) => [node.id, node]));
  const occupied = previous.nodes.map((node) => node.position);
  const nodes = fresh.nodes.map((node) => {
    const prior = previousById.get(node.id);
    if (prior !== undefined && !changes.affectedNodeIds.has(node.id)) {
      return { ...node, position: prior.position, size: prior.size };
    }
    if (changes.addedNodeIds.has(node.id)) {
      const local = localPositionFor(node.id, graph, previous, occupied);
      if (local !== undefined) {
        occupied.push(local);
        return { ...node, position: local };
      }
    }
    occupied.push(node.position);
    return node;
  });
  const width = nodes.reduce((maximum, node) => Math.max(maximum, node.position.x + node.size.width), 0);
  const height = nodes.reduce((maximum, node) => Math.max(maximum, node.position.y + node.size.height), 0);
  return {
    ...fresh,
    size: { width, height },
    nodes,
    // Solver routes refer to the fresh coordinates and must not survive node stabilization.
    edges: fresh.edges.map((edge) => ({ ...edge, sections: [] }))
  };
}
