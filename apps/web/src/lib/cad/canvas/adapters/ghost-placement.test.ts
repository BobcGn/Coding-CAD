import { describe, expect, it } from "vitest";
import {
  calculateGhostPlacement,
  hasAnyOverlap,
  intersects,
  type Rect
} from "./ghost-placement.js";

describe("Ghost Placement Pure Adapter (D-007 Option B)", () => {
  it("places ghost adjacent to related formal node with zero overlap", () => {
    const formalNodes: Rect[] = [
      { id: "gateway", x: 100, y: 100, width: 220, height: 90 },
      { id: "auth-service", x: 400, y: 100, width: 220, height: 90 },
      { id: "user-service", x: 400, y: 300, width: 220, height: 90 }
    ];

    const result = calculateGhostPlacement({
      ghostId: "ghost:kafka",
      relatedComponentIds: ["auth-service"],
      formalNodes
    });

    const ghostRect: Rect = {
      id: "ghost:kafka",
      x: result.position.x,
      y: result.position.y,
      width: 220,
      height: 90
    };

    // Zero overlap check
    expect(hasAnyOverlap(ghostRect, formalNodes, 0)).toBe(false);

    // Local placement check: should be near auth-service (x ~ 668, y ~ 100)
    expect(result.position.x).toBeGreaterThanOrEqual(620);
    expect(result.position.y).toBeCloseTo(100, -2);
  });

  it("safely finds a collision-free slot when immediate adjacent slot is occupied", () => {
    // Both right and down from anchor are occupied
    const formalNodes: Rect[] = [
      { id: "anchor", x: 100, y: 100, width: 200, height: 80 },
      // Occupying right of anchor
      { id: "blocker-right", x: 348, y: 100, width: 220, height: 90 },
      // Occupying below anchor
      { id: "blocker-below", x: 100, y: 228, width: 220, height: 90 }
    ];

    const result = calculateGhostPlacement({
      ghostId: "ghost:new-node",
      relatedComponentIds: ["anchor"],
      formalNodes
    });

    const ghostRect: Rect = {
      id: "ghost:new-node",
      x: result.position.x,
      y: result.position.y,
      width: 220,
      height: 90
    };

    // Strict zero overlap
    for (const formal of formalNodes) {
      expect(intersects(ghostRect, formal, 0)).toBe(false);
    }
  });

  it("places in global staging area when there are no related formal nodes", () => {
    const formalNodes: Rect[] = [
      { id: "node-1", x: 100, y: 100, width: 200, height: 80 },
      { id: "node-2", x: 350, y: 100, width: 200, height: 80 }
    ];

    const result = calculateGhostPlacement({
      ghostId: "ghost:isolated",
      relatedComponentIds: [],
      formalNodes
    });

    const ghostRect: Rect = {
      id: "ghost:isolated",
      x: result.position.x,
      y: result.position.y,
      width: 220,
      height: 90
    };

    // Placed to the right of the entire bounding box
    expect(result.position.x).toBeGreaterThanOrEqual(550);
    expect(hasAnyOverlap(ghostRect, formalNodes, 0)).toBe(false);
  });

  it("preserves container boundary without altering formal container when space is insufficient", () => {
    const formalContainer: Rect = {
      id: "module-core",
      kind: "group",
      x: 100,
      y: 100,
      width: 260,
      height: 180
    };

    // Container is completely packed with a child node
    const childNode: Rect = {
      id: "service-a",
      parentId: "module-core",
      x: 120,
      y: 150,
      width: 220,
      height: 100
    };

    const formalNodes = [formalContainer, childNode];

    const result = calculateGhostPlacement({
      ghostId: "ghost:overflow",
      targetContainerId: "module-core",
      formalNodes
    });

    expect(result.placedOutsideContainer).toBe(true);
    expect(result.containerNotice).toContain("module-core");

    const ghostRect: Rect = {
      id: "ghost:overflow",
      x: result.position.x,
      y: result.position.y,
      width: 220,
      height: 90
    };

    // Must not overlap container or child
    expect(hasAnyOverlap(ghostRect, formalNodes, 0)).toBe(false);
  });

  it("places inside container when free space is available without overlapping siblings", () => {
    const formalContainer: Rect = {
      id: "module-wide",
      kind: "group",
      x: 50,
      y: 50,
      width: 600,
      height: 400
    };

    // Child in top-left
    const childNode: Rect = {
      id: "service-1",
      parentId: "module-wide",
      x: 80,
      y: 100,
      width: 200,
      height: 80
    };

    const formalNodes = [formalContainer, childNode];

    const result = calculateGhostPlacement({
      ghostId: "ghost:inside",
      targetContainerId: "module-wide",
      ghostSize: { width: 180, height: 70 },
      formalNodes
    });

    expect(result.parentId).toBe("module-wide");
    expect(result.placedOutsideContainer).toBeFalsy();

    const ghostRect: Rect = {
      id: "ghost:inside",
      x: result.position.x,
      y: result.position.y,
      width: 180,
      height: 70
    };

    // Zero overlap with sibling
    expect(intersects(ghostRect, childNode, 0)).toBe(false);
  });
});
