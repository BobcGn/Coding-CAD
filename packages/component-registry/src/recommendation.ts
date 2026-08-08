/**
 * Human-readable usage guidance. These strings are intentionally plain language
 * so they can be surfaced directly in UI explanations or Agent reasoning.
 */
export interface Recommendation {
  readonly whenToUse: readonly string[];
  readonly whenNotToUse: readonly string[];
}
