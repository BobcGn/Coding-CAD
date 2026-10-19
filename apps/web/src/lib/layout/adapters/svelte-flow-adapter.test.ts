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

describe("Ghost Proposal Projection (D-007 Option B)", () => {
  const createTestProposal = (diff: {
    components?: { added?: any[]; removed?: any[]; changed?: any[] };
    connections?: { added?: any[]; removed?: any[]; changed?: any[] };
  }, status: "draft" | "in-review" | "approved" | "rejected" = "draft") => ({
    id: "proposal:test-1",
    title: "Test Proposal",
    summary: "Command proposal for testing",
    author: "coding-cad-web",
    status,
    createdAt: "2026-10-17T00:00:00Z",
    updatedAt: "2026-10-17T00:00:00Z",
    requiredApprovals: 1,
    change: {} as any,
    validation: { valid: true, summary: "ok", issues: [] },
    impactAnalysis: {
      risk: "low" as const,
      summary: "low risk",
      changedAreas: ["components" as const],
      affectedComponentIds: [],
      reasons: [],
      validationIssues: [],
      diff: {
        fromVersion: 1,
        toVersion: 2,
        components: { added: [], removed: [], changed: [], ...diff.components },
        connections: { added: [], removed: [], changed: [], ...diff.connections },
        constraints: { added: [], removed: [], changed: [] }
      }
    },
    comments: [],
    approvals: []
  });

  it("projects ghost node and edge for added component with zero formal overlap and unshifted formal nodes", () => {
    const proposal = createTestProposal({
      components: {
        added: [{ id: "kafka", name: "Kafka Broker", type: "queue" }]
      },
      connections: {
        added: [{ id: "conn-kafka", from: "service", to: "kafka", protocol: "MESSAGE" }]
      }
    });

    const beforeResult = structuredClone(layout);
    const adapted = toSvelteFlowProjection(projection, layout, undefined, { ghostProposal: proposal });

    // Formal node count and position unchanged
    const formalNode = adapted.nodes.find((n) => n.id === "service");
    expect(formalNode).toBeDefined();
    expect(formalNode?.position).toEqual(layout.nodes[0]!.position);
    expect(formalNode?.data.isGhost).toBe(false);

    // Ghost node projected with independent identity and accessible badge
    const ghostNode = adapted.nodes.find((n) => n.id === "ghost:kafka");
    expect(ghostNode).toBeDefined();
    expect(ghostNode?.data.isGhost).toBe(true);
    expect(ghostNode?.data.ghostStatus).toBe("proposed");
    expect(ghostNode?.data.ghostLabel).toBe("[待审批 / Proposed]");
    expect(ghostNode?.ariaLabel).toContain("[待审批 / Proposed]");
    expect(ghostNode?.ariaLabel).toContain("Kafka Broker");

    // Zero overlap assertion (pure geometric check between ghost and formal node)
    const ghostRect = {
      x: ghostNode!.position.x,
      y: ghostNode!.position.y,
      width: ghostNode!.width!,
      height: ghostNode!.height!
    };
    const formalRect = {
      x: formalNode!.position.x,
      y: formalNode!.position.y,
      width: formalNode!.width!,
      height: formalNode!.height!
    };

    const overlaps = (
      ghostRect.x < formalRect.x + formalRect.width &&
      ghostRect.x + ghostRect.width > formalRect.x &&
      ghostRect.y < formalRect.y + formalRect.height &&
      ghostRect.y + ghostRect.height > formalRect.y
    );
    expect(overlaps).toBe(false);

    // Ghost edge projected with dashed purple style
    const ghostEdge = adapted.edges.find((e) => e.id === "ghost:connection:conn-kafka");
    expect(ghostEdge).toBeDefined();
    expect(ghostEdge?.source).toBe("service");
    expect(ghostEdge?.target).toBe("ghost:kafka");
    expect(ghostEdge?.data?.isGhost).toBe(true);
    expect(ghostEdge?.data?.ghostStatus).toBe("proposed");
    expect(ghostEdge?.label).toBe("[待审批 / Proposed]");
    expect(ghostEdge?.style).toContain("#8b5cf6");

    // Input layout immutability
    expect(layout).toEqual(beforeResult);
  });

  it("annotates formal node with pending-change marker upon inspector modification", () => {
    const proposal = createTestProposal({
      components: {
        changed: [{
          before: { id: "service", name: "Orders", type: "service" },
          after: { id: "service", name: "Orders (Updated)", type: "service" }
        }]
      }
    });

    const adapted = toSvelteFlowProjection(projection, layout, undefined, { ghostProposal: proposal });
    const modifiedNode = adapted.nodes.find((n) => n.id === "service");

    expect(modifiedNode).toBeDefined();
    expect(modifiedNode?.data.ghostStatus).toBe("pending-change");
    expect(modifiedNode?.data.ghostLabel).toBe("[待变更 / Pending Change]");
    expect(modifiedNode?.ariaLabel).toContain("[待变更 / Pending Change]");
  });

  it("annotates formal node and edge with pending-deletion marker upon removal command", () => {
    const layoutWithEdge: LayoutResult = {
      ...layout,
      edges: [{ id: "edge-service-db", sourceId: "edge-service-db", from: "service", to: "service", sections: [] }]
    };

    const proposal = createTestProposal({
      components: {
        removed: [{ id: "service", name: "Orders", type: "service" }]
      },
      connections: {
        removed: [{ id: "edge-service-db", from: "service", to: "service" }]
      }
    });

    const adapted = toSvelteFlowProjection(projection, layoutWithEdge, undefined, { ghostProposal: proposal });
    const removedNode = adapted.nodes.find((n) => n.id === "service");
    const removedEdge = adapted.edges.find((e) => e.id === "edge-service-db");

    expect(removedNode?.data.ghostStatus).toBe("pending-deletion");
    expect(removedNode?.data.ghostLabel).toBe("[待删除 / Pending Deletion]");
    expect(removedNode?.ariaLabel).toContain("[待删除 / Pending Deletion]");

    expect(removedEdge?.data?.ghostStatus).toBe("pending-deletion");
    expect(removedEdge?.label).toBe("[待删除 / Pending Deletion]");
    expect(removedEdge?.style).toContain("#ef4444");
  });

  it("does not project ghost artifacts when proposal is not in pending review state", () => {
    const approvedProposal = createTestProposal({
      components: { added: [{ id: "kafka", name: "Kafka Broker", type: "queue" }] }
    }, "approved");

    const adapted = toSvelteFlowProjection(projection, layout, undefined, { ghostProposal: approvedProposal });
    expect(adapted.nodes.some((n) => n.id.startsWith("ghost:"))).toBe(false);
  });

  describe("Step 5.8 D-011 Ghost Prediction Projection States", () => {
    const proposal = createTestProposal({
      components: { added: [{ id: "kafka", name: "Kafka Broker", type: "queue" }] },
      connections: { added: [{ id: "conn-kafka", from: "service", to: "kafka", protocol: "MESSAGE" }] }
    });

    it("projects 'predicting' state with heuristic position and predicting badge", () => {
      const adapted = toSvelteFlowProjection(projection, layout, undefined, {
        ghostProposal: proposal,
        ghostPrediction: { status: "predicting", proposalId: proposal.id }
      });

      const ghostNode = adapted.nodes.find((n) => n.id === "ghost:kafka");
      expect(ghostNode).toBeDefined();
      expect(ghostNode?.data.ghostPredictionStatus).toBe("predicting");
      expect(ghostNode?.data.ghostLabel).toBe("[预测中 / Predicting]");
      expect(ghostNode?.ariaLabel).toContain("[预测中 / Predicting]");

      const ghostEdge = adapted.edges.find((e) => e.id === "ghost:connection:conn-kafka");
      expect(ghostEdge?.data?.ghostPredictionStatus).toBe("predicting");
      expect(ghostEdge?.label).toBe("[预测中 / Predicting]");
    });

    it("projects 'predicted' state with predicted coordinates, predicted badge, and accessibility notice", () => {
      const adapted = toSvelteFlowProjection(projection, layout, undefined, {
        ghostProposal: proposal,
        ghostPrediction: {
          status: "predicted",
          proposalId: proposal.id,
          nodes: { kafka: { position: { x: 550, y: 320 } } },
          solver: "elk",
          durationMs: 42
        }
      });

      const ghostNode = adapted.nodes.find((n) => n.id === "ghost:kafka");
      expect(ghostNode).toBeDefined();
      expect(ghostNode?.position).toEqual({ x: 550, y: 320 });
      expect(ghostNode?.data.ghostPredictionStatus).toBe("predicted");
      expect(ghostNode?.data.ghostLabel).toBe("[预测位置 / Predicted Position]");
      expect(ghostNode?.ariaLabel).toContain("[预测位置 / Predicted Position]");
      expect(ghostNode?.ariaLabel).toContain("接受前若有其他变更，最终位置可能变化");
      expect(ghostNode?.data.ghostNotice).toContain("接受前若有其他变更，最终位置可能变化");

      const ghostEdge = adapted.edges.find((e) => e.id === "ghost:connection:conn-kafka");
      expect(ghostEdge?.data?.ghostPredictionStatus).toBe("predicted");
      expect(ghostEdge?.label).toBe("[预测位置 / Predicted Position]");
    });

    it("projects 'unavailable' state with fallback heuristic coordinates and unavailable notice", () => {
      const adapted = toSvelteFlowProjection(projection, layout, undefined, {
        ghostProposal: proposal,
        ghostPrediction: {
          status: "unavailable",
          proposalId: proposal.id,
          solver: "fallback",
          durationMs: 15,
          notice: "求解器降级 (timeout)，预测不可用已回退至启发式放置"
        }
      });

      const ghostNode = adapted.nodes.find((n) => n.id === "ghost:kafka");
      expect(ghostNode).toBeDefined();
      expect(ghostNode?.data.ghostPredictionStatus).toBe("unavailable");
      expect(ghostNode?.data.ghostLabel).toBe("[预测不可用 / Prediction Unavailable]");
      expect(ghostNode?.ariaLabel).toContain("[预测不可用 / Prediction Unavailable]");
      expect(ghostNode?.data.ghostNotice).toBe("求解器降级 (timeout)，预测不可用已回退至启发式放置");

      const ghostEdge = adapted.edges.find((e) => e.id === "ghost:connection:conn-kafka");
      expect(ghostEdge?.data?.ghostPredictionStatus).toBe("unavailable");
      expect(ghostEdge?.label).toBe("[预测不可用 / Prediction Unavailable]");
    });
  });
});
