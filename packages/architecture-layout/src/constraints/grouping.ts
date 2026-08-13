import type { VisualGroupKind } from "../ir/visual-graph.js";

export interface GroupingConstraint {
  readonly kind: "group";
  readonly groupId: string;
  readonly memberIds: readonly string[];
  readonly groupKind: VisualGroupKind;
  readonly strength: "required";
}
