import type {
  ArchitectureLayoutProjection,
  LayoutResult,
  LayoutSemanticRole,
  LayoutState
} from "@coding-cad/architecture-layout";
import type { Proposal } from "@coding-cad/architecture-review";
import type { Edge, Node } from "@xyflow/svelte";
import {
  calculateGhostPlacement,
  type GhostPlacementReasonCode,
  type Rect
} from "../../cad/canvas/adapters/ghost-placement.js";
import type {
  GhostPredictedNode,
  GhostPredictionState,
  GhostPredictionStatus
} from "../../architecture/greenfield/workspace-shell.js";

export type { GhostPredictedNode, GhostPredictionState, GhostPredictionStatus };

export type GhostStatus = "proposed" | "pending-change" | "pending-deletion";

export interface ArchitectureNodeData extends Record<string, unknown> {
  readonly label: string;
  readonly role: LayoutSemanticRole;
  readonly compactLabel: string;
  readonly kind?: "component" | "group";
  readonly groupId?: string;
  readonly memberCount?: number;
  readonly hiddenCount?: number;
  readonly collapsed?: boolean;
  readonly onToggleCollapse?: (groupId: string) => void;
  readonly isGhost?: boolean;
  readonly ghostStatus?: GhostStatus;
  readonly ghostPredictionStatus?: GhostPredictionStatus;
  readonly ghostLabel?: string;
  readonly ghostNotice?: string;
  readonly ghostReasonCode?: GhostPlacementReasonCode;
  readonly ghostDistanceToAnchor?: number;
  readonly ghostHeuristicPosition?: { x: number; y: number };
}

export interface ArchitectureEdgeData extends Record<string, unknown> {
  readonly isGhost?: boolean;
  readonly ghostStatus?: "proposed" | "pending-deletion";
  readonly ghostPredictionStatus?: GhostPredictionStatus;
  readonly ghostLabel?: string;
}

export type ArchitectureFlowNode = Node<ArchitectureNodeData, "architecture">;
export type ArchitectureFlowEdge = Edge<ArchitectureEdgeData, "smoothstep">;

export interface SvelteFlowProjection {
  readonly nodes: readonly ArchitectureFlowNode[];
  readonly edges: readonly ArchitectureFlowEdge[];
}

export interface SvelteFlowAdapterOptions {
  readonly collapsedGroupIds?: ReadonlySet<string>;
  readonly onToggleCollapse?: (groupId: string) => void;
  readonly ghostProposal?: Proposal | undefined;
  readonly ghostPrediction?: GhostPredictionState | undefined;
}

