import type { LayoutConstraint, LayoutDirection } from "../constraints/constraint.js";
import type { VisualEdge, VisualNode } from "./visual-graph.js";

/** Solver-neutral graph; coordinates appear only after a LayoutEngine runs. */
export interface LayoutGraph {
  readonly direction: LayoutDirection;
  readonly nodes: readonly VisualNode[];
  readonly edges: readonly VisualEdge[];
  readonly constraints: readonly LayoutConstraint[];
}
