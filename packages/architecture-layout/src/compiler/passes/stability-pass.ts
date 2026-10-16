import type { LayoutGraph } from "../../ir/layout-graph.js";
import type { LayoutResult, LayoutResultNode } from "../../ir/layout-result.js";
import type { LayoutState } from "../../ir/layout-state.js";
import { localPositionFor, type LayoutChangeSet } from "../../incremental/mental-map.js";

export function runStabilityPass(
  graph: LayoutGraph,
  fresh: LayoutResult,
  previous: LayoutState,
  changes: LayoutChangeSet
): LayoutResult {
  const previousById = new Map(previous.nodes.map((node) => [node.id, node]));
  const occupied = previous.nodes.map((node) => node.position);
  const nodes = fresh.nodes.map((node) => {
    const prior = previousById.get(node.id);
    if (prior !== undefined && !changes.affectedNodeIds.has(node.id)) {
      return { ...node, position: prior.position, size: prior.size };
    }
    if (prior !== undefined && node.kind === "group") {
      return { ...node, position: prior.position };
    }
    if (changes.addedNodeIds.has(node.id)) {
      const local = localPositionFor(node.id, graph, previous, occupied);
      if (local !== undefined) {
        occupied.push(local);
        return { ...node, position: local };
      }
    }
    occupied.push(node.position);
    return node;
  });
  // Stabilized old nodes can occupy a new node's fresh solver position.
  // Keep those old positions and move only the newcomer to a free local slot.
  const occupiedBoxes = nodes.filter((node) => node.kind === "component" && !changes.addedNodeIds.has(node.id));
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index]!;
    if (node.kind !== "component" || !changes.addedNodeIds.has(node.id)) continue;
    let placed = node;
    if (occupiedBoxes.some((other) => overlaps(placed, other))) {
      const siblings = occupiedBoxes.filter((other) => other.parentId === node.parentId);
      const x = siblings.length > 0 ? Math.min(...siblings.map((other) => other.position.x)) : node.position.x;
      let y = node.position.y;
      // Reuse the existing local-layout 48px clearance, not a new acceptance budget.
      for (;;) {
        const candidate = { ...node, position: { x, y } };
        const collisions = occupiedBoxes.filter((other) => overlaps(candidate, other));
        if (collisions.length === 0) { placed = candidate; break; }
        y = Math.max(...collisions.map((other) => other.position.y + other.size.height)) + 48;
      }
    }
    nodes[index] = placed;
    occupiedBoxes.push(placed);
  }

  // Membership changes may grow a group around retained absolute child positions.
  for (let index = nodes.length - 1; index >= 0; index--) {
    const group = nodes[index]!;
    if (group.kind !== "group" || !changes.affectedNodeIds.has(group.id)) continue;
    const members = nodes.filter((node) => node.parentId === group.id);
    if (members.length === 0) continue;
    const prior = previousById.get(group.id);
    const priorMembers = previous.nodes.filter((node) => node.parentId === group.id);
    const reference = priorMembers.length > 0 ? priorMembers : members;
    const origin = prior ?? group;
    const paddingX = Math.max(0, Math.min(...reference.map((node) => node.position.x)) - origin.position.x);
    const paddingY = Math.max(0, Math.min(...reference.map((node) => node.position.y)) - origin.position.y);
    const x = Math.min(group.position.x, Math.min(...members.map((node) => node.position.x)) - paddingX);
    const y = Math.min(group.position.y, Math.min(...members.map((node) => node.position.y)) - paddingY);
    const right = Math.max(group.position.x + group.size.width, ...members.map((node) => node.position.x + node.size.width + paddingX));
    const bottom = Math.max(group.position.y + group.size.height, ...members.map((node) => node.position.y + node.size.height + paddingY));
    nodes[index] = { ...group, position: { x, y }, size: { width: right - x, height: bottom - y } };
  }
  const width = nodes.reduce((maximum, node) => Math.max(maximum, node.position.x + node.size.width), 0);
  const height = nodes.reduce((maximum, node) => Math.max(maximum, node.position.y + node.size.height), 0);
  return {
    ...fresh,
    size: { width, height },
    nodes,
    // Solver routes refer to the fresh coordinates and must not survive node stabilization.
    edges: fresh.edges.map((edge) => ({ ...edge, sections: [] }))
  };
}


function overlaps(left: LayoutResultNode, right: LayoutResultNode): boolean {
  return left.position.x < right.position.x + right.size.width
    && right.position.x < left.position.x + left.size.width
    && left.position.y < right.position.y + right.size.height
    && right.position.y < left.position.y + left.size.height;
}