/** The sole one-way anti-corruption adapter from solver-neutral layout to Svelte Flow. */
export function toSvelteFlowProjection(
  projection: ArchitectureLayoutProjection,
  result: LayoutResult,
  viewState?: LayoutState,
  options: SvelteFlowAdapterOptions = {}
): SvelteFlowProjection {
  const visualById = new Map(projection.visualGraph.nodes.map((node) => [node.id, node]));
  const positionById = new Map(viewState?.nodes.map((node) => [node.id, node.position]) ?? []);
  const collapsedGroupIds = options.collapsedGroupIds ?? new Set<string>();

  const proposal = options.ghostProposal;
  const isPendingProposal = proposal !== undefined && (proposal.status === "draft" || proposal.status === "in-review");
  const diff = isPendingProposal ? proposal.impactAnalysis?.diff : undefined;

  const removedComponentIds = new Set(diff?.components.removed.map((c) => c.id) ?? []);
  const changedComponentIds = new Set(diff?.components.changed.map((c) => c.after.id) ?? []);
  const removedConnectionIds = new Set(diff?.connections.removed.map((c) => c.id) ?? []);

  // Count members per group
  const memberCounts = new Map<string, number>();
  for (const node of result.nodes) {
    if (node.parentId !== undefined) {
      memberCounts.set(node.parentId, (memberCounts.get(node.parentId) ?? 0) + 1);
    }
  }

  const hiddenNodeIds = new Set<string>();
  for (const node of result.nodes) {
    if (node.parentId !== undefined && collapsedGroupIds.has(node.parentId)) {
      hiddenNodeIds.add(node.id);
    }
  }

  const resultById = new Map(result.nodes.map((node) => [node.id, node]));
  const nodes = result.nodes.map<ArchitectureFlowNode>((node) => {
    const visual = visualById.get(node.id);
    if (visual === undefined) throw new Error(`Layout node ${node.id} has no visual source.`);
    const position = positionById.get(node.id) ?? node.position;
    const parentPosition = node.parentId === undefined ? undefined
      : positionById.get(node.parentId) ?? resultById.get(node.parentId)?.position;
    // LayoutResult/LayoutState are absolute; Svelte Flow children are parent-relative.
    const flowPosition = parentPosition === undefined ? position : {
      x: position.x - parentPosition.x, y: position.y - parentPosition.y
    };

    const isGroup = node.kind === "group";
    const isCollapsed = isGroup && collapsedGroupIds.has(node.id);
    const memberCount = isGroup ? (memberCounts.get(node.id) ?? 0) : undefined;
    const isHidden = hiddenNodeIds.has(node.id);

    const isPendingDeletion = removedComponentIds.has(node.id);
    const isPendingChange = changedComponentIds.has(node.id);

    const ghostStatus: GhostStatus | undefined = isPendingDeletion
      ? "pending-deletion"
      : isPendingChange
      ? "pending-change"
      : undefined;

    const ghostLabel = isPendingDeletion
      ? "[待删除 / Pending Deletion]"
      : isPendingChange
      ? "[待变更 / Pending Change]"
      : undefined;

    const ariaLabel = ghostLabel
      ? `${ghostLabel} ${visual.label}, ${visual.role}`
      : `${visual.label}, ${visual.role}`;

    return {
      id: node.id,
      type: "architecture",
      position: { ...flowPosition },
      width: node.size.width,
      height: node.size.height,
      parentId: node.parentId,
      hidden: isHidden,
      ariaLabel,
      data: {
        label: visual.label,
        compactLabel: visual.label.slice(0, 2).toUpperCase(),
        role: visual.role,
        kind: node.kind,
        groupId: node.id,
        memberCount,
        hiddenCount: isCollapsed ? memberCount : 0,
        collapsed: isCollapsed,
        onToggleCollapse: options.onToggleCollapse,
        isGhost: false,
        ghostStatus,
        ghostLabel
      }
    };
  });

  const nodeIds = new Set(nodes.map(({ id }) => id));
  const edges = result.edges.map<ArchitectureFlowEdge>((edge) => {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      throw new Error(`Layout edge ${edge.id} has an invalid endpoint.`);
    }
    const isHidden = hiddenNodeIds.has(edge.from) || hiddenNodeIds.has(edge.to);
    const isPendingDeletion = removedConnectionIds.has(edge.id);

    return {
      id: edge.id,
      type: "smoothstep",
      source: edge.from,
      target: edge.to,
      focusable: true,
      hidden: isHidden,
      ariaLabel: isPendingDeletion
        ? `[待删除 / Pending Deletion] Connection from ${edge.from} to ${edge.to}`
        : `Connection from ${edge.from} to ${edge.to}`,
      label: isPendingDeletion ? "[待删除 / Pending Deletion]" : undefined,
      style: isPendingDeletion ? "stroke: #ef4444; stroke-dasharray: 5 5; stroke-width: 2px;" : undefined,
      data: {
        isGhost: false,
        ghostStatus: isPendingDeletion ? "pending-deletion" : undefined,
        ghostLabel: isPendingDeletion ? "[待删除 / Pending Deletion]" : undefined
      }
    };
  });

  // Project Ghost nodes (newly proposed components)
  const ghostNodes: ArchitectureFlowNode[] = [];
  if (diff && diff.components.added.length > 0) {
    const formalRects: Rect[] = result.nodes.map((n) => {
      const pos = positionById.get(n.id) ?? n.position;
      return {
        id: n.id,
        x: pos.x,
        y: pos.y,
        width: n.size.width,
        height: n.size.height,
        parentId: n.parentId,
        kind: n.kind
      };
    });

    for (const added of diff.components.added) {
      const relatedFormalIds = [
        ...(diff.connections.added ?? [])
          .filter((c) => c.from === added.id || c.to === added.id)
          .map((c) => (c.from === added.id ? c.to : c.from)),
        ...(added.tags ?? [])
          .filter((t) => t.startsWith("anchor:") || t.startsWith("related:"))
          .map((t) => t.replace(/^(anchor|related):/, ""))
      ].filter((id) => formalRects.some((r) => r.id === id));

      let targetContainerId: string | undefined;
      for (const tag of added.tags ?? []) {
        const match = /^(module|domain):(.+)$/.exec(tag.trim());
        if (match) {
          const candidateId = `group:${match[1]}:${match[2]!.trim()}`;
          if (formalRects.some((r) => r.id === candidateId && r.kind === "group")) {
            targetContainerId = candidateId;
            break;
          }
        }
      }
      if (!targetContainerId && added.type !== undefined && ["database", "storage", "cache", "queue"].includes(added.type)) {
        if (formalRects.some((r) => r.id === "group:infrastructure" && r.kind === "group")) {
          targetContainerId = "group:infrastructure";
        }
      }

      const placement = calculateGhostPlacement({
        ghostId: added.id,
        relatedComponentIds: relatedFormalIds,
        formalNodes: formalRects,
        direction: result.direction,
        targetContainerId
      });

      const prediction = options.ghostPrediction;
      const isMatchingProposal = prediction !== undefined && proposal !== undefined && prediction.proposalId === proposal.id;
      const predictionStatus: GhostPredictionStatus | undefined = isMatchingProposal ? prediction.status : undefined;
      const predictedNode = isMatchingProposal && predictionStatus === "predicted"
        ? prediction.nodes?.[added.id]
        : undefined;

      const effectivePos = predictedNode !== undefined ? predictedNode.position : placement.position;
      const effectiveParentId = predictedNode !== undefined ? predictedNode.parentId : placement.parentId;

      let ghostLabel = "[待审批 / Proposed]";
      let ghostNotice = placement.containerNotice;
      if (predictionStatus === "predicting") {
        ghostLabel = "[预测中 / Predicting]";
      } else if (predictionStatus === "predicted") {
        ghostLabel = "[预测位置 / Predicted Position]";
        ghostNotice = "接受前若有其他变更，最终位置可能变化 / If other changes occur before acceptance, final position may change";
      } else if (predictionStatus === "unavailable") {
        ghostLabel = "[预测不可用 / Prediction Unavailable]";
        ghostNotice = prediction?.notice ?? "预测不可用，已回退至启发式放置";
      }

      const parentPos = effectiveParentId === undefined ? undefined
        : positionById.get(effectiveParentId) ?? resultById.get(effectiveParentId)?.position;
      const flowPos = parentPos === undefined ? effectivePos : {
        x: effectivePos.x - parentPos.x,
        y: effectivePos.y - parentPos.y
      };

      const role: LayoutSemanticRole = added.type === "external-service"
        ? "external"
        : (added.type as LayoutSemanticRole) ?? "service";

      const ariaLabel = predictionStatus === "predicted"
        ? `${ghostLabel} ${added.name}, ${role} - 接受前若有其他变更，最终位置可能变化`
        : `${ghostLabel} ${added.name}, ${role}`;

      ghostNodes.push({
        id: `ghost:${added.id}`,
        type: "architecture",
        position: flowPos,
        width: 220,
        height: 90,
        parentId: effectiveParentId,
        ariaLabel,
        data: {
          label: added.name,
          compactLabel: added.name.slice(0, 2).toUpperCase(),
          role,
          kind: "component",
          isGhost: true,
          ghostStatus: "proposed",
          ghostPredictionStatus: predictionStatus,
          ghostLabel,
          ghostNotice,
          ghostReasonCode: placement.reasonCode,
          ghostDistanceToAnchor: placement.distanceToAnchor,
          ghostHeuristicPosition: placement.position
        }
      });
    }
  }

  // Project Ghost edges (newly proposed connections)
  const ghostEdges: ArchitectureFlowEdge[] = [];
  if (diff && diff.connections.added.length > 0) {
    const addedCompIdSet = new Set(diff.components.added.map((c) => c.id));
    const prediction = options.ghostPrediction;
    const isMatchingProposal = prediction !== undefined && proposal !== undefined && prediction.proposalId === proposal.id;
    const predictionStatus: GhostPredictionStatus | undefined = isMatchingProposal ? prediction.status : undefined;

    let edgeLabel = "[待审批 / Proposed]";
    if (predictionStatus === "predicting") {
      edgeLabel = "[预测中 / Predicting]";
    } else if (predictionStatus === "predicted") {
      edgeLabel = "[预测位置 / Predicted Position]";
    } else if (predictionStatus === "unavailable") {
      edgeLabel = "[预测不可用 / Prediction Unavailable]";
    }

    for (const conn of diff.connections.added) {
      const sourceId = addedCompIdSet.has(conn.from) ? `ghost:${conn.from}` : conn.from;
      const targetId = addedCompIdSet.has(conn.to) ? `ghost:${conn.to}` : conn.to;
      const edgeAriaLabel = `${edgeLabel} Connection from ${conn.from} to ${conn.to}`;

      ghostEdges.push({
        id: `ghost:connection:${conn.id}`,
        type: "smoothstep",
        source: sourceId,
        target: targetId,
        focusable: true,
        ariaLabel: edgeAriaLabel,
        label: edgeLabel,
        style: "stroke: #8b5cf6; stroke-dasharray: 5 5; stroke-width: 2px;",
        data: {
          isGhost: true,
          ghostStatus: "proposed",
          ghostPredictionStatus: predictionStatus,
          ghostLabel: edgeLabel
        }
      });
    }
  }

  return {
    nodes: [...nodes, ...ghostNodes],
    edges: [...edges, ...ghostEdges]
  };
}
