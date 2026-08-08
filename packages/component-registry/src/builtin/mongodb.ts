import type { ComponentDefinition } from "../component-definition.js";

export const mongodbDefinition: ComponentDefinition = {
  id: "mongodb",
  name: "MongoDB",
  category: "database",
  architectureComponentType: "database",
  description: "Document database for flexible aggregate-shaped data and evolving schemas.",
  capabilities: [
    {
      id: "document-storage",
      name: "Document storage",
      description: "Stores nested document-shaped records."
    },
    {
      id: "flexible-schema",
      name: "Flexible schema",
      description: "Supports evolving data shapes without rigid relational schemas."
    }
  ],
  limitations: [
    {
      id: "transaction-model-complexity",
      description: "Cross-document transaction boundaries require careful modeling and operational understanding.",
      severity: "warning"
    }
  ],
  interfaces: ["Document query API"],
  suitableFor: ["content documents", "flexible aggregates", "rapidly evolving data shape"],
  unsuitableFor: ["financial ledger", "cross-aggregate strong transaction boundary"],
  recommendation: {
    whenToUse: [
      "Use for document-centric aggregates where flexible shape is more important than relational joins.",
      "Use when most writes stay within one aggregate boundary."
    ],
    whenNotToUse: [
      "Avoid for primary ledgers that require simple, explicit strong transaction semantics.",
      "Avoid when relational integrity and joins dominate the model."
    ]
  }
};
