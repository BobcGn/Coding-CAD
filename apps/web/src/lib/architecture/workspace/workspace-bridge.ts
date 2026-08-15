import type {
  CreateProjectRequest,
  CreateProjectResponse,
  OpenProjectRequest,
  OpenProjectResponse,
  SaveProjectRequest,
  SaveProjectResponse
} from "./contract.js";

/**
 * Browser-side typed client for the Workspace host bridge (P3.1 / P3-D1).
 *
 * This module is the only browser entry point for Workspace lifecycle
 * operations. It performs fetch calls against the SvelteKit server boundary
 * and returns typed DTOs. It imports no `node:*`, no file-storage types, and
 * no disk schemas; all Node-only work happens in the server route.
 *
 * P3.1/P3-D1 的浏览器侧 typed client：Workspace 生命周期操作的唯一浏览器入口。
 * 它向 SvelteKit server boundary 发起 fetch 并返回 typed DTO；不导入 node:*、
 * 文件存储类型或磁盘 schema；所有 Node-only 工作在 server route 内完成。
 */

const WORKSPACE_ENDPOINT = "/api/workspace";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Workspace request failed (${response.status}): ${body}`);
  }
  return (await response.json()) as T;
}

function jsonInit(method: string, payload: unknown): RequestInit {
  return {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  };
}

/** Create a new project on the server boundary. */
export async function createProject(req: CreateProjectRequest): Promise<CreateProjectResponse> {
  return request<CreateProjectResponse>(WORKSPACE_ENDPOINT, jsonInit("POST", req));
}

/** Open an existing project from the server boundary. */
export async function openProject(req: OpenProjectRequest): Promise<OpenProjectResponse> {
  return request<OpenProjectResponse>(`${WORKSPACE_ENDPOINT}/${encodeURIComponent(req.id)}`);
}

/** Save the accepted ArchitectureProject snapshot on the server boundary. */
export async function saveProject(req: SaveProjectRequest): Promise<SaveProjectResponse> {
  return request<SaveProjectResponse>(`${WORKSPACE_ENDPOINT}/${encodeURIComponent(req.id)}`, jsonInit("PUT", req));
}
