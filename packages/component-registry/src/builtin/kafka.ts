import type { ComponentDefinition } from "../component-definition.js";

export const kafkaDefinition: ComponentDefinition = {
  id: "kafka",
  name: "Kafka",
  category: "message-broker",
  architectureComponentType: "queue",
  description: "Distributed event log for asynchronous processing and large-scale event streams.",
  capabilities: [
    {
      id: "event-stream",
      name: "Event stream",
      description: "Stores ordered event streams that consumers can process independently."
    },
    {
      id: "message-queue",
      name: "Message queue",
      description: "Decouples producers and consumers through asynchronous messages."
    },
    {
      id: "async-processing",
      name: "Async processing",
      description: "Moves work out of synchronous request paths."
    }
  ],
  limitations: [
    {
      id: "eventual-consistency",
      description: "Consumers observe changes asynchronously, so workflows become eventually consistent.",
      severity: "warning"
    },
    {
      id: "complex-debugging",
      description: "Distributed event flows are harder to trace, replay safely, and debug.",
      severity: "warning"
    }
  ],
  interfaces: ["Event publish", "Event subscribe"],
  suitableFor: ["event-driven-system", "large-scale-event-processing"],
  unsuitableFor: ["simple CRUD MVP", "synchronous transaction boundary"],
  recommendation: {
    whenToUse: [
      "Use when many consumers need durable, replayable event streams.",
      "Use to decouple large-scale asynchronous workflows."
    ],
    whenNotToUse: [
      "Avoid for simple request-response communication.",
      "Avoid when the business workflow requires one synchronous transaction boundary."
    ]
  }
};
