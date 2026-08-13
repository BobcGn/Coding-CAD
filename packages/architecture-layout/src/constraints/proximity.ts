export interface ProximityConstraint {
  readonly kind: "proximity";
  readonly nodeIds: readonly [string, string];
  readonly reason: "ownership" | "communication";
  readonly strength: "preferred";
}
