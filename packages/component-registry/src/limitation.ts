export type LimitationSeverity = "warning" | "critical";

/**
 * A limitation captures when a component becomes risky or inappropriate.
 * The registry is useful to AI Agents only when it records tradeoffs, not just
 * positive marketing claims.
 */
export interface Limitation {
  readonly id: string;
  readonly description: string;
  readonly severity?: LimitationSeverity;
}
