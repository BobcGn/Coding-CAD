import type { Identifier } from "./common.js";
import type { ConnectionProtocol, Contract } from "./contract.js";

export type ComponentType =
  | "service"
  | "database"
  | "cache"
  | "queue"
  | "gateway"
  | "storage"
  | "external-service";

/**
 * Legacy component vocabulary from the first validator experiments.
 * New ArchitectureProject documents should use ComponentType.
 */
export type ComponentKind =
  | "frontend-app"
  | "backend-service"
  | "worker"
  | "database"
  | "cache"
  | "message-broker"
  | "external-system"
  | "library"
  | "ai-agent"
  | "unknown";

/**
 * A logical software module with explicit capabilities, limitations, and
 * contracts. It should express architecture intent; concrete technology
 * binding belongs in later layers.
 */
export interface Component {
  /**
   * Stable logical id, used by connections and diagnostics.
   */
  readonly id: Identifier;

  readonly name: string;

  /**
   * What responsibility this component owns in the architecture.
   */
  readonly description?: string;

  /**
   * Technology-neutral role. For example, describe "database" plus capabilities
   * rather than naming "PostgreSQL" here.
   */
  readonly type?: ComponentType;

  /**
   * Things this component is expected to provide.
   */
  readonly capabilities: readonly string[];

  /**
   * Intentional boundaries that prevent the component from absorbing unrelated
   * responsibilities.
   */
  readonly limitations?: readonly string[];

  /**
   * Public interaction surfaces owned by the component.
   */
  readonly contracts?: readonly Contract[];

  readonly interfaces?: readonly ComponentInterface[];
  readonly contract?: ComponentContract;
  readonly logicalRole?: string;
  readonly technology?: string;
  readonly tags?: readonly string[];

  /**
   * Compatibility field for early packages that used a wider component role
   * vocabulary. New ArchitectureProject documents should prefer `type`.
   */
  readonly kind?: ComponentKind;
}

/**
 * Legacy interface shape used by early DSL parsing.
 * Prefer `contracts` for the new ArchitectureProject model.
 */
export interface ComponentInterface {
  readonly id: Identifier;
  readonly name: string;
  readonly direction: "provided" | "required";
  readonly protocol?: ConnectionProtocol | string;
  readonly contract?: string;
}

/**
 * Legacy capability contract used by early validators.
 * Prefer explicit Contract input/output schemas for new component APIs.
 */
export interface ComponentContract {
  readonly guarantees?: readonly string[];
  readonly requires?: readonly string[];
  readonly forbidden?: readonly string[];
  readonly dataOwnership?: readonly string[];
}
