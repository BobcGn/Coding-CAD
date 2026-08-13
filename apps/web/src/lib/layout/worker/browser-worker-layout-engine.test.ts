import { describe, expect, it } from "vitest";
import type { LayoutGraph, LayoutResult } from "@coding-cad/architecture-layout";
import { BrowserWorkerLayoutEngine } from "./browser-worker-layout-engine.js";

const graph: LayoutGraph = { direction: "LR", nodes: [], edges: [], constraints: [] };
const result: LayoutResult = {
  status: "success",
  direction: "LR",
  size: { width: 0, height: 0 },
  nodes: [],
  edges: [],
  diagnostics: []
};

class FakeWorker extends EventTarget {
  readonly messages: unknown[] = [];
  terminated = false;

  postMessage(message: unknown): void {
    this.messages.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  respond(data: unknown): void {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }
}

describe("browser solver worker transport", () => {
  it("resolves only the matching worker response", async () => {
    const worker = new FakeWorker();
    const engine = new BrowserWorkerLayoutEngine(worker as unknown as Worker);
    const pending = engine.layout(graph);
    worker.respond({ type: "result", requestId: "stale", result });
    worker.respond({ type: "result", requestId: "web-layout-0", result });
    await expect(pending).resolves.toEqual(result);
    engine.dispose();
  });

  it("posts cancellation and rejects without accepting a late response", async () => {
    const worker = new FakeWorker();
    const engine = new BrowserWorkerLayoutEngine(worker as unknown as Worker);
    const controller = new AbortController();
    const pending = engine.layout(graph, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(worker.messages).toContainEqual({ type: "cancel", requestId: "web-layout-0" });
    worker.respond({ type: "result", requestId: "web-layout-0", result });
    engine.dispose();
  });
});
