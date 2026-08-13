import type { ELK, ELKConstructorArguments, ElkNode } from "elkjs/lib/elk-api.js";
import type { LayoutEngine, LayoutEngineOptions } from "../layout-engine.js";
import type { LayoutGraph } from "../../ir/layout-graph.js";
import type { LayoutDiagnostic, LayoutResult } from "../../ir/layout-result.js";
import { createFallbackResult, fromElkGraph, toElkGraph } from "./elk-adapter.js";

export class ElkLayoutEngine implements LayoutEngine {
  constructor(private readonly solve: ElkSolve = solveWithElk) {}

  async layout(graph: LayoutGraph, options: LayoutEngineOptions = {}): Promise<LayoutResult> {
    const signal = options.signal;
    if (signal?.aborted === true) return fallback(graph, "LAYOUT_CANCELLED", "Layout was cancelled before solver execution.");

    try {
      const result = await raceLayout(this.solve(toElkGraph(graph)), options);
      return fromElkGraph(graph, result);
    } catch (error) {
      if (error instanceof LayoutControlError) return fallback(graph, error.code, error.message);
      return fallback(graph, "SOLVER_FAILURE", error instanceof Error ? error.message : "Unknown ELK solver failure.");
    }
  }
}

type ElkConstructor = new (args?: ELKConstructorArguments) => ELK;
export type ElkSolve = (graph: ElkNode) => Promise<ElkNode>;

/** Normalizes elkjs' CommonJS runtime export without exposing that interop quirk. */
async function createElk(): Promise<ELK> {
  const { default: ElkModule } = await import("elkjs/lib/elk.bundled.js");
  const candidate = ElkModule as unknown as ElkConstructor | { readonly default: ElkConstructor };
  const Constructor: ElkConstructor = typeof candidate === "function" ? candidate : candidate.default;
  return new Constructor();
}

async function solveWithElk(graph: ElkNode): Promise<ElkNode> {
  const elk = await createElk();
  return elk.layout(graph);
}

class LayoutControlError extends Error {
  constructor(readonly code: "LAYOUT_CANCELLED" | "LAYOUT_TIMEOUT", message: string) {
    super(message);
  }
}

async function raceLayout<T extends ElkNode>(promise: Promise<T>, options: LayoutEngineOptions): Promise<T> {
  if (options.timeoutMs === undefined && options.signal === undefined) return promise;

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let rejectControl: ((reason: LayoutControlError) => void) | undefined;
  const onAbort = (): void => rejectControl?.(new LayoutControlError("LAYOUT_CANCELLED", "Layout was cancelled."));
  const control = new Promise<never>((_, reject) => {
    rejectControl = reject;
    if (options.timeoutMs !== undefined) {
      timeout = setTimeout(
        () => reject(new LayoutControlError("LAYOUT_TIMEOUT", `Layout exceeded ${options.timeoutMs}ms.`)),
        options.timeoutMs
      );
    }
    options.signal?.addEventListener("abort", onAbort, { once: true });
  });

  try {
    return await Promise.race([promise, control]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onAbort);
  }
}

function fallback(graph: LayoutGraph, code: LayoutDiagnostic["code"], message: string): LayoutResult {
  return createFallbackResult(graph, { code, severity: "warning", message });
}
