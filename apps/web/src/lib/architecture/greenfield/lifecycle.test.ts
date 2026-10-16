import { describe, expect, it, vi } from "vitest";
import { CandidateFlow } from "./candidate-flow.js";
import { WorkspaceShellController } from "./workspace-shell-controller.js";
import { pointsSystemFixture } from "../projection/points-system-fixture.js";
import type { LayoutEngine, LayoutState } from "@coding-cad/architecture-layout";

const engine: LayoutEngine = {
  async layout(graph) {
    return {
      status: "success", direction: graph.direction, size: { width: 800, height: 600 },
      nodes: graph.nodes.map((node, index) => ({
        id: node.id, sourceId: node.sourceId, kind: node.kind, position: { x: index * 200, y: 0 },
        size: { width: 100, height: 70 }, ...(node.parentId ? { parentId: node.parentId } : {})
      })),
      edges: graph.edges.map((edge) => ({ id: edge.id, sourceId: edge.sourceId, from: edge.from, to: edge.to, sections: [] })),
      diagnostics: []
    };
  }
};

describe("Phase 3 lifecycle acceptance", () => {
  it("retains the pending command Review owner after regeneration fails", async () => {
    const flow = new CandidateFlow();
    const controller = new WorkspaceShellController(pointsSystemFixture, { flow, engineFactory: () => engine });
    await controller.executeCommand({ type: "add-component", component: { id: "pending-queue", name: "Queue", type: "queue", capabilities: [] } });
    const before = controller.state();
    vi.spyOn(flow, "generate").mockRejectedValueOnce(new Error("Generator unavailable"));
    await controller.generateFromRequirement("积分系统");
    expect(controller.state().candidate).toBe(before.candidate);
    expect(controller.state().accepted).toBe(before.accepted);
    await controller.acceptCandidate("Approve the original pending command.");
    expect(controller.state().proposal?.status).toBe("approved");
    expect(controller.state().accepted.architecture.components.some((node) => node.id === "pending-queue")).toBe(true);
  });

  it("preserves accepted architecture/view on generation error and recovers", async () => {
    const flow = new CandidateFlow();
    const controller = new WorkspaceShellController(pointsSystemFixture, { flow, engineFactory: () => engine });
    await controller.generateFromRequirement("积分系统");
    await controller.acceptCandidate("Approve initial architecture.");
    const before = controller.state();
    vi.spyOn(flow, "generate").mockRejectedValueOnce(new Error("Generator unavailable"));
    await controller.generateFromRequirement("积分系统");
    expect(controller.state().accepted).toBe(before.accepted);
    expect(controller.state().layoutState).toBe(before.layoutState);
    expect(controller.state().status).toBe("error");
    await controller.generateFromRequirement("积分系统");
    expect(controller.state().status).toBe("ready");
  });

  it("rejects no-op pre-aborted generation without replacing accepted state", async () => {
    const controller = new WorkspaceShellController(pointsSystemFixture, { engineFactory: () => engine });
    const before = controller.state();
    const abort = new AbortController();
    abort.abort();
    await controller.generateFromRequirement("积分系统", abort.signal);
    expect(controller.state().accepted).toBe(before.accepted);
    expect(controller.state().candidate).toBe(before.candidate);
    expect(controller.state().status).toBe("idle");
  });

  it("keeps accepted positions during candidate previews and restores valid saved positions only", async () => {
    const controller = new WorkspaceShellController(pointsSystemFixture, { engineFactory: () => engine });
    await controller.generateFromRequirement("积分系统");
    await controller.acceptCandidate("Approve initial architecture.");
    const saved: LayoutState = {
      ...controller.state().layoutState!,
      nodes: controller.state().layoutState!.nodes.map((node, index) => ({ ...node, position: { x: 123 + index * 300, y: 456 } }))
    };
    controller.updateLayoutState(saved);
    await controller.executeCommand({ type: "add-component", component: { id: "new-queue", name: "Queue", type: "queue", capabilities: [] } });
    expect(controller.state().layoutState).toBe(saved);
    controller.rejectCandidate("Keep existing layout.");
    expect(controller.state().layoutState).toBe(saved);

    const stale = { id: "deleted-node", position: { x: 999, y: 999 }, size: { width: 100, height: 70 } };
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      project: { id: "test", name: pointsSystemFixture.intent.name, createdAt: "t", updatedAt: "t" },
      architectureJson: JSON.stringify(controller.state().accepted),
      viewStateJson: JSON.stringify({ ...saved, nodes: [...saved.nodes, stale] })
    })));
    try {
      await controller.openProject("test");
      expect(controller.state().layoutState?.nodes.map((node) => node.position)).toEqual(saved.nodes.map((node) => node.position));
      expect(controller.state().layoutState?.nodes.some((node) => node.id === "deleted-node")).toBe(false);
    } finally { fetch.mockRestore(); }
  });

  it("does not create or overwrite a project on a save server failure", async () => {
    const controller = new WorkspaceShellController(pointsSystemFixture, { engineFactory: () => engine });
    const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("Server unavailable", { status: 500 }));
    try {
      await expect(controller.saveProject()).rejects.toThrow("500");
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch.mock.calls[0]?.[1]?.method).toBe("PUT");
    } finally { fetch.mockRestore(); }
  });

  it("exposes fallback diagnostics instead of treating fallback as solver success", async () => {
    const controller = new WorkspaceShellController(pointsSystemFixture, { engineFactory: () => ({
      async layout(graph) {
        return { ...(await engine.layout(graph)), status: "fallback", diagnostics: [{ code: "SOLVER_FAILURE", severity: "warning", message: "solver unavailable" }] };
      }
    }) });
    await controller.generateFromRequirement("积分系统");
    expect(controller.layout()?.status).toBe("fallback");
    expect(controller.state().layoutWarning).toBe("solver unavailable");
  });
});
