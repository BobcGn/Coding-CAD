import type { ComponentType } from "@coding-cad/architecture-ir";
import type { Capability } from "./capability.js";
import type { Limitation } from "./limitation.js";
import type { Recommendation } from "./recommendation.js";

export type ComponentCategory =
  | "database"
  | "cache"
  | "message-broker"
  | "api"
  | "storage"
  | "service"
  | "external-service";

/**
 * Knowledge-base record for one reusable software engineering component.
 * It describes architectural behavior and tradeoffs, not deployment settings.
 */
export interface ComponentDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: ComponentCategory;
  readonly description: string;
  readonly capabilities: readonly Capability[];
  readonly limitations: readonly Limitation[];
  readonly interfaces: readonly string[];
  readonly suitableFor: readonly string[];
  readonly unsuitableFor: readonly string[];
  readonly recommendation?: Recommendation;

  /**
   * Optional bridge to Architecture IR's component vocabulary. This is a loose
   * alignment hint, not a requirement that architecture components name a
   * concrete technology.
   */
  readonly architectureComponentType?: ComponentType;
}
