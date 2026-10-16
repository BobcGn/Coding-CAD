import type { LayoutGraph, LayoutResult, LayoutState } from "@coding-cad/architecture-layout";

export function measureLayout(graph: LayoutGraph, result: LayoutResult) {
  const nodes = new Map(result.nodes.map((node) => [node.id, node]));
  const ancestor = (parent: string, child: string): boolean => {
    let current = nodes.get(child)?.parentId;
    while (current) {
      if (current === parent) return true;
      current = nodes.get(current)?.parentId;
    }
    return false;
  };
  const overlaps: string[] = [];
  for (let i = 0; i < result.nodes.length; i++) for (let j = i + 1; j < result.nodes.length; j++) {
    const a = result.nodes[i]!, b = result.nodes[j]!;
    if (ancestor(a.id, b.id) || ancestor(b.id, a.id)) continue; // Intentional containment is not peer overlap.
    if (a.position.x < b.position.x + b.size.width && b.position.x < a.position.x + a.size.width &&
      a.position.y < b.position.y + b.size.height && b.position.y < a.position.y + a.size.height) overlaps.push(a.id + ":" + b.id);
  }
  const containmentFailures = result.nodes.filter((node) => {
    if (!node.parentId) return false;
    const parent = nodes.get(node.parentId);
    return !parent || node.position.x < parent.position.x || node.position.y < parent.position.y ||
      node.position.x + node.size.width > parent.position.x + parent.size.width ||
      node.position.y + node.size.height > parent.position.y + parent.size.height;
  }).map((node) => node.id);
  const ranks = { entry: 0, application: 1, async: 2, data: 3, external: 4 };
  const ranked = graph.constraints.filter((constraint) => constraint.kind === "rank");
  let rankInversions = 0;
  const axis = graph.direction === "LR" ? "x" : "y";
  for (const a of ranked) for (const b of ranked) {
    if (ranks[a.rank] < ranks[b.rank] && nodes.get(a.nodeId)!.position[axis] > nodes.get(b.nodeId)!.position[axis]) rankInversions++;
  }
  type Point = { x: number; y: number };
  const segmentCrosses = (a: Point, b: Point, c: Point, d: Point) => {
    const cross = (p: Point, q: Point, r: Point) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
    return cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
  };
  let crossings = 0;
  for (let i = 0; i < result.edges.length; i++) for (let j = i + 1; j < result.edges.length; j++) {
    const a = result.edges[i]!, b = result.edges[j]!;
    if ([a.from, a.to].some((id) => id === b.from || id === b.to)) continue;
    for (const sa of a.sections) for (const sb of b.sections) {
      const pa = [sa.start, ...sa.bendPoints, sa.end], pb = [sb.start, ...sb.bendPoints, sb.end];
      for (let x = 1; x < pa.length; x++) for (let y = 1; y < pb.length; y++) {
        if (segmentCrosses(pa[x - 1]!, pa[x]!, pb[y - 1]!, pb[y]!)) crossings++;
      }
    }
  }
  const routedEdges = result.edges.filter((edge) => edge.sections.length > 0).length;
  return {
    nodes: result.nodes.length, components: result.nodes.filter((node) => node.kind === "component").length,
    peerOverlaps: overlaps.length, overlapPairs: overlaps, containmentFailures,
    routedEdges, edges: result.edges.length,
    routedCrossings: routedEdges === result.edges.length ? crossings : null,
    rankInversions,
    area: result.size.width * result.size.height
  };
}

export function measureProductMovement(previous: LayoutState, next: LayoutState, editedId: string) {
  const after = new Map(next.nodes.map((node) => [node.id, node]));
  const unaffected = previous.nodes.filter((node) => node.id !== editedId && after.has(node.id));
  const distances = unaffected.map((node) => {
    const target = after.get(node.id)!;
    return Math.hypot(target.position.x - node.position.x, target.position.y - node.position.y);
  }).sort((a, b) => a - b);
  const axis = previous.direction === "LR" ? "x" : "y";
  let orderReversals = 0;
  for (let i = 0; i < unaffected.length; i++) for (let j = i + 1; j < unaffected.length; j++) {
    const a = unaffected[i]!, b = unaffected[j]!;
    const oldOrder = Math.sign(a.position[axis] - b.position[axis]);
    const newOrder = Math.sign(after.get(a.id)!.position[axis] - after.get(b.id)!.position[axis]);
    if (oldOrder && newOrder && oldOrder !== newOrder) orderReversals++;
  }
  return { unaffectedNodes: distances.length, p95: distances[Math.ceil(distances.length * .95) - 1] ?? 0, max: distances.at(-1) ?? 0, orderReversals };
}
