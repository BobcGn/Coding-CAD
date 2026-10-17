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
/** Maximum single file size in bytes (2 MB). */
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export const POST: RequestHandler = async ({ request, url }) => {
  // 0. Explicit environment switch check
  const isEnabled =
    process.env.CODING_CAD_ENABLE_REPOSITORY_ANALYSIS === "true" ||
    process.env.CODING_CAD_ENABLE_REPOSITORY_ANALYSIS === "1";
  if (!isEnabled) {
    throw error(403, "Repository analysis is disabled. Set CODING_CAD_ENABLE_REPOSITORY_ANALYSIS=true to enable.");
  }

  // 1. Host header whitelist
  const hostHeader = request.headers.get("host");
  if (!hostHeader) {
    throw error(403, "Access forbidden: Missing Host header.");
  }
  const hostMatch = hostHeader.trim().toLowerCase().match(/^(\[[a-f0-9:]+\]|[^:]+)(?::\d+)?$/);
  const hostName = hostMatch ? hostMatch[1] : "";
  if (!LOOPBACK_HOSTS.has(hostName)) {
    throw error(403, `Access forbidden: Host '${hostHeader}' is not allowed.`);
  }

  // 2. Origin check (if present)
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    let originHost = "";
    try {
      originHost = new URL(originHeader).hostname.toLowerCase();
    } catch {
      throw error(403, "Access forbidden: Malformed Origin header.");
    }
    if (!LOOPBACK_HOSTS.has(originHost) && !LOOPBACK_HOSTS.has(`[${originHost}]`)) {
      throw error(403, `Access forbidden: Origin '${originHeader}' is not allowed.`);
    }
  }

  // 3. Content-Type check
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    throw error(403, "Access forbidden: Request must specify Content-Type: application/json.");
  }

  // 4. URL hostname check
  const hostname = url.hostname.toLowerCase();
  if (!LOOPBACK_HOSTS.has(hostname) && hostname !== "") {
    throw error(403, "Access forbidden: repository analysis is restricted to loopback interface.");
  }

  // 5. Validate request payload
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

  // 6. Reject explicit path traversal escaping
  if (inputPath.includes("..")) {
    throw error(400, "Repository path must not contain traversal segments ('..').");
  }

  const normalized = path.normalize(inputPath);
  const resolved = path.resolve(normalized);

  // 7. Verify directory existence and realpath containment
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

  // 8. Execute analysis with resource caps and execution timer
  const maxFiles = payload.options?.maxFiles !== undefined
    ? Math.max(1, payload.options.maxFiles)
    : MAX_FILE_COUNT;
  const timeoutMs = payload.options?.timeoutMs !== undefined
    ? Math.max(1, payload.options.timeoutMs)
    : MAX_ANALYSIS_DURATION_MS;
  const maxFileSizeBytes = payload.options?.maxFileSizeBytes !== undefined
    ? Math.max(1, payload.options.maxFileSizeBytes)
    : MAX_FILE_SIZE_BYTES;

  const scannerOptions = { maxFiles, timeoutMs, maxFileSizeBytes };
  const startTime = performance.now();
  const analyzer = new ImplementationAnalyzer();

  let inspection;
  try {
    inspection = await analyzer.inspect(realRoot, scannerOptions);
  } catch (err) {
    throw error(500, `Analysis inspection failed: ${err instanceof Error ? err.message : String(err)}`);
  }

  const elapsedMs = performance.now() - startTime;
  let truncated: TruncationReportDto | undefined;

  // Check truncation indicators
  if (inspection.isTruncated || inspection.snapshot.isTruncated) {
    const reason = inspection.truncationReason ?? inspection.snapshot.truncationReason;
    const hitLimit = reason === "timeout" ? "timeout" : "file-count";
    truncated = {
      hitLimit,
      message: hitLimit === "timeout"
        ? `Repository analysis timed out after ${timeoutMs}ms.`
        : `Repository file count reached limit (${maxFiles} files). Analysis was truncated.`
    };
  } else if (inspection.unsupportedStructures?.some((s) => s.type === "oversized-file")) {
    truncated = {
      hitLimit: "file-size",
      message: `One or more files exceeded the single file size limit (${maxFileSizeBytes} bytes).`
    };
  } else if (inspection.snapshot.files.length >= maxFiles) {
    truncated = {
      hitLimit: "file-count",
      message: `Repository file count (${inspection.snapshot.files.length}) reached limit (${maxFiles}). Analysis was truncated.`
    };
  } else if (elapsedMs > timeoutMs) {
    truncated = {
      hitLimit: "timeout",
      message: `Repository analysis duration (${elapsedMs.toFixed(0)}ms) exceeded maximum timeout (${timeoutMs}ms).`
    };
  }

  // 9. Map to ArchitectureProject
  let architecture;
  try {
    architecture = await analyzer.analyze(realRoot, scannerOptions);
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
