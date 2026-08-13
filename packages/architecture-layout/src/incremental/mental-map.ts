import type { LayoutGraph } from "../ir/layout-graph.js";
import type { LayoutPoint } from "../ir/layout-result.js";
import type { LayoutState } from "../ir/layout-state.js";

export interface LayoutChangeSet {
  readonly addedNodeIds: ReadonlySet<string>;
  readonly removedNodeIds: ReadonlySet<string>;
  readonly addedEdgeIds: ReadonlySet<string>;
  readonly removedEdgeIds: ReadonlySet<string>;
  readonly affectedNodeIds: ReadonlySet<string>;
}

export function deriveLayoutChanges(graph: LayoutGraph, previous: LayoutState): LayoutChangeSet {
  const previousNodeIds = new Set(previous.nodes.map((node) => node.id));
  const currentNodeIds = new Set(graph.nodes.map((node) => node.id));
  const previousEdges = new Map(previous.edges.map((edge) => [edge.id, edge]));
  const currentEdges = new Map(graph.edges.map((edge) => [edge.id, edge]));
  const addedNodeIds = difference(currentNodeIds, previousNodeIds);
  const removedNodeIds = difference(previousNodeIds, currentNodeIds);
  const addedEdgeIds = difference(new Set(currentEdges.keys()), new Set(previousEdges.keys()));
  const removedEdgeIds = difference(new Set(previousEdges.keys()), new Set(currentEdges.keys()));
  const affectedNodeIds = new Set<string>([...addedNodeIds, ...removedNodeIds]);

  for (const edgeId of [...addedEdgeIds, ...removedEdgeIds]) {
    const edge = currentEdges.get(edgeId) ?? previousEdges.get(edgeId);
    if (edge !== undefined) {
      affectedNodeIds.add(edge.from);
      affectedNodeIds.add(edge.to);
    }
  }
  for (const node of graph.nodes) {
    const previousNode = previous.nodes.find((item) => item.id === node.id);
    if (previousNode?.parentId !== node.parentId) affectedNodeIds.add(node.id);
    if (node.parentId !== undefined && affectedNodeIds.has(node.id)) affectedNodeIds.add(node.parentId);
  }
  return { addedNodeIds, removedNodeIds, addedEdgeIds, removedEdgeIds, affectedNodeIds };
}

export function localPositionFor(
  nodeId: string,
  graph: LayoutGraph,
  previous: LayoutState,
  occupied: readonly LayoutPoint[]
): LayoutPoint | undefined {
  const edge = graph.edges.find((item) => item.from === nodeId || item.to === nodeId);
  const neighborId = edge?.from === nodeId ? edge.to : edge?.from;
  const anchor = previous.nodes.find((node) => node.id === neighborId)?.position;
  if (anchor === undefined) return undefined;

  const primary = graph.direction === "LR" ? { x: 228, y: 0 } : { x: 0, y: 120 };
  for (let step = 1; step <= 8; step += 1) {
    const candidate = {
      x: anchor.x + primary.x * step,
      y: anchor.y + primary.y * step
    };
    if (occupied.every((point) => Math.hypot(point.x - candidate.x, point.y - candidate.y) >= 48)) return candidate;
  }
  return undefined;
}

function difference(left: ReadonlySet<string>, right: ReadonlySet<string>): Set<string> {
  return new Set([...left].filter((value) => !right.has(value)));
}
