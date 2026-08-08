import type { ComponentDefinition } from "../component-definition.js";

export const postgresqlDefinition: ComponentDefinition = {
  id: "postgresql",
  name: "PostgreSQL",
  category: "database",
  architectureComponentType: "database",
  description: "Relational database suitable for durable transactional domain state.",
  capabilities: [
    {
      id: "transaction",
      name: "Transaction",
      description: "Supports atomic updates across related records."
    },
    {
      id: "relational-storage",
      name: "Relational storage",
      description: "Stores structured data with relational integrity."
    },
    {
      id: "strong-consistency",
      name: "Strong consistency",
      description: "Can serve as a source of truth for strongly consistent domain state."
    },
    {
      id: "query",
      name: "Query",
      description: "Supports expressive SQL querying and indexing."
    }
  ],
  limitations: [
    {
      id: "horizontal-scaling-complex",
      description: "Horizontal write scaling requires careful architecture and operational design.",
      severity: "warning"
    }
  ],
  interfaces: ["SQL"],
  suitableFor: ["user data", "payment", "order", "ledger"],
  unsuitableFor: ["massive cache", "ephemeral session state", "unbounded event streaming"],
  recommendation: {
    whenToUse: [
      "Use when domain state needs durability, transactions, and strong consistency.",
      "Use as the source of truth for balances, orders, payments, and ledgers."
    ],
    whenNotToUse: [
      "Avoid using it as a high-frequency ephemeral cache.",
      "Avoid using it as the only solution for unbounded event streams."
    ]
  }
};
