import type { ComponentDefinition } from "../component-definition.js";

export const restApiDefinition: ComponentDefinition = {
  id: "rest-api",
  name: "REST API",
  category: "api",
  architectureComponentType: "external-service",
  description: "HTTP-based interface style for service communication and public APIs.",
  capabilities: [
    {
      id: "service-communication",
      name: "Service communication",
      description: "Allows systems to exchange requests and responses through resource-oriented HTTP."
    },
    {
      id: "http-interface",
      name: "HTTP interface",
      description: "Uses widely supported HTTP semantics and tooling."
    }
  ],
  limitations: [
    {
      id: "synchronous-coupling",
      description: "Synchronous calls couple caller latency and availability to the callee.",
      severity: "warning"
    }
  ],
  interfaces: ["HTTP", "REST"],
  suitableFor: ["public API", "service-to-service query", "command endpoint"],
  unsuitableFor: ["high-volume event stream", "long-running asynchronous workflow"],
  recommendation: {
    whenToUse: [
      "Use for explicit request-response boundaries and externally consumable APIs.",
      "Use when HTTP interoperability is more important than event decoupling."
    ],
    whenNotToUse: [
      "Avoid for large fan-out event processing.",
      "Avoid when caller and callee should not share availability or latency fate."
    ]
  }
};
