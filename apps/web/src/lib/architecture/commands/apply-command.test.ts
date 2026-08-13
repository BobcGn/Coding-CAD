import { describe, expect, it } from "vitest";
import { pointsSystemFixture } from "../projection/points-system-fixture.js";
import { applyArchitectureCommand } from "./apply-command.js";

describe("architecture commands", () => {
  it("adds, connects, and removes through immutable candidates", () => {
    const baseline = structuredClone(pointsSystemFixture);
    const withCache = applyArchitectureCommand(pointsSystemFixture, {
      type: "add-component",
      component: { id: "cache", name: "Read Cache", type: "cache", capabilities: ["read-through"] }
    });
    const connected = applyArchitectureCommand(withCache, {
      type: "connect-components",
      connection: { id: "ledger-cache", from: "ledger", to: "cache", protocol: "REST" }
    });
    const removed = applyArchitectureCommand(connected, { type: "remove-component", componentId: "cache" });

    expect(withCache.architecture.components).toHaveLength(5);
    expect(connected.architecture.connections.some(({ id }) => id === "ledger-cache")).toBe(true);
    expect(removed.architecture.components.some(({ id }) => id === "cache")).toBe(false);
    expect(removed.architecture.connections.some(({ id }) => id === "ledger-cache")).toBe(false);
    expect(pointsSystemFixture).toEqual(baseline);
  });
});
