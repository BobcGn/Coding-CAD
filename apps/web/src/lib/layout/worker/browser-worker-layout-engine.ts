import type { LayoutEngine, LayoutEngineOptions, LayoutGraph, LayoutResult } from "@coding-cad/architecture-layout";

type WorkerRequest =
  | { readonly type: "layout"; readonly requestId: string; readonly graph: LayoutGraph; readonly timeoutMs?: number }
  | { readonly type: "cancel"; readonly requestId: string };

type WorkerResponse =
  | { readonly type: "result"; readonly requestId: string; readonly result: LayoutResult }
  | { readonly type: "error"; readonly requestId: string; readonly message: string };

interface PendingRequest {
  readonly resolve: (result: LayoutResult) => void;
  readonly reject: (error: Error) => void;
}

/** Browser-host transport for the solver-only worker approved by D-010. */
export class BrowserWorkerLayoutEngine implements LayoutEngine {
  private sequence = 0;
  private readonly pending = new Map<string, PendingRequest>();

  constructor(private readonly worker: Worker = new Worker(new URL("./layout-worker.ts", import.meta.url), { type: "module" })) {
    worker.addEventListener("message", this.handleMessage);
    worker.addEventListener("error", this.handleWorkerError);
  }

  layout(graph: LayoutGraph, options: LayoutEngineOptions = {}): Promise<LayoutResult> {
    const requestId = `web-layout-${this.sequence++}`;
    if (options.signal?.aborted) return Promise.reject(new DOMException("Layout was cancelled.", "AbortError"));

    return new Promise<LayoutResult>((resolve, reject) => {
      const onAbort = (): void => {
        this.worker.postMessage({ type: "cancel", requestId } satisfies WorkerRequest);
        this.pending.delete(requestId);
        reject(new DOMException("Layout was cancelled.", "AbortError"));
      };
      options.signal?.addEventListener("abort", onAbort, { once: true });
      this.pending.set(requestId, {
        resolve: (result) => {
          options.signal?.removeEventListener("abort", onAbort);
          resolve(result);
        },
        reject: (error) => {
          options.signal?.removeEventListener("abort", onAbort);
          reject(error);
        }
      });
      this.worker.postMessage({
        type: "layout",
        requestId,
        graph,
        ...(options.timeoutMs === undefined ? {} : { timeoutMs: options.timeoutMs })
      } satisfies WorkerRequest);
    });
  }

  dispose(): void {
    this.worker.removeEventListener("message", this.handleMessage);
    this.worker.removeEventListener("error", this.handleWorkerError);
    this.worker.terminate();
    for (const { reject } of this.pending.values()) reject(new Error("Layout worker was disposed."));
    this.pending.clear();
  }

  private readonly handleMessage = (event: MessageEvent<WorkerResponse>): void => {
    const response = event.data;
    const pending = this.pending.get(response.requestId);
    if (pending === undefined) return;
    this.pending.delete(response.requestId);
    if (response.type === "error") pending.reject(new Error(response.message));
    else pending.resolve(response.result);
  };

  private readonly handleWorkerError = (event: ErrorEvent): void => {
    const error = new Error(event.message || "Layout worker failed.");
    for (const { reject } of this.pending.values()) reject(error);
    this.pending.clear();
  };
}
