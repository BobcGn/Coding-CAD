export type * from "./capability.js";
export type * from "./limitation.js";
export type * from "./recommendation.js";
export type * from "./component-definition.js";
export type * from "./registry.js";
export * from "./registry.js";
export * from "./loader.js";
export * from "./builtin/index.js";

import { builtinComponentDefinitions } from "./builtin/index.js";
import type { ComponentDefinition } from "./component-definition.js";

/**
 * Compatibility shape from the first registry prototype.
 * Prefer ComponentDefinition for new code.
 */
export interface ComponentKnowledge {
  readonly technology: string;
  readonly kind: ComponentDefinition["architectureComponentType"];
  readonly capabilities: readonly string[];
  readonly limitations: readonly string[];
  readonly commonInterfaces: readonly string[];
  readonly suitableFor: readonly string[];
  readonly riskyFor: readonly string[];
}

export const componentKnowledgeBase: readonly ComponentKnowledge[] = builtinComponentDefinitions.map((component) => ({
  technology: component.name,
  kind: component.architectureComponentType,
  capabilities: component.capabilities.map((capability) => capability.id),
  limitations: component.limitations.map((limitation) => limitation.id),
  commonInterfaces: component.interfaces,
  suitableFor: component.suitableFor,
  riskyFor: component.unsuitableFor
}));

export function findComponentKnowledge(technology: string): ComponentKnowledge | undefined {
  return componentKnowledgeBase.find((entry) => entry.technology.toLowerCase() === technology.toLowerCase());
}
