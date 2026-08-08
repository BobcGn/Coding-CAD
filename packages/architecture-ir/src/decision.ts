/**
 * Captures why an architecture choice was made. These records are critical for
 * AI Agents because they preserve rationale that cannot be inferred from graph
 * structure alone.
 */
export interface ArchitectureDecision {
  readonly title: string;

  /**
   * Situation or forces that made the decision necessary.
   */
  readonly context: string;

  /**
   * Chosen direction, phrased as architecture intent rather than implementation
   * instructions.
   */
  readonly decision: string;

  readonly alternatives?: readonly string[];

  /**
   * Why this decision is acceptable despite tradeoffs.
   */
  readonly rationale: string;
}
