import type { LayoutGraph } from "../../ir/layout-graph.js";
import type { LayoutResult } from "../../ir/layout-result.js";
import { createFallbackResult, validateLayoutResult } from "./elk-adapter.js";

/** Serializable boundary owned by the ELK engine; it contains no UI or DOM state. */
export type ElkWorkerRequest =
  | { readonly type: "layout"; readonly requestId: string; readonly graph: LayoutGraph; readonly timeoutMs?: number }
  | { readonly type: "cancel"; readonly requestId: string };

export type ElkWorkerResponse =
  | { readonly type: "result"; readonly requestId: string; readonly result: LayoutResult }
  | { readonly type: "error"; readonly requestId: string; readonly message: string };

export interface ElkWorkerTransport {
  request(message: Extract<ElkWorkerRequest, { readonly type: "layout" }>): Promise<ElkWorkerResponse>;
  cancel(requestId: string): void;
}

export class ElkWorkerLayoutEngine {
  private sequence = 0;

  constructor(private readonly transport: ElkWorkerTransport) {}

  async layout(graph: LayoutGraph, options: { readonly signal?: AbortSignal; readonly timeoutMs?: number } = {}): Promise<LayoutResult> {
    const requestId = `layout-${this.sequence++}`;
    if (options.signal?.aborted === true) return fallback(graph, "LAYOUT_CANCELLED", "Layout was cancelled before worker execution.");

    const onAbort = (): void => this.transport.cancel(requestId);
    options.signal?.addEventListener("abort", onAbort, { once: true });
    try {
      const response = await this.transport.request({
        type: "layout",
        requestId,
        graph,
        ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs })
      });
      if (response.requestId !== requestId) return fallback(graph, "SOLVER_FAILURE", "Worker returned a stale layout response.");
      if (response.type === "error") return fallback(graph, "SOLVER_FAILURE", response.message);
      validateLayoutResult(graph, response.result);
      return response.result;
    } catch (error) {
      const cancelled = isAborted(options.signal);
      return fallback(
        graph,
        cancelled ? "LAYOUT_CANCELLED" : "SOLVER_FAILURE",
        cancelled ? "Layout was cancelled." : error instanceof Error ? error.message : "Unknown worker failure."
      );
    } finally {
      options.signal?.removeEventListener("abort", onAbort);
    }
  }
}

function isAborted(signal: AbortSignal | undefined): boolean {
  return signal?.aborted ?? false;
}

function fallback(
  graph: LayoutGraph,
  code: "LAYOUT_CANCELLED" | "SOLVER_FAILURE",
  message: string
): LayoutResult {
  return createFallbackResult(graph, { code, severity: "warning", message });
}
