import type { Identifier } from "./common.js";
import type { ConnectionProtocol } from "./contract.js";
import type { Component } from "./component.js";

/**
 * Structural view of the system.
 * The graph should stay logical: nodes are architecture components, and edges
 * are communication or dependency relationships, not source-code imports.
 */
export interface ArchitectureGraph {
  readonly components: readonly Component[];
  readonly connections: readonly Connection[];
}

/**
 * Directed relationship between two components. The connection explains
 * communication intent, while each component owns its own detailed contracts.
 */
export interface Connection {
  /**
   * Stable reference key used by UI selections, diagnostics, and future patches.
   */
  readonly id: Identifier;

  /**
   * Source component id.
   */
  readonly from: Identifier;

  /**
   * Target component id.
   */
  readonly to: Identifier;

  /**
   * Communication family for the relationship. Unknown or custom protocols may
   * be represented as strings until they deserve first-class vocabulary.
   */
  readonly protocol: ConnectionProtocol | string;

  /**
   * Human-readable explanation of why this connection exists.
   */
  readonly description?: string;

  readonly purpose?: string;
  readonly mode?: "sync" | "async" | "batch";
  readonly data?: readonly string[];
  readonly constraints?: readonly string[];

  /**
   * Name of a component contract carried by this connection, when applicable.
   */
  readonly contractName?: string;
}
