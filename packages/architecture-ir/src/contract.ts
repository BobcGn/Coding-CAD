import type { JsonValue } from "./common.js";

export type CommunicationProtocol = "REST" | "RPC" | "EVENT" | "SQL" | "MESSAGE";

/**
 * Wider protocol vocabulary retained for existing parser and validator code.
 * The canonical contract protocol is intentionally smaller; custom strings can
 * be accepted at graph edges until the vocabulary matures.
 */
export type ConnectionProtocol =
  | CommunicationProtocol
  | "HTTP"
  | "GraphQL"
  | "gRPC"
  | "Redis"
  | "Kafka"
  | "Event"
  | "Queue"
  | "SDK"
  | "File"
  | "Unknown";

/**
 * Contract describes how a component interacts with the outside world.
 * Schemas stay language-neutral so DSL, UI, and Agents can serialize them.
 */
export interface Contract {
  /**
   * Stable contract name within the owning component.
   */
  readonly name: string;

  /**
   * Communication style, not a framework name.
   */
  readonly protocol: CommunicationProtocol;

  readonly inputs?: readonly DataSchema[];
  readonly outputs?: readonly DataSchema[];
}

/**
 * Serializable, language-neutral schema for messages crossing a contract.
 */
export interface DataSchema {
  readonly name: string;
  readonly description?: string;
  readonly fields?: readonly SchemaField[];

  /**
   * JSON examples for humans, tests, and Agents. Keep them serializable.
   */
  readonly examples?: readonly JsonValue[];
}

/**
 * Field inside a contract schema. `type` is intentionally textual so early IR
 * can represent domain types before a formal type system exists.
 */
export interface SchemaField {
  readonly name: string;
  readonly type: string;
  readonly required?: boolean;
  readonly description?: string;
}
