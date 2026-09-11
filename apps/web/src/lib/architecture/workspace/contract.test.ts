import assert from "node:assert/strict";
import { describe, it } from "vitest";
import { isWorkspaceProjectDto } from "./contract.js";

describe("workspace browser-safe contract (P3.1)", () => {
  it("validates well-formed project DTOs", () => {
    const dto = {
      id: "abc",
      name: "PointSystem",
      createdAt: "2026-08-15T00:00:00.000Z",
      updatedAt: "2026-08-15T00:00:00.000Z"
    };
    assert.equal(isWorkspaceProjectDto(dto), true);
  });

  it("rejects non-object, null, and missing-field payloads", () => {
    assert.equal(isWorkspaceProjectDto(null), false);
    assert.equal(isWorkspaceProjectDto("text"), false);
    assert.equal(isWorkspaceProjectDto(42), false);
    assert.equal(isWorkspaceProjectDto({ id: "abc" }), false);
    assert.equal(isWorkspaceProjectDto({ id: 1, name: "x", createdAt: "t", updatedAt: "t" }), false);
  });
});
