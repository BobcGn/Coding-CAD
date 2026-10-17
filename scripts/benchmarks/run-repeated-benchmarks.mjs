import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const webDir = path.join(repoRoot, "apps/web");
const require = createRequire(path.join(webDir, "package.json"));
const { chromium } = require("@playwright/test");
const PORT = 4178;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const FIXTURES = [
  {
    id: "coding-cad",
    name: "Coding-CAD (this repository)",
    path: repoRoot,
    targetNode: '.svelte-flow__node[data-id="architecture-ir"]',
    components: 15,
    edges: 40
  },
  {
    id: "synthetic-large-repo",
    name: "synthetic-large-repo (120 modules)",
    path: path.join(repoRoot, "packages/implementation-analyzer/fixtures/synthetic-large-repo"),
    targetNode: '.svelte-flow__node[data-id="pkg-00-alpha-service"]',
    components: 120,
    edges: 147
  },
  {
    id: "synthetic-hub-repo",
    name: "synthetic-hub-repo (57 modules)",
    path: path.join(repoRoot, "packages/implementation-analyzer/fixtures/synthetic-hub-repo"),
    targetNode: '.svelte-flow__node[data-id="pkg-analytics-pipeline-alert-evaluator-service"]',
    components: 57,
    edges: 83
  },
  {
    id: "skill-central",
    name: "skill-central (real repo, 290 files)",
    path: "/Users/bobcgn/AAA_Codings/Personal_Projects/skill-central",
    targetNode: '.svelte-flow__node[data-id="commands-service"]',
    components: 23,
    edges: 77
  }
];

