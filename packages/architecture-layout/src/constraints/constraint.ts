import type { GroupingConstraint } from "./grouping.js";
import type { ProximityConstraint } from "./proximity.js";
import type { RankConstraint } from "./rank.js";

export type LayoutDirection = "LR" | "TB";

export interface DirectionConstraint {
  readonly kind: "direction";
  readonly direction: LayoutDirection;
  readonly strength: "required";
}

export type LayoutConstraint =
  | DirectionConstraint
  | RankConstraint
  | ProximityConstraint
  | GroupingConstraint;
