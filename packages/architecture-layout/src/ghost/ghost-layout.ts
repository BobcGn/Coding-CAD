import type { LayoutGraph } from "../ir/layout-graph.js";
import type { LayoutPoint, LayoutSize } from "../ir/layout-result.js";
import type { LayoutState } from "../ir/layout-state.js";
import { placeGhostNodes } from "./ghost-placement.js";

export interface GhostLayoutNode {
  readonly id: string;
  readonly proposalId: string;
  readonly sourceId: string;
  readonly position: LayoutPoint;
  readonly size: LayoutSize;
}

export interface GhostLayoutEdge {
  readonly id: string;
  readonly proposalId: string;
  readonly sourceId: string;
  readonly from: string;
  readonly to: string;
}

export interface GhostLayoutProjection {
  readonly proposalId: string;
  readonly nodes: readonly GhostLayoutNode[];
  readonly edges: readonly GhostLayoutEdge[];
}

/** Projects only proposal additions; presentation and review behavior remain outside this package. */
export function createGhostLayoutProjection(
  proposalId: string,
  acceptedGraph: LayoutGraph,
  proposedGraph: LayoutGraph,
  acceptedState: LayoutState
): GhostLayoutProjection {
  if (proposalId.trim().length === 0) throw new Error("Ghost proposal identity must not be empty.");
  const acceptedNodeIds = new Set(acceptedGraph.nodes.map((node) => node.id));
  const acceptedEdgeIds = new Set(acceptedGraph.edges.map((edge) => edge.id));
  const addedNodes = proposedGraph.nodes.filter((node) => !acceptedNodeIds.has(node.id));
  const ghostIdBySource = new Map(addedNodes.map((node) => [node.id, ghostIdentity(proposalId, "node", node.id)]));
  const positions = placeGhostNodes(addedNodes.map((node) => node.id), proposedGraph, acceptedState);
  const nodes = addedNodes.map((node): GhostLayoutNode => ({
    id: ghostIdBySource.get(node.id)!,
    proposalId,
    sourceId: node.sourceId,
    position: positions.get(node.id)!,
    size: { width: 180, height: 72 }
  }));
  const edges = proposedGraph.edges
    .filter((edge) => !acceptedEdgeIds.has(edge.id) && (ghostIdBySource.has(edge.from) || ghostIdBySource.has(edge.to)))
    .map((edge): GhostLayoutEdge => ({
      id: ghostIdentity(proposalId, "edge", edge.id),
      proposalId,
      sourceId: edge.sourceId,
      from: ghostIdBySource.get(edge.from) ?? edge.from,
      to: ghostIdBySource.get(edge.to) ?? edge.to
    }));
  return { proposalId, nodes, edges };
}

function ghostIdentity(proposalId: string, kind: "node" | "edge", sourceId: string): string {
  return `ghost:${proposalId}:${kind}:${sourceId}`;
}
