/** Visual classification only; these values never become Architecture IR facts. */
export type LayoutSemanticRole =
  | "actor"
  | "gateway"
  | "service"
  | "database"
  | "storage"
  | "cache"
  | "queue"
  | "external"
  | "unknown";

export type ClassificationConfidence = "explicit" | "derived" | "fallback";

export interface SemanticClassification {
  readonly componentId: string;
  readonly role: LayoutSemanticRole;
  readonly confidence: ClassificationConfidence;
  readonly provenance: string;
}
