import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Workspace } from "@coding-cad/workspace";
import { pointsSystemFixture } from "../projection/points-system-fixture.js";

let root: string;
let routes: typeof import("../../../routes/api/workspace/[id]/+server.js");
beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "coding-cad-host-test-"));
  vi.stubEnv("CODING_CAD_WORKSPACE_ROOT", root);
  routes = await import("../../../routes/api/workspace/[id]/+server.js");
});
afterAll(async () => {
  vi.unstubAllEnvs();
  await rm(root, { recursive: true, force: true });
});

describe("actual Workspace server boundary", () => {
  it("saves validation against the accepted snapshot and view state independently", async () => {
    await Workspace.create(join(root, "fixture"), pointsSystemFixture);
    const viewStateJson = JSON.stringify({ version: 1, direction: "LR", nodes: [], edges: [] });
    const response = await routes.PUT({
      params: { id: "fixture" },
      request: new Request("http://localhost/api/workspace/fixture", {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: "fixture", architectureJson: JSON.stringify(pointsSystemFixture), viewStateJson })
      })
    } as never) as Response;
    expect(response.ok).toBe(true);
    const saved = await Workspace.open(join(root, "fixture"));
    expect(saved.loadLatestArchitecture()).toEqual(pointsSystemFixture);
    expect(saved.loadViewState()).toBe(viewStateJson);
    const history = saved.exportReport().validationHistory;
    expect(history).toHaveLength(1);
    expect(history[0]?.architectureVersion).toBe(saved.latestVersion);
    expect(history[0]?.result.valid).toBe(true);
  });

  it("returns a missing-project status without treating storage errors as create authorization", async () => {
    await expect(routes.GET({ params: { id: "missing" } } as never)).rejects.toMatchObject({ status: 404 });
  });
});
