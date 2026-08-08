/**
 * Stable logical identifier used for cross-references inside one IR document.
 * It is intentionally a string instead of a branded type so JSON/YAML authors
 * and future visual editors can create IDs without runtime helpers.
 */
export type Identifier = string;

/**
 * JSON-compatible scalar. IR extension points use JSON values so documents can
 * round-trip through YAML, REST APIs, browser storage, and LLM tool calls.
 */
export type JsonPrimitive = string | number | boolean | null;

/**
 * Recursive JSON-compatible value for extension fields.
 * Do not place functions, Dates, Maps, Sets, or class instances in the IR.
 */
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export type JsonArray = readonly JsonValue[];

/**
 * Consistency semantics the architecture requires from a boundary.
 * This describes product correctness needs; concrete storage technology is
 * chosen later by technology binding, validation, or implementation layers.
 */
export type ConsistencyLevel =
  | "eventual"
  | "strong"
  | "causal"
  | "read-your-writes"
  | "bounded-staleness";

/**
 * Generic qualitative level for requirements that are not tied to a specialized
 * architecture vocabulary yet. Prefer a domain-specific union when the concept
 * becomes important enough to validate.
 */
export type RequirementLevel = "low" | "medium" | "high" | "strong";

/**
 * Severity used by diagnostics and constraints.
 * `error` means the architecture conflicts with a stated requirement, while
 * `warning` means a human decision or explicit rationale is likely needed.
 */
export type DiagnosticSeverity = "info" | "warning" | "error";
