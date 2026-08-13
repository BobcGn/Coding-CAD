import type { LayoutGraph } from "../ir/layout-graph.js";
import type { LayoutResult } from "../ir/layout-result.js";
import { ElkLayoutEngine } from "./elk/elk-engine.js";

export interface LayoutEngineOptions {
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

/** Solver-neutral boundary. Implementations must not mutate the input graph. */
export interface LayoutEngine {
  layout(graph: LayoutGraph, options?: LayoutEngineOptions): Promise<LayoutResult>;
}

/** Creates the V1 engine without exposing its solver-specific implementation. */
export function createLayoutEngine(): LayoutEngine {
  return new ElkLayoutEngine();
}