function calculateStats(values) {
  if (values.length === 0) return { min: 0, max: 0, median: 0, p95: 0, mean: 0, stdDev: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
  
  // Median
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  
  // p95 (nearest-rank)
  const p95Index = Math.min(Math.ceil(0.95 * sorted.length) - 1, sorted.length - 1);
  const p95 = sorted[p95Index];

  const variance = sorted.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / sorted.length;
  const stdDev = Math.sqrt(variance);

  return {
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    median: Number(median.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    mean: Number(mean.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    samples: sorted.map((v) => Number(v.toFixed(2)))
  };
}

async function waitForServer(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status === 200 || res.status === 404) return;
    } catch {
      // wait and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  throw new Error(`Server at ${url} did not respond within ${timeoutMs}ms`);
}

async function runBenchmarkForMode(mode) {
  console.log(`\n========================================`);
  console.log(`Starting benchmark for mode: ${mode}`);
  console.log(`========================================\n`);

  const tempWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), "cad-benchmark-"));
  const serverEnv = {
    ...process.env,
    CODING_CAD_WORKSPACE_ROOT: tempWorkspace,
    CODING_CAD_ENABLE_REPOSITORY_ANALYSIS: "true"
  };

  let serverProc;
  if (mode === "dev") {
    serverProc = spawn("pnpm", ["dev", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
      cwd: webDir,
      env: serverEnv,
      stdio: "pipe"
    });
  } else {
    // build first for preview mode
    console.log("Building web app for preview mode...");
    const buildProc = spawn("pnpm", ["exec", "vite", "build", "--mode", "layout-acceptance"], {
      cwd: webDir,
      env: serverEnv,
      stdio: "inherit"
    });
    await new Promise((resolve, reject) => {
      buildProc.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`Vite build failed with code ${code}`))));
    });

    serverProc = spawn("pnpm", ["exec", "vite", "preview", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"], {
      cwd: webDir,
      env: serverEnv,
      stdio: "pipe"
    });
  }

  // Handle server logs
  serverProc.stderr.on("data", (data) => {
    const msg = data.toString();
    if (!msg.includes("warning") && !msg.includes("ExperimentalWarning")) {
      // console.error(`[Server ${mode} err]`, msg.trim());
    }
  });

  await waitForServer(BASE_URL);
  console.log(`Server started successfully at ${BASE_URL}`);

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.__p3ObservedLayouts = [];
    const OriginalWorker = window.Worker;
    window.Worker = class extends OriginalWorker {
      layoutRequests = new Map();
      script;
      constructor(url, options) {
        super(url, options);
        this.script = String(url);
        this.addEventListener("message", ({ data }) => {
          if (data?.type !== "result") return;
          const graph = this.layoutRequests.get(data.requestId);
          if (graph) {
            window.__p3ObservedLayouts.push({
              workerUrl: this.script,
              graph,
              result: structuredClone(data.result)
            });
            this.layoutRequests.delete(data.requestId);
          }
        });
      }
      postMessage(message, options) {
        const isLayout = message?.type === "layout" && this.script.includes("layout-worker");
        if (isLayout) {
          this.layoutRequests.set(message.requestId, structuredClone(message.graph));
        }
        super.postMessage(message, options);
      }
    };
  });
  const page = await context.newPage();

  const modeResults = {};

  try {
    for (const fixture of FIXTURES) {
      console.log(`\nBenchmarking fixture: ${fixture.name} (10 iterations)...`);
      const serverDurations = [];
      const renderDurations = [];
      const expandedCrossingsList = [];
      const visibleNodesList = [];
      const totalNodesList = [];

      for (let i = 1; i <= 10; i++) {
        await page.goto(BASE_URL, { waitUntil: "networkidle" });
        await page.getByTestId("open-repository-btn").click();
        await page.getByTestId("repo-path-input").fill(fixture.path);

        const clientStart = performance.now();
        let serverDurationMs = 0;

        const responsePromise = page.waitForResponse(
          (resp) => resp.url().includes("/api/workspace/analyze-repository") && resp.status() === 200
        );

        const requestStart = performance.now();
        await page.getByTestId("repo-analyze-submit").click();

        const response = await responsePromise;
        serverDurationMs = performance.now() - requestStart;

        // Wait for target node
        const target = page.locator(fixture.targetNode);
        await target.waitFor({ state: "visible", timeout: 45000 });

        const canvas = page.locator('div[role="application"][aria-label="Architecture Canvas"]');
        await canvas.waitFor({ state: "visible" });
        const firstScreenRenderMs = performance.now() - clientStart;

        const solver = await canvas.getAttribute("data-layout-solver");
        const status = await canvas.getAttribute("data-layout-status");

        if (solver !== "elk" || status !== "success") {
          throw new Error(`Layout failure on fixture ${fixture.id}: solver=${solver}, status=${status}`);
        }

        // Measure visible nodes in default state (actual product behavior)
        const visibleNodes = await page.locator('.svelte-flow__node:not([style*="display: none"])').count();
        const totalNodes = await page.locator('.svelte-flow__node').count();

        // Measure crossings in fully expanded default layout using measureLayout definition
        const quality = await page.evaluate(() => {
          const layouts = window.__p3ObservedLayouts ?? [];
          const last = layouts.at(-1);
          if (!last || !last.result) return null;
          const result = last.result;

          const segmentCrosses = (a, b, c, d) => {
            const cross = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
            return cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0;
          };
          let crossings = 0;
          for (let i = 0; i < result.edges.length; i++) {
            for (let j = i + 1; j < result.edges.length; j++) {
              const a = result.edges[i];
              const b = result.edges[j];
              if ([a.from, a.to].some((id) => id === b.from || id === b.to)) continue;
              for (const sa of a.sections) {
                for (const sb of b.sections) {
                  const pa = [sa.start, ...(sa.bendPoints || []), sa.end];
                  const pb = [sb.start, ...(sb.bendPoints || []), sb.end];
                  for (let x = 1; x < pa.length; x++) {
                    for (let y = 1; y < pb.length; y++) {
                      if (segmentCrosses(pa[x - 1], pa[x], pb[y - 1], pb[y])) crossings++;
                    }
                  }
                }
              }
            }
          }
          return {
            nodesCount: result.nodes.length,
            edgesCount: result.edges.length,
            crossings
          };
        });

        serverDurations.push(serverDurationMs);
        renderDurations.push(firstScreenRenderMs);
        expandedCrossingsList.push(quality?.crossings ?? 0);
        visibleNodesList.push(visibleNodes);
        totalNodesList.push(totalNodes);

        process.stdout.write(` [iter ${i}: srv=${serverDurationMs.toFixed(1)}ms, render=${firstScreenRenderMs.toFixed(1)}ms, vis=${visibleNodes}, cross=${quality?.crossings ?? 0}]`);
      }
      console.log("");

      modeResults[fixture.id] = {
        fixture: fixture.name,
        components: fixture.components,
        edges: fixture.edges,
        serverDuration: calculateStats(serverDurations),
        firstScreenRender: calculateStats(renderDurations),
        expandedCrossings: calculateStats(expandedCrossingsList),
        visibleNodesDefault: calculateStats(visibleNodesList),
        totalNodesDefault: calculateStats(totalNodesList)
      };
    }
  } finally {
    await browser.close();
    serverProc.kill("SIGTERM");
    try {
      fs.rmSync(tempWorkspace, { recursive: true, force: true });
    } catch {}
  }

  return modeResults;
}

async function main() {
  const hardware = {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpuModel: os.cpus()[0]?.model ?? "Unknown",
    cpuCores: os.cpus().length,
    totalMemoryGb: Number((os.totalmem() / 1e9).toFixed(2)),
    nodeVersion: process.version
  };

  console.log("Hardware specs:", hardware);

  const devResults = await runBenchmarkForMode("dev");
  const previewResults = await runBenchmarkForMode("preview");

  const fullReport = {
    timestamp: new Date().toISOString(),
    hardware,
    modes: {
      dev: devResults,
      preview: previewResults
    }
  };

  const outJsonPath = path.join(repoRoot, "logs/validation/p4-browser/repeated-benchmarks-summary.json");
  fs.writeFileSync(outJsonPath, JSON.stringify(fullReport, null, 2), "utf8");
  console.log(`\nSaved repeated benchmarks to ${outJsonPath}`);
}

main().catch((err) => {
  console.error("Benchmark runner failed:", err);
  process.exit(1);
});
