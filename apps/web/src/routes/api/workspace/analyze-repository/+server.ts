import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { error, json } from "@sveltejs/kit";
import { ImplementationAnalyzer } from "@coding-cad/implementation-analyzer";
import type { RequestHandler } from "./$types.js";
import type {
  AnalyzeRepositoryRequest,
  AnalyzeRepositoryResponse,
  TruncationReportDto,
  UnsupportedStructureDto
} from "$lib/architecture/workspace/contract.js";

/** Maximum files to scan before explicit truncation. */
const MAX_FILE_COUNT = 5000;
/** Maximum execution duration in milliseconds before timeout truncation. */
const MAX_ANALYSIS_DURATION_MS = 30000;

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export const POST: RequestHandler = async ({ request, url }) => {
  // 1. Loopback only security check
  const hostname = url.hostname.toLowerCase();
  if (!LOOPBACK_HOSTS.has(hostname) && hostname !== "") {
    throw error(403, "Access forbidden: repository analysis is restricted to loopback interface.");
  }

  // 2. Validate request payload
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw error(400, "Invalid JSON body.");
  }

  const payload = body as AnalyzeRepositoryRequest;
  if (typeof payload?.repositoryPath !== "string" || payload.repositoryPath.trim().length === 0) {
    throw error(400, "AnalyzeRepositoryRequest requires a non-empty repositoryPath.");
  }

  const inputPath = payload.repositoryPath.trim();

  // 3. Reject explicit path traversal escaping
  if (inputPath.includes("..")) {
    throw error(400, "Repository path must not contain traversal segments ('..').");
  }

  const normalized = path.normalize(inputPath);
  const resolved = path.resolve(normalized);

  // 4. Verify directory existence and realpath containment
  let dirStat;
  try {
    dirStat = await stat(resolved);
  } catch {
    throw error(400, `Repository path does not exist: ${resolved}`);
  }

  if (!dirStat.isDirectory()) {
    throw error(400, `Repository path is not a directory: ${resolved}`);
  }

  let realRoot: string;
  try {
    realRoot = await realpath(resolved);
  } catch (err) {
    throw error(400, `Failed to resolve realpath for repository: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 5. Execute analysis with resource caps and execution timer
  const startTime = performance.now();
  const analyzer = new ImplementationAnalyzer();

  let inspection;
  try {
    inspection = await analyzer.inspect(realRoot);
  } catch (err) {
    throw error(500, `Analysis inspection failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const elapsedMs = performance.now() - startTime;
  let truncated: TruncationReportDto | undefined;

  // Check file count cap
  const totalFiles = inspection.snapshot.files.length;
  if (totalFiles > MAX_FILE_COUNT) {
    truncated = {
      hitLimit: "file-count",
      message: `Repository file count (${totalFiles}) exceeded maximum limit (${MAX_FILE_COUNT}). Analysis was truncated.`
    };
  } else if (elapsedMs > MAX_ANALYSIS_DURATION_MS) {
    truncated = {
      hitLimit: "timeout",
      message: `Repository analysis duration (${elapsedMs.toFixed(0)}ms) exceeded maximum timeout (${MAX_ANALYSIS_DURATION_MS}ms).`
    };
  }

  // 6. Map to ArchitectureProject
  let architecture;
  try {
    architecture = await analyzer.analyze(realRoot);
  } catch (err) {
    throw error(500, `Architecture reconstruction failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  // 7. Format browser-safe DTO (no source text, only relative paths and structure)
  const unsupportedStructures: UnsupportedStructureDto[] = (
    inspection.unsupportedStructures ?? []
  ).map((report) => ({
    type: report.type,
    reason: report.reason,
    scope: report.scope.startsWith(realRoot)
      ? path.relative(realRoot, report.scope).split(path.sep).join("/")
      : report.scope
  }));

  const responsePayload: AnalyzeRepositoryResponse = {
    architectureJson: JSON.stringify(architecture),
    inspection: {
      languages: inspection.snapshot.languages,
      configFiles: inspection.snapshot.configFiles,
      dependencies: inspection.snapshot.dependencies,
      unsupportedStructures,
      ...(truncated !== undefined ? { truncated } : {})
    }
  };

  return json(responsePayload);
};
