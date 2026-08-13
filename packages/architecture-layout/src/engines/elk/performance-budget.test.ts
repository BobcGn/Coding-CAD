import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { performance } from "node:perf_hooks";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { LayoutGraph } from "../../ir/layout-graph.js";
import { ElkLayoutEngine } from "./elk-engine.js";
import { ELK_WORKER_GZIP_BUDGET_BYTES, LAYOUT_PERFORMANCE_BUDGETS } from "./performance-budget.js";

for (const budget of LAYOUT_PERFORMANCE_BUDGETS) {
  const graph = createBenchmarkGraph(budget.nodes, budget.edges);
  const engine = new ElkLayoutEngine();
  const samples: number[] = [];
  const coldStarted = performance.now();
  assert.equal((await engine.layout(graph, { timeoutMs: budget.p95Ms * 4 })).status, "success");
  const coldMs = performance.now() - coldStarted;
  const iterations = 20;
  for (let index = 0; index < iterations; index += 1) {
    const started = performance.now();
    const result = await engine.layout(graph, { timeoutMs: budget.p95Ms * 4 });
    assert.equal(result.status, "success");
    samples.push(performance.now() - started);
  }
  samples.sort((left, right) => left - right);
  const p95 = samples[Math.ceil(samples.length * 0.95) - 1]!;
  assert.ok(p95 <= budget.p95Ms, `${budget.nodes}-node layout p95 ${p95.toFixed(2)}ms exceeded ${budget.p95Ms}ms`);
  console.log(`architecture-layout benchmark ${budget.nodes}/${budget.edges}: cold=${coldMs.toFixed(2)}ms p95=${p95.toFixed(2)}ms`);
}

const elkModuleUrl = import.meta.resolve("elkjs/lib/elk.bundled.js");
const elkGzipBytes = gzipSync(await readFile(fileURLToPath(elkModuleUrl))).byteLength;
assert.ok(elkGzipBytes <= ELK_WORKER_GZIP_BUDGET_BYTES, `ELK gzip ${elkGzipBytes} exceeded ${ELK_WORKER_GZIP_BUDGET_BYTES}`);
console.log(`architecture-layout ELK worker gzip=${elkGzipBytes} bytes`);

function createBenchmarkGraph(nodeCount: number, edgeCount: number): LayoutGraph {
  const nodes = Array.from({ length: nodeCount }, (_, index) => ({
    id: `node-${index}`,
    sourceId: `node-${index}`,
    kind: "component" as const,
    label: `Service ${index}`,
    role: "service" as const,
    hints: {
      preferredRank: "application" as const,
      portDirection: "bidirectional" as const,
      infrastructure: false,
      externalBoundary: false
    }
  }));
  const edges = Array.from({ length: edgeCount }, (_, index) => {
    const from = index % (nodeCount - 1);
    const remaining = nodeCount - from - 1;
    const span = 1 + (Math.floor(index / (nodeCount - 1)) % Math.min(7, remaining));
    const to = from + span;
    return {
      id: `edge-${index}`,
      sourceId: `edge-${index}`,
      from: `node-${from}`,
      to: `node-${to}`,
      asynchronous: false
    };
  });
  return {
    direction: "LR",
    nodes,
    edges,
    constraints: [{ kind: "direction", direction: "LR", strength: "required" }]
  };
}
