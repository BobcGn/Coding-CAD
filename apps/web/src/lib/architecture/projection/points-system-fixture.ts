import type { ArchitectureProject } from "@coding-cad/architecture-ir";

export const pointsSystemFixture: ArchitectureProject = {
  version: "1.0.0",
  intent: {
    name: "Points Platform",
    purpose: ["Accrue and query customer points."],
    requirements: { consistency: "strong" }
  },
  domain: { entities: [{ name: "Points Account", fields: [{ name: "balance", type: "Points", required: true }] }] },
  architecture: {
    components: [
      { id: "gateway", name: "API Gateway", type: "gateway", capabilities: ["routing"] },
      { id: "ledger", name: "Points Ledger", type: "service", capabilities: ["transactions"] },
      { id: "database", name: "Ledger Database", type: "database", capabilities: ["primary-storage"] },
      { id: "events", name: "Points Events", type: "queue", capabilities: ["asynchronous-delivery"] }
    ],
    connections: [
      { id: "gateway-ledger", from: "gateway", to: "ledger", protocol: "REST" },
      { id: "ledger-database", from: "ledger", to: "database", protocol: "SQL" },
      { id: "ledger-events", from: "ledger", to: "events", protocol: "MESSAGE", mode: "async" }
    ]
  },
  constraints: [],
  decisions: []
};
