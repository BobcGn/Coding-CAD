import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk-api.js";
import type { LayoutGraph } from "../../ir/layout-graph.js";
import type {
  LayoutDiagnostic,
  LayoutPoint,
  LayoutResult,
  LayoutResultEdge,
  LayoutResultNode
} from "../../ir/layout-result.js";
import { createElkLayoutOptions, DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from "./options.js";

export function toElkGraph(graph: LayoutGraph): ElkNode {
  const nodesByParent = new Map<string | undefined, ElkNode[]>();
  for (const node of graph.nodes) {
    const entry: ElkNode = {
      id: node.id,
      width: DEFAULT_NODE_WIDTH,
      height: node.kind === "group" ? DEFAULT_NODE_HEIGHT : DEFAULT_NODE_HEIGHT
    };
    const siblings = nodesByParent.get(node.parentId) ?? [];
    siblings.push(entry);
    nodesByParent.set(node.parentId, siblings);
  }

  for (const group of graph.nodes.filter((node) => node.kind === "group")) {
    const elkGroup = findNode(nodesByParent.get(undefined) ?? [], group.id);
    if (elkGroup !== undefined) elkGroup.children = nodesByParent.get(group.id) ?? [];
  }

  return {
    id: "root",
    layoutOptions: createElkLayoutOptions(graph.direction),
    children: nodesByParent.get(undefined) ?? [],
    edges: graph.edges.map((edge): ElkExtendedEdge => ({
      id: edge.id,
      sources: [edge.from],
      targets: [edge.to]
    }))
  };
}

export function fromElkGraph(graph: LayoutGraph, elkGraph: ElkNode): LayoutResult {
  const sourceById = new Map(graph.nodes.map((node) => [node.id, node]));
  const nodes = flattenNodes(elkGraph.children ?? [], sourceById);
  const edges = (elkGraph.edges ?? []).map((edge): LayoutResultEdge => {
    const source = graph.edges.find((item) => item.id === edge.id);
    if (source === undefined) throw new Error(`Unknown solver edge: ${edge.id}`);
    return {
      id: edge.id,
      sourceId: source.sourceId,
      from: source.from,
      to: source.to,
      sections: (edge.sections ?? []).map((section) => ({
        start: finitePoint(section.startPoint, `${edge.id}.startPoint`),
        end: finitePoint(section.endPoint, `${edge.id}.endPoint`),
        bendPoints: (section.bendPoints ?? []).map((point, index) => finitePoint(point, `${edge.id}.bendPoints[${index}]`))
      }))
    };
  });

  const result: LayoutResult = {
    status: "success",
    direction: graph.direction,
    size: {
      width: finiteNumber(elkGraph.width, "root.width"),
      height: finiteNumber(elkGraph.height, "root.height")
    },
    nodes,
    edges,
    diagnostics: []
  };
  validateLayoutResult(graph, result);
  return result;
}

export function createFallbackResult(graph: LayoutGraph, diagnostic: LayoutDiagnostic): LayoutResult {
  const gap = 48;
  const nodes: LayoutResultNode[] = graph.nodes.map((node, index) => ({
    id: node.id,
    sourceId: node.sourceId,
    kind: node.kind,
    position: graph.direction === "LR"
      ? { x: index * (DEFAULT_NODE_WIDTH + gap), y: 0 }
      : { x: 0, y: index * (DEFAULT_NODE_HEIGHT + gap) },
    size: { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT },
    ...(node.parentId === undefined ? {} : { parentId: node.parentId })
  }));
  return {
    status: "fallback",
    direction: graph.direction,
    size: graph.direction === "LR"
      ? { width: Math.max(0, nodes.length * (DEFAULT_NODE_WIDTH + gap) - gap), height: DEFAULT_NODE_HEIGHT }
      : { width: DEFAULT_NODE_WIDTH, height: Math.max(0, nodes.length * (DEFAULT_NODE_HEIGHT + gap) - gap) },
    nodes,
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      sourceId: edge.sourceId,
      from: edge.from,
      to: edge.to,
      sections: []
    })),
    diagnostics: [diagnostic]
  };
}

export function validateLayoutResult(graph: LayoutGraph, result: LayoutResult): void {
  const nodeIds = new Set<string>();
  for (const node of result.nodes) {
    if (nodeIds.has(node.id)) throw new Error(`Duplicate result node id: ${node.id}`);
    nodeIds.add(node.id);
    finiteNumber(node.position.x, `${node.id}.x`);
    finiteNumber(node.position.y, `${node.id}.y`);
    finiteNumber(node.size.width, `${node.id}.width`);
    finiteNumber(node.size.height, `${node.id}.height`);
  }
  const sourceNodeIds = new Set(graph.nodes.map((node) => node.id));
  if (nodeIds.size !== sourceNodeIds.size || [...sourceNodeIds].some((id) => !nodeIds.has(id))) {
    throw new Error("Layout result does not contain exactly the source graph nodes.");
  }
  const edgeIds = new Set<string>();
  for (const edge of result.edges) {
    if (edgeIds.has(edge.id)) throw new Error(`Duplicate result edge id: ${edge.id}`);
    edgeIds.add(edge.id);
    if (!sourceNodeIds.has(edge.from) || !sourceNodeIds.has(edge.to)) {
      throw new Error(`Invalid result edge endpoints: ${edge.id}`);
    }
    for (const [index, section] of edge.sections.entries()) {
      finitePoint(section.start, `${edge.id}.sections[${index}].start`);
      finitePoint(section.end, `${edge.id}.sections[${index}].end`);
      section.bendPoints.forEach((point, pointIndex) => finitePoint(point, `${edge.id}.sections[${index}].bendPoints[${pointIndex}]`));
    }
  }
  const sourceEdgeIds = new Set(graph.edges.map((edge) => edge.id));
  if (edgeIds.size !== sourceEdgeIds.size || [...sourceEdgeIds].some((id) => !edgeIds.has(id))) {
    throw new Error("Layout result does not contain exactly the source graph edges.");
  }
}

function flattenNodes(
  nodes: readonly ElkNode[],
  sourceById: ReadonlyMap<string, LayoutGraph["nodes"][number]>,
  parentOffset: LayoutPoint = { x: 0, y: 0 },
  parentId?: string
): LayoutResultNode[] {
  return nodes.flatMap((node) => {
    const source = sourceById.get(node.id);
    if (source === undefined) throw new Error(`Unknown solver node: ${node.id}`);
    const position = {
      x: parentOffset.x + finiteNumber(node.x, `${node.id}.x`),
      y: parentOffset.y + finiteNumber(node.y, `${node.id}.y`)
    };
    const current: LayoutResultNode = {
      id: node.id,
      sourceId: source.sourceId,
      kind: source.kind,
      position,
      size: {
        width: finiteNumber(node.width, `${node.id}.width`),
        height: finiteNumber(node.height, `${node.id}.height`)
      },
      ...(parentId === undefined ? {} : { parentId })
    };
    return [current, ...flattenNodes(node.children ?? [], sourceById, position, node.id)];
  });
}

function findNode(nodes: readonly ElkNode[], id: string): ElkNode | undefined {
  return nodes.find((node) => node.id === id);
}

function finitePoint(point: LayoutPoint, path: string): LayoutPoint {
  return { x: finiteNumber(point.x, `${path}.x`), y: finiteNumber(point.y, `${path}.y`) };
}

function finiteNumber(value: number | undefined, path: string): number {
  if (value === undefined || !Number.isFinite(value)) throw new Error(`Non-finite solver value: ${path}`);
  return value;
}
