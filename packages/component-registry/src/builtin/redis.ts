import type { ComponentDefinition } from "../component-definition.js";

export const redisDefinition: ComponentDefinition = {
  id: "redis",
  name: "Redis",
  category: "cache",
  architectureComponentType: "cache",
  description: "In-memory data store commonly used for cache, fast reads, and temporary state.",
  capabilities: [
    {
      id: "cache",
      name: "Cache",
      description: "Stores derived or reusable data for fast access."
    },
    {
      id: "key-value",
      name: "Key-value storage",
      description: "Stores values by key with simple access patterns."
    },
    {
      id: "high-performance-read",
      name: "High-performance read",
      description: "Provides low-latency reads for hot data."
    }
  ],
  limitations: [
    {
      id: "not-primary-storage",
      description: "Should not be the primary source of truth for durable business records.",
      severity: "critical"
    },
    {
      id: "weak-consistency",
      description: "Does not provide the same consistency model as a transactional database.",
      severity: "warning"
    }
  ],
  interfaces: ["Redis protocol", "key-value API"],
  suitableFor: ["session", "cache", "ranking", "temporary-state"],
  unsuitableFor: ["ledger", "payment records", "primary account balance"],
  recommendation: {
    whenToUse: [
      "Use for read acceleration, sessions, ranking, rate limits, and temporary state.",
      "Use beside a durable source of truth when correctness matters."
    ],
    whenNotToUse: [
      "Do not use as the only storage for financial, account, or ledger truth.",
      "Avoid when memory growth is unbounded or data loss is unacceptable."
    ]
  }
};
