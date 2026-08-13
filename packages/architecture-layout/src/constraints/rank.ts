import type { PreferredRank } from "../semantic/hints.js";

export interface RankConstraint {
  readonly kind: "rank";
  readonly nodeId: string;
  readonly rank: PreferredRank;
  readonly strength: "preferred";
}
