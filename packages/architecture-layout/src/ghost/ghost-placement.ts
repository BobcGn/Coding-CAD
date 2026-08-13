import type { LayoutGraph } from "../ir/layout-graph.js";
import type { LayoutPoint } from "../ir/layout-result.js";
import type { LayoutState } from "../ir/layout-state.js";
import { localPositionFor } from "../incremental/mental-map.js";

export function placeGhostNodes(
  nodeIds: readonly string[],
  proposedGraph: LayoutGraph,
  acceptedState: LayoutState
): ReadonlyMap<string, LayoutPoint> {
  const positions = new Map<string, LayoutPoint>();
  const occupied = acceptedState.nodes.map((node) => node.position);
  nodeIds.forEach((nodeId, index) => {
    const local = localPositionFor(nodeId, proposedGraph, acceptedState, occupied);
    const fallback = proposedGraph.direction === "LR"
      ? { x: acceptedState.nodes.length * 228, y: index * 120 }
      : { x: index * 228, y: acceptedState.nodes.length * 120 };
    const position = local ?? fallback;
    positions.set(nodeId, position);
    occupied.push(position);
  });
  return positions;
}
