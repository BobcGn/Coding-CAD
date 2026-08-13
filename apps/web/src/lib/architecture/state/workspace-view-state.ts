import type { LayoutPoint, LayoutResult, LayoutState } from "@coding-cad/architecture-layout";

export interface ViewportState {
  readonly x: number;
  readonly y: number;
  readonly zoom: number;
}

export interface EphemeralUiState {
  readonly selectedNodeIds: readonly string[];
  readonly selectedEdgeIds: readonly string[];
  readonly viewport: ViewportState;
}

export function createEphemeralUiState(): EphemeralUiState {
  return { selectedNodeIds: [], selectedEdgeIds: [], viewport: { x: 0, y: 0, zoom: 1 } };
}

/** Drag changes Workspace-owned view state only; it never mutates LayoutResult or Architecture IR. */
export function persistDraggedPosition(
  state: LayoutState,
  nodeId: string,
  position: LayoutPoint
): LayoutState {
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return state;
  return {
    ...state,
    nodes: state.nodes.map((node) => node.id === nodeId ? { ...node, position: { ...position } } : node)
  };
}

export function resetToGeneratedLayout(result: LayoutResult): LayoutState {
  return {
    version: 1,
    direction: result.direction,
    nodes: result.nodes.map((node) => ({
      id: node.id,
      position: { ...node.position },
      size: { ...node.size },
      ...(node.parentId === undefined ? {} : { parentId: node.parentId })
    })),
    edges: result.edges.map((edge) => ({ id: edge.id, from: edge.from, to: edge.to }))
  };
}
