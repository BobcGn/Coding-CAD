import assert from "node:assert/strict";
import type { ElkNode } from "elkjs/lib/elk-api.js";
import { compileArchitectureProjection } from "../../compiler/compiler.js";
import { layoutFixture } from "../../compiler/test-fixture.js";
import { ElkLayoutEngine } from "./elk-engine.js";
import { createElkWorkerHandler } from "./elk-worker-runtime.js";
import { ElkWorkerLayoutEngine, type ElkWorkerTransport } from "./worker-protocol.js";

const graph = compileArchitectureProjection(layoutFixture).layoutGraph;
const snapshot = JSON.stringify(graph);
const engine = new ElkLayoutEngine();
const first = await engine.layout(graph, { timeoutMs: 5000 });
const second = await engine.layout(graph, { timeoutMs: 5000 });

assert.equal(first.status, "success");
assert.deepEqual(second, first, "identical graph and options must be deterministic");
assert.equal(first.nodes.length, graph.nodes.length);
assert.equal(first.nodes.every((node) => Number.isFinite(node.position.x) && Number.isFinite(node.size.width)), true);
assert.equal(JSON.stringify(graph), snapshot, "ELK engine must not mutate LayoutGraph");

const cancelled = new AbortController();
cancelled.abort();
const cancelledResult = await engine.layout(graph, { signal: cancelled.signal });
assert.equal(cancelledResult.status, "fallback");
assert.equal(cancelledResult.diagnostics[0]?.code, "LAYOUT_CANCELLED");

const failingEngine = new ElkLayoutEngine(async () => { throw new Error("solver unavailable"); });
const failed = await failingEngine.layout(graph);
assert.equal(failed.status, "fallback");
assert.equal(failed.diagnostics[0]?.code, "SOLVER_FAILURE");

const stalledEngine = new ElkLayoutEngine(() => new Promise<ElkNode>(() => undefined));
const timedOut = await stalledEngine.layout(graph, { timeoutMs: 1 });
assert.equal(timedOut.status, "fallback");
assert.equal(timedOut.diagnostics[0]?.code, "LAYOUT_TIMEOUT");

let cancelledRequest: string | undefined;
const workerTransport: ElkWorkerTransport = {
  async request(message) {
    return { type: "result", requestId: message.requestId, result: first };
  },
  cancel(requestId) {
    cancelledRequest = requestId;
  }
};
const workerResult = await new ElkWorkerLayoutEngine(workerTransport).layout(graph);
assert.deepEqual(workerResult, first);

const workerAbort = new AbortController();
const pendingTransport: ElkWorkerTransport = {
  request: () => new Promise((_, reject) => {
    workerAbort.signal.addEventListener("abort", () => reject(new Error("cancelled")), { once: true });
  }),
  cancel(requestId) {
    cancelledRequest = requestId;
  }
};
const pendingResult = new ElkWorkerLayoutEngine(pendingTransport).layout(graph, { signal: workerAbort.signal });
workerAbort.abort();
assert.equal((await pendingResult).diagnostics[0]?.code, "LAYOUT_CANCELLED");
assert.equal(cancelledRequest, "layout-0");

assert.doesNotMatch(JSON.stringify({ type: "layout", requestId: "fixture", graph }), /Svelte|DOM|HTMLElement/);

const runtimeResponses: Parameters<Parameters<typeof createElkWorkerHandler>[0]>[0][] = [];
const handleWorkerRequest = createElkWorkerHandler((response) => runtimeResponses.push(response));
await handleWorkerRequest({ type: "layout", requestId: "runtime-1", graph, timeoutMs: 5000 });
assert.equal(runtimeResponses[0]?.type, "result");
assert.equal(runtimeResponses[0]?.requestId, "runtime-1");

console.log("architecture-layout ELK engine integration tests passed");

// The same installed bundle must remain a module inside an existing Worker.
// A standalone-worker auto-attach must not steal the host's message handler.
const { readFile } = await import("node:fs/promises");
const { createContext, runInContext } = await import("node:vm");
const source = await readFile(new URL("../../../node_modules/elkjs/lib/elk.bundled.js", import.meta.url), "utf8");
const hostHandler = () => undefined;
const moduleRecord = { exports: {} };
const context = createContext({
  module: moduleRecord, exports: moduleRecord.exports, console,
  setTimeout, clearTimeout, postMessage: () => undefined, onmessage: hostHandler
});
runInContext("self=globalThis", context);
runInContext(source, context);
assert.equal(context.onmessage, hostHandler, "ELK must not replace the existing worker handler");
const embeddedWorkerResult = await runInContext(`new module.exports().layout({
  id: "root", layoutOptions: { "elk.algorithm": "layered" },
  children: [{ id: "a", width: 100, height: 60 }, { id: "b", width: 100, height: 60 }],
  edges: [{ id: "ab", sources: ["a"], targets: ["b"] }]
})`, context) as { children: { x: number; y: number }[]; edges: { sections?: unknown[] }[] };
assert.equal(embeddedWorkerResult.children.length, 2);
assert.ok(embeddedWorkerResult.children.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y)));
assert.equal(embeddedWorkerResult.edges[0]?.sections?.length, 1, "the solver must produce a real route");
console.log("ELK embedded worker CommonJS regression passed");
