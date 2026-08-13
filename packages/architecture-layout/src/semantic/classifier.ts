import type { Component } from "@coding-cad/architecture-ir";
import type { LayoutSemanticRole, SemanticClassification } from "./roles.js";

const TYPE_ROLES = {
  service: "service",
  database: "database",
  cache: "cache",
  queue: "queue",
  gateway: "gateway",
  storage: "storage",
  "external-service": "external"
} as const satisfies Record<NonNullable<Component["type"]>, LayoutSemanticRole>;

const KIND_ROLES = {
  "frontend-app": "actor",
  "backend-service": "service",
  worker: "service",
  database: "database",
  cache: "cache",
  "message-broker": "queue",
  "external-system": "external",
  library: "service",
  "ai-agent": "actor",
  unknown: "unknown"
} as const satisfies Record<NonNullable<Component["kind"]>, LayoutSemanticRole>;

export function classifyComponent(component: Component): SemanticClassification {
  if (component.type !== undefined) {
    return classification(component.id, TYPE_ROLES[component.type], "explicit", "component.type");
  }

  if (component.kind !== undefined && component.kind !== "unknown") {
    return classification(component.id, KIND_ROLES[component.kind], "derived", "component.kind");
  }

  const role = classifyText(component);
  return role === "unknown"
    ? classification(component.id, role, "fallback", "default")
    : classification(component.id, role, "derived", "component metadata");
}

function classifyText(component: Component): LayoutSemanticRole {
  const text = [
    component.name,
    component.description,
    component.logicalRole,
    ...(component.capabilities ?? []),
    ...(component.tags ?? [])
  ].filter((value): value is string => value !== undefined).join(" ").toLowerCase();

  if (/\b(actor|user|client|customer)\b/.test(text)) return "actor";
  if (/\b(gateway|api gateway|edge)\b/.test(text)) return "gateway";
  if (/\b(database|postgres|mysql|ledger|source.of.truth)\b/.test(text)) return "database";
  if (/\b(cache|redis)\b/.test(text)) return "cache";
  if (/\b(queue|broker|kafka|async|event bus)\b/.test(text)) return "queue";
  if (/\b(storage|object store|blob)\b/.test(text)) return "storage";
  if (/\b(external|third.party|vendor)\b/.test(text)) return "external";
  if (/\b(service|worker|application)\b/.test(text)) return "service";
  return "unknown";
}

function classification(
  componentId: string,
  role: LayoutSemanticRole,
  confidence: SemanticClassification["confidence"],
  provenance: string
): SemanticClassification {
  return { componentId, role, confidence, provenance };
}
