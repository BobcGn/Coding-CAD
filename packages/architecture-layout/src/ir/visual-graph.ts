import type { LayoutSemanticRole, SemanticClassification } from "../semantic/roles.js";
import type { SemanticLayoutHints } from "../semantic/hints.js";

export type VisualNodeKind = "component" | "group";
export type VisualGroupKind = "module" | "domain" | "infrastructure";

export interface VisualNode {
  readonly id: string;
  readonly sourceId: string;
  readonly kind: VisualNodeKind;
  readonly label: string;
  readonly role: LayoutSemanticRole;
  readonly parentId?: string;
  readonly groupKind?: VisualGroupKind;
  readonly classification?: SemanticClassification;
  readonly hints: SemanticLayoutHints;
}

export interface VisualEdge {
  readonly id: string;
  readonly sourceId: string;
  readonly from: string;
  readonly to: string;
  readonly label?: string;
  readonly asynchronous: boolean;
}

/** Coordinate-free projection consumed by constraint generation. */
export interface VisualGraph {
  readonly nodes: readonly VisualNode[];
  readonly edges: readonly VisualEdge[];
}
