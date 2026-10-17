import type {
  ArchitectureLayoutProjection,
  LayoutResult,
  LayoutSemanticRole,
  LayoutState
} from "@coding-cad/architecture-layout";
import type { Edge, Node } from "@xyflow/svelte";

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
}

export type ArchitectureFlowNode = Node<ArchitectureNodeData, "architecture">;
export type ArchitectureFlowEdge = Edge<Record<string, never>, "smoothstep">;

export interface SvelteFlowProjection {
  readonly nodes: readonly ArchitectureFlowNode[];
  readonly edges: readonly ArchitectureFlowEdge[];
}

export interface SvelteFlowAdapterOptions {
  readonly collapsedGroupIds?: ReadonlySet<string>;
  readonly onToggleCollapse?: (groupId: string) => void;
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

    return {
      id: node.id,
      type: "architecture",
      position: { ...flowPosition },
      width: node.size.width,
      height: node.size.height,
      parentId: node.parentId,
      hidden: isHidden,
      ariaLabel: `${visual.label}, ${visual.role}`,
      data: {
        label: visual.label,
        compactLabel: visual.label.slice(0, 2).toUpperCase(),
        role: visual.role,
        kind: node.kind,
        groupId: node.id,
        memberCount,
        hiddenCount: isCollapsed ? memberCount : 0,
        collapsed: isCollapsed,
        onToggleCollapse: options.onToggleCollapse
      }
    };
  });

  const nodeIds = new Set(nodes.map(({ id }) => id));
  const edges = result.edges.map<ArchitectureFlowEdge>((edge) => {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      throw new Error(`Layout edge ${edge.id} has an invalid endpoint.`);
    }
    const isHidden = hiddenNodeIds.has(edge.from) || hiddenNodeIds.has(edge.to);
    return {
      id: edge.id,
      type: "smoothstep",
      source: edge.from,
      target: edge.to,
      focusable: true,
      hidden: isHidden,
      ariaLabel: `Connection from ${edge.from} to ${edge.to}`,
      data: {}
    };
  });

  return { nodes, edges };
}
