import type { ComponentKind } from "@coding-cad/architecture-ir";

/**
 * General technology knowledge that can inform validation, UI hints, or Agents.
 * Keep project-specific decisions in ArchitectureIR decisions/constraints rather
 * than encoding them here as universal facts.
 */
export interface ComponentKnowledge {
  readonly technology: string;
  readonly kind: ComponentKind;
  readonly capabilities: readonly string[];
  readonly limitations: readonly string[];
  readonly commonInterfaces: readonly string[];
  readonly suitableFor: readonly string[];
  readonly riskyFor: readonly string[];
}

export const componentKnowledgeBase: readonly ComponentKnowledge[] = [
  {
    technology: "PostgreSQL",
    kind: "database",
    capabilities: ["relational-storage", "strong-transaction", "sql-query", "data-integrity"],
    limitations: ["horizontal-write-scaling-needs-care", "not-a-cache"],
    commonInterfaces: ["SQL"],
    suitableFor: ["transactional-storage", "ledger", "consistent-domain-state"],
    riskyFor: ["high-frequency-ephemeral-cache", "unbounded-event-stream"]
  },
  {
    technology: "Redis",
    kind: "cache",
    capabilities: ["cache", "kv-storage", "high-frequency-access", "ephemeral-state"],
    limitations: ["no-strong-transaction", "memory-bound", "not-system-of-record"],
    commonInterfaces: ["CacheRead", "CacheWrite"],
    suitableFor: ["cache", "rate-limit", "session-cache"],
    riskyFor: ["transactional-storage", "system-of-record", "financial-ledger"]
  },
  {
    technology: "MongoDB",
    kind: "database",
    capabilities: ["document-storage", "flexible-schema", "horizontal-scale"],
    limitations: ["strong-transaction-boundaries-need-care", "relational-joins-are-limited"],
    commonInterfaces: ["DocumentRead", "DocumentWrite"],
    suitableFor: ["content-documents", "flexible-aggregate-storage"],
    riskyFor: ["financial-ledger", "cross-aggregate-strong-transaction"]
  },
  {
    technology: "Kafka",
    kind: "message-broker",
    capabilities: ["event-stream", "durable-log", "async-decoupling", "replay"],
    limitations: ["operational-complexity", "not-request-response", "eventual-consistency"],
    commonInterfaces: ["EventPublish", "EventSubscribe"],
    suitableFor: ["event-driven-integration", "audit-stream", "async-workflow"],
    riskyFor: ["simple-crud-mvp", "synchronous-transaction-boundary"]
  }
];

export function findComponentKnowledge(technology: string): ComponentKnowledge | undefined {
  return componentKnowledgeBase.find((entry) => entry.technology.toLowerCase() === technology.toLowerCase());
}
