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
}

export type ArchitectureFlowNode = Node<ArchitectureNodeData, "architecture">;
export type ArchitectureFlowEdge = Edge<Record<string, never>, "smoothstep">;

export interface SvelteFlowProjection {
  readonly nodes: readonly ArchitectureFlowNode[];
  readonly edges: readonly ArchitectureFlowEdge[];
}

/** The sole one-way anti-corruption adapter from solver-neutral layout to Svelte Flow. */
export function toSvelteFlowProjection(
  projection: ArchitectureLayoutProjection,
  result: LayoutResult,
  viewState?: LayoutState
): SvelteFlowProjection {
  const visualById = new Map(projection.visualGraph.nodes.map((node) => [node.id, node]));
  const positionById = new Map(viewState?.nodes.map((node) => [node.id, node.position]) ?? []);

  const nodes = result.nodes.map<ArchitectureFlowNode>((node) => {
    const visual = visualById.get(node.id);
    if (visual === undefined) throw new Error(`Layout node ${node.id} has no visual source.`);
    const position = positionById.get(node.id) ?? node.position;
    return {
      id: node.id,
      type: "architecture",
      position: { ...position },
      width: node.size.width,
      height: node.size.height,
      parentId: node.parentId,
      ariaLabel: `${visual.label}, ${visual.role}`,
      data: { label: visual.label, compactLabel: visual.label.slice(0, 2).toUpperCase(), role: visual.role }
    };
  });

  const nodeIds = new Set(nodes.map(({ id }) => id));
  const edges = result.edges.map<ArchitectureFlowEdge>((edge) => {
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
      throw new Error(`Layout edge ${edge.id} has an invalid endpoint.`);
    }
    return {
      id: edge.id,
      type: "smoothstep",
      source: edge.from,
      target: edge.to,
      focusable: true,
      ariaLabel: `Connection from ${edge.from} to ${edge.to}`,
      data: {}
    };
  });

  return { nodes, edges };
}
