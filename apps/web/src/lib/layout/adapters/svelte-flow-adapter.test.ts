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

it("converts absolute child coordinates to parent-relative without changing IR/LayoutState", () => {
  const grouped = {
    ...projection,
    visualGraph: {
      ...projection.visualGraph,
      nodes: [
        { ...projection.visualGraph.nodes[0]!, id: "group", sourceId: "group", kind: "group" as const },
        { ...projection.visualGraph.nodes[0]!, parentId: "group" }
      ]
    }
  };
  const result: LayoutResult = {
    ...layout,
    nodes: [
      { id: "group", sourceId: "group", kind: "group", position: { x: 300, y: 100 }, size: { width: 300, height: 220 } },
      { ...layout.nodes[0]!, parentId: "group", position: { x: 324, y: 124 } }
    ]
  };
  const before = structuredClone(result);
  expect(toSvelteFlowProjection(grouped, result).nodes[1]?.position).toEqual({ x: 24, y: 24 });
  expect(result).toEqual(before);
});

it("marks child nodes and connected edges as hidden when parent group is collapsed", () => {
  const grouped = {
    ...projection,
    visualGraph: {
      ...projection.visualGraph,
      nodes: [
        { ...projection.visualGraph.nodes[0]!, id: "group", sourceId: "group", kind: "group" as const },
        { ...projection.visualGraph.nodes[0]!, id: "child-1", sourceId: "child-1", parentId: "group" },
        { ...projection.visualGraph.nodes[0]!, id: "standalone", sourceId: "standalone" }
      ],
      edges: [{ id: "edge-1", sourceId: "edge-1", from: "child-1", to: "standalone", asynchronous: false }]
    }
  };
  const result: LayoutResult = {
    ...layout,
    nodes: [
      { id: "group", sourceId: "group", kind: "group", position: { x: 0, y: 0 }, size: { width: 300, height: 200 } },
      { id: "child-1", sourceId: "child-1", kind: "component", position: { x: 20, y: 20 }, size: { width: 100, height: 50 }, parentId: "group" },
      { id: "standalone", sourceId: "standalone", kind: "component", position: { x: 400, y: 100 }, size: { width: 100, height: 50 } }
    ],
    edges: [{ id: "edge-1", sourceId: "edge-1", from: "child-1", to: "standalone", sections: [] }]
  };

  // Test expanded
  const expanded = toSvelteFlowProjection(grouped, result);
  expect(expanded.nodes.find((n) => n.id === "group")?.data.memberCount).toBe(1);
  expect(expanded.nodes.find((n) => n.id === "group")?.data.collapsed).toBe(false);
  expect(expanded.nodes.find((n) => n.id === "child-1")?.hidden).toBe(false);
  expect(expanded.edges.find((e) => e.id === "edge-1")?.hidden).toBe(false);

  // Test collapsed
  const collapsed = toSvelteFlowProjection(grouped, result, undefined, {
    collapsedGroupIds: new Set(["group"])
  });
  expect(collapsed.nodes.find((n) => n.id === "group")?.data.collapsed).toBe(true);
  expect(collapsed.nodes.find((n) => n.id === "group")?.data.hiddenCount).toBe(1);
  expect(collapsed.nodes.find((n) => n.id === "child-1")?.hidden).toBe(true);
  expect(collapsed.edges.find((e) => e.id === "edge-1")?.hidden).toBe(true);
});
