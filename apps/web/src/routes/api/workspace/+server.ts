import { json, error } from "@sveltejs/kit";
import { Workspace } from "@coding-cad/workspace";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import type { RequestHandler } from "./$types.js";
import type { CreateProjectRequest } from "$lib/architecture/workspace/contract.js";

/**
 * Workspace host bridge server route — create (P3.1 / P3-D1).
 *
 * Node-only `@coding-cad/workspace` runs only here at the SvelteKit server
 * boundary, never in the browser bundle. The route validates the typed
 * request, creates the project, and returns a browser-safe DTO.
 *
 * P3.1/P3-D1 的 Workspace host bridge server route（创建）。Node-only
 * @coding-cad/workspace 只在这里运行，绝不进入浏览器 bundle。route 校验 typed
 * request、创建项目并返回 browser-safe DTO。
 */

const WORKSPACE_ROOT = process.env.CODING_CAD_WORKSPACE_ROOT ?? ".coding-cad";

function parseArchitecture(architectureJson: string): ArchitectureProject {
  const parsed: unknown = JSON.parse(architectureJson);
  if (typeof parsed !== "object" || parsed === null) {
    throw error(400, "architectureJson must be a serialized ArchitectureProject.");
  }
  return parsed as ArchitectureProject;
}

export const POST: RequestHandler = async ({ request }) => {
  const body: unknown = await request.json();
  const payload = body as CreateProjectRequest;
  if (typeof payload?.name !== "string" || typeof payload?.architectureJson !== "string") {
    throw error(400, "CreateProjectRequest requires name and architectureJson.");
  }

  const architecture = parseArchitecture(payload.architectureJson);
  const workspace = await Workspace.create(`${WORKSPACE_ROOT}/${encodeURIComponent(payload.name)}`, architecture);
  return json({
    project: {
      id: workspace.id,
      name: workspace.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
};
