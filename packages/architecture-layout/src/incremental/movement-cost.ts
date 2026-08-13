import type { LayoutPoint } from "../ir/layout-result.js";
import type { LayoutState } from "../ir/layout-state.js";

export interface NodeMovement {
  readonly nodeId: string;
  readonly distance: number;
  readonly affected: boolean;
}

export interface MovementReport {
  readonly nodes: readonly NodeMovement[];
  readonly unaffectedP95: number;
  readonly unaffectedMax: number;
  readonly relativeOrderReversed: boolean;
  readonly withinBudget: boolean;
}

export const MOVEMENT_BUDGET = {
  unaffectedP95: 48,
  unaffectedMax: 144
} as const;

export function measureMovement(
  previous: LayoutState,
  positions: ReadonlyMap<string, LayoutPoint>,
  affectedNodeIds: ReadonlySet<string>
): MovementReport {
  const movements = previous.nodes.flatMap((node): NodeMovement[] => {
    const current = positions.get(node.id);
    return current === undefined ? [] : [{
      nodeId: node.id,
      distance: distance(node.position, current),
      affected: affectedNodeIds.has(node.id)
    }];
  });
  const unaffected = movements.filter((movement) => !movement.affected).map((movement) => movement.distance).sort((a, b) => a - b);
  const unaffectedP95 = percentile(unaffected, 0.95);
  const unaffectedMax = unaffected.at(-1) ?? 0;
  const relativeOrderReversed = hasRelativeOrderReversal(previous, positions, affectedNodeIds);
  return {
    nodes: movements,
    unaffectedP95,
    unaffectedMax,
    relativeOrderReversed,
    withinBudget: unaffectedP95 <= MOVEMENT_BUDGET.unaffectedP95
      && unaffectedMax <= MOVEMENT_BUDGET.unaffectedMax
      && !relativeOrderReversed
  };
}

function distance(left: LayoutPoint, right: LayoutPoint): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function percentile(values: readonly number[], quantile: number): number {
  if (values.length === 0) return 0;
  return values[Math.ceil(values.length * quantile) - 1] ?? 0;
}

function hasRelativeOrderReversal(
  previous: LayoutState,
  positions: ReadonlyMap<string, LayoutPoint>,
  affectedNodeIds: ReadonlySet<string>
): boolean {
  const axis = previous.direction === "LR" ? "x" : "y";
  const nodes = previous.nodes.filter((node) => !affectedNodeIds.has(node.id) && positions.has(node.id));
  for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
      const left = nodes[leftIndex]!;
      const right = nodes[rightIndex]!;
      const oldOrder = Math.sign(left.position[axis] - right.position[axis]);
      const newOrder = Math.sign(positions.get(left.id)![axis] - positions.get(right.id)![axis]);
      if (oldOrder !== 0 && newOrder !== 0 && oldOrder !== newOrder) return true;
    }
  }
  return false;
}
