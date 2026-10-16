import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ImplementationAnalyzer } from "./analyzer.js";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";

export interface TruthModule {
  readonly id: string;
  readonly name?: string;
  readonly package?: string;
  readonly path?: string;
}

export interface TruthConnection {
  readonly from: string;
  readonly to: string;
  readonly type?: string;
}

export interface GroundTruth {
  readonly type?: string;
  readonly note?: string;
  readonly modules: readonly TruthModule[];
  readonly connections?: readonly TruthConnection[];
  readonly dependenciesFromReadme?: readonly TruthConnection[];
  readonly dependenciesFromPackageJson?: readonly TruthConnection[];
}

export interface MetricSummary {
  readonly detected: number;
  readonly expected: number;
  readonly truePositives: number;
  readonly falsePositives: number;
  readonly falseNegatives: number;
  readonly precision: number;
  readonly recall: number;
}

export interface EvidenceBreakdown {
  readonly declared: number;
  readonly resolved: number;
  readonly inferred: number;
}

export interface BenchmarkResult {
  readonly name: string;
  readonly rootPath: string;
  readonly passed: boolean;
  readonly failureReason?: string | undefined;
  readonly elapsedMs: number;
  readonly modules: MetricSummary;
  readonly connections: MetricSummary;
  readonly evidenceBreakdown: EvidenceBreakdown;
  readonly detectedComponents: readonly string[];
  readonly detectedConnections: readonly string[];
}

