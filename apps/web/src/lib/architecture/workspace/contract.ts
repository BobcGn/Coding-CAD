/**
 * Browser-safe Workspace DTO contract (P3.1 / P3-D1).
 *
 * These types are the typed app contract between the browser and the
 * SvelteKit server boundary. They are pure JSON-serializable projections of
 * the Node-only `@coding-cad/workspace` public API and contain no `node:*`
 * imports, no file-storage types, and no disk schemas. The browser imports
 * only this file (plus the workspace bridge); server routes perform the
 * Node-only work.
 *
 * P3.1/P3-D1 的 browser-safe DTO 契约：浏览器与 SvelteKit server boundary 之间
 * 的 typed app contract。它们是 Node-only @coding-cad/workspace public API 的
 * 纯 JSON 可序列化投影，不含 node:* 导入、文件存储类型或磁盘 schema。浏览器
 * 只导入本文件（以及 workspace bridge）；Node-only 工作在 server route 内完成。
 */

/** Minimal serializable project summary returned by create/open. */
export interface WorkspaceProjectDto {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Create a new project from an existing ArchitectureProject snapshot. */
export interface CreateProjectRequest {
  readonly name: string;
  readonly architectureJson: string;
}

export interface CreateProjectResponse {
  readonly project: WorkspaceProjectDto;
}

/** Open an existing project by id. */
export interface OpenProjectRequest {
  readonly id: string;
}

export interface OpenProjectResponse {
  readonly project: WorkspaceProjectDto;
  readonly architectureJson: string;
}

/** Persist the current accepted ArchitectureProject snapshot. */
export interface SaveProjectRequest {
  readonly id: string;
  readonly architectureJson: string;
}

export interface SaveProjectResponse {
  readonly project: WorkspaceProjectDto;
  readonly version: number;
}

/**
 * Validate that a value is a plain object with the expected shape at the
 * boundary. Server routes reject untyped payloads with a structured error.
 */
export function isWorkspaceProjectDto(value: unknown): value is WorkspaceProjectDto {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.createdAt === "string" &&
    typeof record.updatedAt === "string"
  );
}
