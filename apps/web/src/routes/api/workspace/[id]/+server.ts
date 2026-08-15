import { json, error } from "@sveltejs/kit";
import { Workspace } from "@coding-cad/workspace";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import type { RequestHandler } from "./$types.js";
import type { SaveProjectRequest } from "$lib/architecture/workspace/contract.js";
import { isWorkspaceProjectDto } from "$lib/architecture/workspace/contract.js";

/**
 * Workspace host bridge server route — open/save (P3.1 / P3-D1).
 *
 * GET opens an existing project and returns its accepted ArchitectureProject
 * snapshot plus project DTO. PUT saves a new accepted snapshot. Both run
 * Node-only Workspace operations behind the SvelteKit server boundary and
 * return browser-safe DTOs.
 *
 * P3.1/P3-D1 的 Workspace host bridge server route（打开/保存）。GET 打开既有
 * 项目并返回 accepted ArchitectureProject snapshot 与 project DTO；PUT 保存新
 * snapshot。两者都在 SvelteKit server boundary 后执行 Node-only Workspace
 * 操作并返回 browser-safe DTO。
 */

const WORKSPACE_ROOT = process.env.CODING_CAD_WORKSPACE_ROOT ?? ".coding-cad";

function parseArchitecture(architectureJson: string): ArchitectureProject {
  const parsed: unknown = JSON.parse(architectureJson);
  if (typeof parsed !== "object" || parsed === null) {
    throw error(400, "architectureJson must be a serialized ArchitectureProject.");
  }
  return parsed as ArchitectureProject;
}

function toProjectDto(workspace: Workspace): { id: string; name: string; createdAt: string; updatedAt: string } {
  return {
    id: workspace.id,
    name: workspace.name,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export const GET: RequestHandler = async ({ params }) => {
  const { id } = params;
  if (typeof id !== "string" || id.length === 0) {
    throw error(400, "OpenProjectRequest requires an id.");
  }

  const workspace = await Workspace.open(`${WORKSPACE_ROOT}/${id}`);
  const architectureJson = JSON.stringify(workspace.loadLatestArchitecture());
  const dto = toProjectDto(workspace);
  if (!isWorkspaceProjectDto(dto)) {
    throw error(500, "Workspace returned an invalid project DTO.");
  }
  return json({ project: dto, architectureJson });
};

export const PUT: RequestHandler = async ({ params, request }) => {
  const { id } = params;
  const body: unknown = await request.json();
  const payload = body as SaveProjectRequest;
  if (typeof id !== "string" || id.length === 0) {
    throw error(400, "SaveProjectRequest requires an id.");
  }
  if (typeof payload?.architectureJson !== "string") {
    throw error(400, "SaveProjectRequest requires architectureJson.");
  }

  const workspace = await Workspace.open(`${WORKSPACE_ROOT}/${id}`);
  const architecture = parseArchitecture(payload.architectureJson);
  const snapshot = await workspace.saveSnapshot(architecture);
  return json({
    project: toProjectDto(workspace),
    version: snapshot.version
  });
};
