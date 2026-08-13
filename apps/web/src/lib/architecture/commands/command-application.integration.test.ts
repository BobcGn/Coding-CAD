import { describe, expect, it } from "vitest";
import type { LayoutEngine } from "@coding-cad/architecture-layout";
import { ArchitectureReview } from "@coding-cad/architecture-review";
import { pointsSystemFixture } from "../projection/points-system-fixture.js";
import { CommandApplication } from "./command-application.js";

const deterministicReview = (): ArchitectureReview => new ArchitectureReview({
  clock: () => new Date("2026-08-13T00:00:00.000Z"),
  idGenerator: (() => { let id = 0; return () => `review-${++id}`; })()
});

const layoutEngine: LayoutEngine = {
  async layout(graph) {
    return {
      status: "success",
      direction: graph.direction,
      size: { width: 100, height: 100 },
      nodes: graph.nodes.map((node, index) => ({
        id: node.id,
        sourceId: node.sourceId,
        kind: node.kind,
        position: { x: index * 20, y: 0 },
        size: node.kind === "group" ? { width: 240, height: 160 } : { width: 180, height: 76 },
        ...(node.parentId === undefined ? {} : { parentId: node.parentId })
      })),
      edges: graph.edges.map((edge) => ({ id: edge.id, sourceId: edge.sourceId, from: edge.from, to: edge.to, sections: [] })),
      diagnostics: []
    };
  }
};

describe("headless command application", () => {
  it("accepts a valid candidate through Validator and Review, then re-layouts", async () => {
    const application = new CommandApplication({ review: deterministicReview(), layoutEngine });
    const result = await application.execute(pointsSystemFixture, {
      type: "add-component",
      component: { id: "cache", name: "Read Cache", type: "cache", capabilities: ["read-through"] }
    }, "approve");

    expect(result.status).toBe("accepted");
    expect(result.accepted.architecture.components.some(({ id }) => id === "cache")).toBe(true);
    expect(result.layout?.nodes.some(({ sourceId }) => sourceId === "cache")).toBe(true);
    expect(result.proposal.status).toBe("approved");
  });

  it("preserves accepted IR when the headless review rejects a candidate", async () => {
    const acceptedBefore = structuredClone(pointsSystemFixture);
    const application = new CommandApplication({ review: deterministicReview(), layoutEngine });
    const result = await application.execute(pointsSystemFixture, {
      type: "remove-component",
      componentId: "database"
    }, "reject");

    expect(result.status).toBe("rejected");
    expect(result.accepted).toBe(pointsSystemFixture);
    expect(result.accepted).toEqual(acceptedBefore);
    expect(result.layout).toBeUndefined();
    expect(result.proposal.status).toBe("rejected");
  });
});
