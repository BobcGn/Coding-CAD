import { describe, expect, it } from "vitest";
import type { LayoutState } from "@coding-cad/architecture-layout";
import { persistDraggedPosition } from "./workspace-view-state.js";

describe("Workspace-owned drag state", () => {
  it("returns new view state without mutating the existing state", () => {
    const state: LayoutState = {
      version: 1,
      direction: "LR",
      nodes: [{ id: "a", position: { x: 0, y: 0 }, size: { width: 10, height: 10 } }],
      edges: []
    };
    const next = persistDraggedPosition(state, "a", { x: 40, y: 50 });
    expect(next.nodes[0]?.position).toEqual({ x: 40, y: 50 });
    expect(state.nodes[0]?.position).toEqual({ x: 0, y: 0 });
  });

  it("ignores missing identities and non-finite positions safely", () => {
    const state: LayoutState = { version: 1, direction: "LR", nodes: [], edges: [] };
    expect(persistDraggedPosition(state, "missing", { x: 1, y: 2 })).toEqual(state);
    expect(persistDraggedPosition(state, "missing", { x: Number.NaN, y: 2 })).toBe(state);
  });
});
