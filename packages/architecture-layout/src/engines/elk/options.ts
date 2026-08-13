import type { LayoutOptions } from "elkjs/lib/elk-api.js";
import type { LayoutDirection } from "../../constraints/constraint.js";

export const DEFAULT_NODE_WIDTH = 180;
export const DEFAULT_NODE_HEIGHT = 72;

export function createElkLayoutOptions(direction: LayoutDirection): LayoutOptions {
  return {
    "elk.algorithm": "layered",
    "elk.direction": direction === "LR" ? "RIGHT" : "DOWN",
    "elk.edgeRouting": "ORTHOGONAL",
    "elk.hierarchyHandling": "INCLUDE_CHILDREN",
    "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
    "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
    "elk.spacing.nodeNode": "48",
    "elk.layered.spacing.nodeNodeBetweenLayers": "80",
    "elk.padding": "[top=24,left=24,bottom=24,right=24]"
  };
}