export async function runBenchmark(
  name: string,
  rootPath: string,
  truth: GroundTruth
): Promise<BenchmarkResult> {
  const absoluteRoot = path.resolve(rootPath);
  const analyzer = new ImplementationAnalyzer();
  const startTime = performance.now();
  let project: ArchitectureProject;
  try {
    project = await analyzer.analyze(absoluteRoot);
  } catch (error) {
    const elapsedMs = performance.now() - startTime;
    return {
      name,
      rootPath: absoluteRoot,
      passed: false,
      failureReason: `Analyzer threw exception: ${error instanceof Error ? error.message : String(error)}`,
      elapsedMs,
      modules: { detected: 0, expected: truth.modules.length, truePositives: 0, falsePositives: 0, falseNegatives: truth.modules.length, precision: 0, recall: 0 },
      connections: { detected: 0, expected: (truth.connections ?? truth.dependenciesFromPackageJson ?? []).length, truePositives: 0, falsePositives: 0, falseNegatives: 0, precision: 0, recall: 0 },
      evidenceBreakdown: { declared: 0, resolved: 0, inferred: 0 },
      detectedComponents: [],
      detectedConnections: []
    };
  }
  const elapsedMs = performance.now() - startTime;

  const detectedComponents = project.architecture.components;
  const detectedConnections = project.architecture.connections;

  // Expected modules
  const expectedModules = truth.modules;
  const expectedConnections = truth.connections ?? truth.dependenciesFromPackageJson ?? [];

  // Match modules by ID or name
  const matchedModuleIds = new Set<string>();
  let moduleTP = 0;
  for (const comp of detectedComponents) {
    const normId = normalize(comp.id);
    const normName = normalize(comp.name);
    const found = expectedModules.find(
      (m) => normalize(m.id) === normId || normalize(m.name ?? "") === normName || (m.package && normalize(m.package).endsWith(normId))
    );
    if (found) {
      moduleTP++;
      matchedModuleIds.add(found.id);
    }
  }
  const moduleFP = detectedComponents.length - moduleTP;
  const moduleFN = expectedModules.length - matchedModuleIds.size;
  const modulePrecision = detectedComponents.length > 0 ? moduleTP / detectedComponents.length : 0;
  const moduleRecall = expectedModules.length > 0 ? moduleTP / expectedModules.length : 0;

  // Match connections
  let connTP = 0;
  const matchedConnKeys = new Set<string>();
  for (const conn of detectedConnections) {
    const fromNorm = normalize(conn.from);
    const toNorm = normalize(conn.to);
    const found = expectedConnections.find((c) => {
      const cFrom = normalize(c.from);
      const cTo = normalize(c.to);
      return (fromNorm.includes(cFrom) || cFrom.includes(fromNorm)) && (toNorm.includes(cTo) || cTo.includes(toNorm));
    });
    if (found) {
      connTP++;
      matchedConnKeys.add(`${found.from}->${found.to}`);
    }
  }
  const connFP = detectedConnections.length - connTP;
  const connFN = expectedConnections.length - matchedConnKeys.size;
  const connPrecision = detectedConnections.length > 0 ? connTP / detectedConnections.length : 0;
  const connRecall = expectedConnections.length > 0 ? connTP / expectedConnections.length : 0;

  // Evidence breakdown
  let declared = 0;
  let resolved = 0;
  let inferred = 0;
  for (const comp of detectedComponents) {
    const tags = comp.tags ?? [];
    if (tags.some((t) => t.includes("declared"))) declared++;
    else if (tags.some((t) => t.includes("resolved") || t.includes("confidence:0.9"))) resolved++;
    else inferred++;
  }

  // Hard gate check: 0 modules or 0 connections is a failure
  const zeroDetected = detectedComponents.length === 0 || detectedConnections.length === 0;
  const failureReason = zeroDetected
    ? `[FAIL] Zero detection detected: ${detectedComponents.length} modules, ${detectedConnections.length} connections.`
    : undefined;

  return {
    name,
    rootPath: absoluteRoot,
    passed: !zeroDetected,
    failureReason,
    elapsedMs,
    modules: {
      detected: detectedComponents.length,
      expected: expectedModules.length,
      truePositives: moduleTP,
      falsePositives: moduleFP,
      falseNegatives: moduleFN,
      precision: round4(modulePrecision),
      recall: round4(moduleRecall)
    },
    connections: {
      detected: detectedConnections.length,
      expected: expectedConnections.length,
      truePositives: connTP,
      falsePositives: connFP,
      falseNegatives: connFN,
      precision: round4(connPrecision),
      recall: round4(connRecall)
    },
    evidenceBreakdown: { declared, resolved, inferred },
    detectedComponents: detectedComponents.map((c) => c.id),
    detectedConnections: detectedConnections.map((c) => `${c.from}->${c.to}`)
  };
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function round4(num: number): number {
  return Math.round(num * 10000) / 10000;
}

export function formatReport(results: readonly BenchmarkResult[]): string {
  const lines: string[] = [
    "# Implementation Analyzer Baseline Report / 实现反演基线报告",
    "",
    `生成时间 / Generated at: ${new Date().toISOString()}`,
    "",
    "| Fixture | Passed? | Modules (D/E) | Mod P / R | Conns (D/E) | Conn P / R | Evidence (Decl/Res/Inf) | Elapsed (ms) |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const r of results) {
    const status = r.passed ? "PASS" : `FAIL (${r.failureReason ?? "zero detected"})`;
    const modStr = `${r.modules.detected}/${r.modules.expected}`;
    const modPR = `${(r.modules.precision * 100).toFixed(1)}% / ${(r.modules.recall * 100).toFixed(1)}%`;
    const connStr = `${r.connections.detected}/${r.connections.expected}`;
    const connPR = `${(r.connections.precision * 100).toFixed(1)}% / ${(r.connections.recall * 100).toFixed(1)}%`;
    const evStr = `${r.evidenceBreakdown.declared} / ${r.evidenceBreakdown.resolved} / ${r.evidenceBreakdown.inferred}`;
    lines.push(
      `| ${r.name} | ${status} | ${modStr} | ${modPR} | ${connStr} | ${connPR} | ${evStr} | ${r.elapsedMs.toFixed(2)} |`
    );
  }

  return lines.join("\n");
}

function findWorkspaceRoot(startDir: string = process.cwd()): string {
  let curr = path.resolve(startDir);
  while (curr !== path.dirname(curr)) {
    if (existsSync(path.join(curr, "pnpm-workspace.yaml"))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return startDir;
}

export async function runAllBenchmarks(): Promise<readonly BenchmarkResult[]> {
  const root = findWorkspaceRoot();
  const results: BenchmarkResult[] = [];

  // 1. Current repo (Coding-CAD)
  const goldenPath = path.join(root, "packages/implementation-analyzer/fixtures/coding-cad-golden.json");
  const goldenTruth = JSON.parse(readFileSync(goldenPath, "utf8")) as GroundTruth;
  results.push(await runBenchmark("Coding-CAD (this repository)", root, goldenTruth));

  // 2. small-monorepo
  const smallMonoRoot = path.join(root, "packages/implementation-analyzer/fixtures/small-monorepo");
  const smallMonoTruth = JSON.parse(readFileSync(path.join(smallMonoRoot, "truth.json"), "utf8")) as GroundTruth;
  results.push(await runBenchmark("small-monorepo (pnpm workspace)", smallMonoRoot, smallMonoTruth));

  // 3. small-single-repo
  const smallSingleRoot = path.join(root, "packages/implementation-analyzer/fixtures/small-single-repo");
  const smallSingleTruth = JSON.parse(readFileSync(path.join(smallSingleRoot, "truth.json"), "utf8")) as GroundTruth;
  results.push(await runBenchmark("small-single-repo (plain src/)", smallSingleRoot, smallSingleTruth));

  // 4. synthetic-large-repo
  const largeRoot = path.join(root, "packages/implementation-analyzer/fixtures/synthetic-large-repo");
  const largeTruth = JSON.parse(readFileSync(path.join(largeRoot, "truth.json"), "utf8")) as GroundTruth;
  results.push(await runBenchmark("synthetic-large-repo (SYNTHETIC)", largeRoot, largeTruth));

  return results;
}

// Direct execution
const isMain = process.argv[1] && (
  process.argv[1].endsWith("benchmark.js") ||
  process.argv[1].endsWith("benchmark.ts")
);

if (isMain) {
  runAllBenchmarks().then((results) => {
    const reportText = formatReport(results);
    console.log("\n" + reportText + "\n");

    const outDir = path.resolve(findWorkspaceRoot(), "logs/validation/p4-baseline");
    mkdirSync(outDir, { recursive: true });
    writeFileSync(path.join(outDir, "analyzer-baseline-before.json"), JSON.stringify(results, null, 2));
    writeFileSync(path.join(outDir, "baseline-report-before.md"), reportText);
    console.log(`Saved baseline evidence to ${outDir}/analyzer-baseline-before.json and baseline-report-before.md`);
  }).catch((err) => {
    console.error("Benchmark failed:", err);
    process.exit(1);
  });
}
