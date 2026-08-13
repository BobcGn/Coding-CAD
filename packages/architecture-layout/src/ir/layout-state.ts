import type { LayoutDirection } from "../constraints/constraint.js";
import type { LayoutPoint, LayoutResult, LayoutSize } from "./layout-result.js";

export interface LayoutStateNode {
  readonly id: string;
  readonly position: LayoutPoint;
  readonly size: LayoutSize;
  readonly parentId?: string;
}

export interface LayoutStateEdge {
  readonly id: string;
  readonly from: string;
  readonly to: string;
}

/** Serializable in-memory state owned by a Workspace, never by Architecture IR. */
export interface LayoutState {
  readonly version: 1;
  readonly direction: LayoutDirection;
  readonly nodes: readonly LayoutStateNode[];
  readonly edges: readonly LayoutStateEdge[];
}

export function createLayoutState(result: LayoutResult): LayoutState {
  return {
    version: 1,
    direction: result.direction,
    nodes: result.nodes.map((node) => ({
      id: node.id,
      position: node.position,
      size: node.size,
      ...(node.parentId === undefined ? {} : { parentId: node.parentId })
    })),
    edges: result.edges.map((edge) => ({ id: edge.id, from: edge.from, to: edge.to }))
  };
}
