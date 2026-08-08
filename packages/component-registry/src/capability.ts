/**
 * A capability names something a component can provide to an architecture.
 * Capabilities are engineering semantics, not configuration switches.
 */
export interface Capability {
  readonly id: string;
  readonly name: string;
  readonly description: string;
}
