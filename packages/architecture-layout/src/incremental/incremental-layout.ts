import { runStabilityPass } from "../compiler/passes/stability-pass.js";
import { createLayoutEngine, type LayoutEngine, type LayoutEngineOptions } from "../engines/layout-engine.js";
import type { LayoutGraph } from "../ir/layout-graph.js";
import type { LayoutResult } from "../ir/layout-result.js";
import { createLayoutState, type LayoutState } from "../ir/layout-state.js";
import { deriveLayoutChanges } from "./mental-map.js";
import { measureMovement, type MovementReport } from "./movement-cost.js";

export type LayoutMode = "FULL" | "INCREMENTAL";

export interface IncrementalLayoutOptions extends LayoutEngineOptions {
  readonly mode?: LayoutMode;
  readonly previousState?: LayoutState;
}

export interface IncrementalLayoutOutcome {
  readonly requestedMode: LayoutMode;
  readonly appliedMode: LayoutMode;
  readonly result: LayoutResult;
  readonly state: LayoutState;
  readonly movement?: MovementReport;
}

export async function layoutArchitectureGraph(
  graph: LayoutGraph,
  options: IncrementalLayoutOptions = {},
  engine: LayoutEngine = createLayoutEngine()
): Promise<IncrementalLayoutOutcome> {
  const requestedMode = options.mode ?? "FULL";
  const fresh = await engine.layout(graph, {
    ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs }),
    ...(options.signal === undefined ? {} : { signal: options.signal })
  });
  const previous = options.previousState;
  if (requestedMode === "FULL" || previous === undefined || previous.direction !== graph.direction || fresh.status !== "success") {
    return { requestedMode, appliedMode: "FULL", result: fresh, state: createLayoutState(fresh) };
  }

  const changes = deriveLayoutChanges(graph, previous);
  const result = runStabilityPass(graph, fresh, previous, changes);
  const positions = new Map(result.nodes.map((node) => [node.id, node.position]));
  return {
    requestedMode,
    appliedMode: "INCREMENTAL",
    result,
    state: createLayoutState(result),
    movement: measureMovement(previous, positions, changes.affectedNodeIds)
  };
}
