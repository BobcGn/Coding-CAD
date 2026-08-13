/// <reference lib="webworker" />

import { createLayoutEngine, type LayoutGraph } from "@coding-cad/architecture-layout";

type WorkerRequest =
  | { readonly type: "layout"; readonly requestId: string; readonly graph: LayoutGraph; readonly timeoutMs?: number }
  | { readonly type: "cancel"; readonly requestId: string };

const engine = createLayoutEngine();
const active = new Map<string, AbortController>();

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const request = event.data;
  if (request.type === "cancel") {
    active.get(request.requestId)?.abort();
    return;
  }

  const controller = new AbortController();
  active.set(request.requestId, controller);
  try {
    const result = await engine.layout(request.graph, {
      signal: controller.signal,
      ...(request.timeoutMs === undefined ? {} : { timeoutMs: request.timeoutMs })
    });
    self.postMessage({ type: "result", requestId: request.requestId, result });
  } catch (error) {
    self.postMessage({
      type: "error",
      requestId: request.requestId,
      message: error instanceof Error ? error.message : "Unknown layout worker failure."
    });
  } finally {
    active.delete(request.requestId);
  }
});
