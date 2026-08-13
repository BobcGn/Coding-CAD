import { describe, expect, it } from "vitest";
import type { ArchitectureLayoutProjection, LayoutResult } from "@coding-cad/architecture-layout";
import { toSvelteFlowProjection } from "./svelte-flow-adapter.js";

const projection: ArchitectureLayoutProjection = {
  classifications: [],
  abstraction: { groups: [], parentByComponentId: {} },
  visualGraph: {
    nodes: [{
      id: "service",
      sourceId: "service",
      kind: "component",
      label: "Orders",
      role: "service",
      hints: { preferredRank: "application", portDirection: "bidirectional", infrastructure: false, externalBoundary: false }
    }],
    edges: []
  },
  layoutGraph: { direction: "LR", nodes: [], edges: [], constraints: [] }
};

const layout: LayoutResult = {
  status: "success",
  direction: "LR",
  size: { width: 180, height: 76 },
  nodes: [{ id: "service", sourceId: "service", kind: "component", position: { x: 12, y: 24 }, size: { width: 180, height: 76 } }],
  edges: [],
  diagnostics: []
};

describe("Svelte Flow anti-corruption adapter", () => {
  it("maps stable layout identity and renderer data without mutating input", () => {
    const before = structuredClone(layout);
    const adapted = toSvelteFlowProjection(projection, layout);
    expect(adapted.nodes[0]).toMatchObject({
      id: "service",
      type: "architecture",
      position: { x: 12, y: 24 },
      data: { label: "Orders", role: "service" }
    });
    expect(layout).toEqual(before);
  });

  it("rejects an edge whose endpoint is missing", () => {
    expect(() => toSvelteFlowProjection(projection, {
      ...layout,
      edges: [{ id: "bad", sourceId: "bad", from: "service", to: "missing", sections: [] }]
    })).toThrow(/invalid endpoint/);
  });
});
