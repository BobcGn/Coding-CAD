import { ElkLayoutEngine } from "./elk-engine.js";
import type { ElkWorkerRequest, ElkWorkerResponse } from "./worker-protocol.js";

export type ElkWorkerPostResponse = (response: ElkWorkerResponse) => void;

/** Owns only solver execution; compiler passes remain on the caller side. */
export function createElkWorkerHandler(postResponse: ElkWorkerPostResponse): (request: ElkWorkerRequest) => Promise<void> {
  const active = new Map<string, AbortController>();
  const engine = new ElkLayoutEngine();

  return async (request): Promise<void> => {
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
      postResponse({ type: "result", requestId: request.requestId, result });
    } catch (error) {
      postResponse({
        type: "error",
        requestId: request.requestId,
        message: error instanceof Error ? error.message : "Unknown worker runtime failure."
      });
    } finally {
      active.delete(request.requestId);
    }
  };
}
