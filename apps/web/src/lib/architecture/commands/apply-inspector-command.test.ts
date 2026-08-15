import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { pointsSystemFixture } from "../projection/points-system-fixture.js";
import { applyArchitectureCommand } from "./apply-command.js";
import { projectInspector } from "../greenfield/inspector.js";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";

const gatewayId = "gateway";

function gatewayComponent(project: ArchitectureProject) {
  return project.architecture.components.find((component) => component.id === gatewayId)!;
}

describe("P3.5 field-specific inspector commands (P3-D3)", () => {
  it("updates a component description via an explicit command", () => {
    const candidate = applyArchitectureCommand(pointsSystemFixture, {
      type: "inspector-update-description",
      componentId: gatewayId,
      description: "Entry point for all client requests."
    });
    assert.equal(gatewayComponent(candidate).description, "Entry point for all client requests.");
  });

  it("updates a component type via an explicit command", () => {
    const candidate = applyArchitectureCommand(pointsSystemFixture, {
      type: "inspector-update-type",
      componentId: gatewayId,
      componentType: "gateway"
    });
    assert.equal(gatewayComponent(candidate).type, "gateway");
  });

  it("adds and removes capabilities via explicit commands", () => {
    const added = applyArchitectureCommand(pointsSystemFixture, {
      type: "inspector-add-capability",
      componentId: gatewayId,
      capability: "rate-limiting"
    });
    assert.ok(gatewayComponent(added).capabilities.includes("rate-limiting"));

    const removed = applyArchitectureCommand(added, {
      type: "inspector-remove-capability",
      componentId: gatewayId,
      capability: "rate-limiting"
    });
    assert.ok(!gatewayComponent(removed).capabilities.includes("rate-limiting"));
  });

  it("adds a limitation via an explicit command", () => {
    const candidate = applyArchitectureCommand(pointsSystemFixture, {
      type: "inspector-add-limitation",
      componentId: gatewayId,
      limitation: "no-batch-writes"
    });
    assert.ok(gatewayComponent(candidate).limitations?.includes("no-batch-writes"));
  });

  it("rejects edits to a non-existent component", () => {
    assert.throws(() => applyArchitectureCommand(pointsSystemFixture, {
      type: "inspector-update-description",
      componentId: "missing",
      description: "nope"
    }), /does not exist/);
  });

  it("does not mutate the accepted IR (immutable candidate)", () => {
    const before = structuredClone(pointsSystemFixture);
    applyArchitectureCommand(pointsSystemFixture, {
      type: "inspector-update-description",
      componentId: gatewayId,
      description: "changed"
    });
    assert.deepEqual(pointsSystemFixture, before);
  });

  it("projects inspector view model with matching validation issues", () => {
    const component = gatewayComponent(pointsSystemFixture);
    const view = projectInspector(component, [
      { id: "i1", severity: "ERROR", title: "X", description: "y", affectedComponent: gatewayId }
    ]);
    assert.equal(view.componentId, gatewayId);
    assert.equal(view.issues.length, 1);
    assert.equal(view.issues[0]?.id, "i1");
  });
});
