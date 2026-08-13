import type { ArchitectureProject } from "@coding-cad/architecture-ir";

export const layoutFixture: ArchitectureProject = {
  version: "0.1",
  intent: { name: "LayoutFixture", purpose: ["Exercise semantic layout projection."] },
  domain: { entities: [] },
  architecture: {
    components: [
      { id: "customer", name: "Customer", kind: "frontend-app", capabilities: ["uses-product"] },
      { id: "gateway", name: "API Gateway", type: "gateway", capabilities: ["request-routing"] },
      { id: "orders", name: "Order Service", type: "service", tags: ["module:commerce"], capabilities: ["orders"] },
      { id: "payments", name: "Payment Service", type: "service", tags: ["module:commerce"], capabilities: ["payments"] },
      { id: "postgres", name: "PostgreSQL", type: "database", capabilities: ["durable-storage"] },
      { id: "redis", name: "Redis", type: "cache", capabilities: ["low-latency-read"] },
      { id: "events", name: "Kafka", type: "queue", capabilities: ["async-events"] },
      { id: "billing", name: "Billing Provider", type: "external-service", capabilities: ["billing"] }
    ],
    connections: [
      { id: "customer-gateway", from: "customer", to: "gateway", protocol: "HTTPS" },
      { id: "gateway-orders", from: "gateway", to: "orders", protocol: "HTTPS" },
      { id: "orders-payments", from: "orders", to: "payments", protocol: "HTTP" },
      { id: "orders-postgres", from: "orders", to: "postgres", protocol: "SQL" },
      { id: "orders-redis", from: "orders", to: "redis", protocol: "Redis" },
      { id: "orders-events", from: "orders", to: "events", protocol: "Kafka", mode: "async" },
      { id: "payments-billing", from: "payments", to: "billing", protocol: "HTTPS" }
    ]
  },
  constraints: [],
  decisions: []
};
