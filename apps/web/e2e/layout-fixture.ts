import { expect, test as base } from "@playwright/test";
import type { LayoutGraph, LayoutResult } from "@coding-cad/architecture-layout";

export interface ObservedLayout {
  readonly workerUrl: string;
  readonly graph: LayoutGraph;
  readonly result: LayoutResult;
}

declare global {
  interface Window { __p3ObservedLayouts: ObservedLayout[] }
}

/**
 * Existing status is sufficient: createLayoutEngine has one approved backend,
 * and success is emitted by fromElkGraph after ELK output validation. Fallback
 * is explicitly tagged by the same adapter. No package API field is added.
 */
export function layoutSource(result: LayoutResult): "elk" | "fallback" {
  return result.status === "success" && result.diagnostics.length === 0 ? "elk" : "fallback";
}

export const test = base.extend<{ solverGuard: void }>({
  solverGuard: [async ({ page }, use) => {
    await page.addInitScript(({ forceFallback }) => {
      window.__p3ObservedLayouts = [];
      const OriginalWorker = window.Worker;
      window.Worker = class extends OriginalWorker {
        private readonly layoutRequests = new Map<string, LayoutGraph>();
        private readonly script: string;
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          this.script = String(url);
          this.addEventListener("message", ({ data }) => {
            if (data?.type !== "result") return;
            const graph = this.layoutRequests.get(data.requestId);
            if (graph) {
              window.__p3ObservedLayouts.push({ workerUrl: this.script, graph, result: structuredClone(data.result) });
              this.layoutRequests.delete(data.requestId);
            }
          });
        }
        postMessage(message: unknown, transfer: Transferable[]): void;
        postMessage(message: unknown, options?: StructuredSerializeOptions): void;
        postMessage(message: unknown, options: Transferable[] | StructuredSerializeOptions = []): void {
          const request = message as { type?: string; requestId: string; graph: LayoutGraph };
          const isLayout = request?.type === "layout" && this.script.includes("layout-worker");
          if (isLayout) this.layoutRequests.set(request.requestId, structuredClone(request.graph));
          // Negative-control only: exercise the real engine's existing timeout fallback.
          const sent = isLayout && forceFallback ? { ...request, timeoutMs: 0 } : message;
          if (Array.isArray(options)) super.postMessage(sent, options);
          else super.postMessage(sent, options);
        }
      };
    }, { forceFallback: process.env.P3_FORCE_FALLBACK === "1" });
    await use();
    const layouts = await page.evaluate(() => window.__p3ObservedLayouts ?? []);
    for (const observation of layouts) {
      expect(observation.workerUrl, "source must be the approved solver-only worker").toContain("layout-worker");
      expect(observation.result.status, JSON.stringify(observation.result.diagnostics)).toBe("success");
      expect(layoutSource(observation.result), "solver source must be ELK, never fallback").toBe("elk");
      expect(observation.result.diagnostics).toEqual([]);
    }
    await expect(page.getByRole("status").filter({ hasText: "Layout fallback:" })).toHaveCount(0);
  }, { auto: true }]
});
