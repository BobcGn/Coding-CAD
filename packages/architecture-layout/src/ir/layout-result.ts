import type { LayoutDirection } from "../constraints/constraint.js";
import type { VisualNodeKind } from "./visual-graph.js";

export interface LayoutPoint {
  readonly x: number;
  readonly y: number;
}

export interface LayoutSize {
  readonly width: number;
  readonly height: number;
}

export interface LayoutResultNode {
  readonly id: string;
  readonly sourceId: string;
  readonly kind: VisualNodeKind;
  readonly position: LayoutPoint;
  readonly size: LayoutSize;
  readonly parentId?: string;
}

export interface LayoutResultEdgeSection {
  readonly start: LayoutPoint;
  readonly end: LayoutPoint;
  readonly bendPoints: readonly LayoutPoint[];
}

export interface LayoutResultEdge {
  readonly id: string;
  readonly sourceId: string;
  readonly from: string;
  readonly to: string;
  readonly sections: readonly LayoutResultEdgeSection[];
}

export type LayoutDiagnosticCode =
  | "LAYOUT_CANCELLED"
  | "LAYOUT_TIMEOUT"
  | "SOLVER_FAILURE"
  | "INVALID_SOLVER_RESULT";

export interface LayoutDiagnostic {
  readonly code: LayoutDiagnosticCode;
  readonly severity: "warning" | "error";
  readonly message: string;
}

export interface LayoutResult {
  readonly status: "success" | "fallback";
  readonly direction: LayoutDirection;
  readonly size: LayoutSize;
  readonly nodes: readonly LayoutResultNode[];
  readonly edges: readonly LayoutResultEdge[];
  readonly diagnostics: readonly LayoutDiagnostic[];
}
