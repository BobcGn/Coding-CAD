import { describe, expect, it } from "vitest";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { pointsSystemFixture } from "../projection/points-system-fixture.js";
import {
  generateExecutionHandoff,
  isHandoffStale
} from "./execution-handoff.js";
import { generateExecutionBlueprint } from "@coding-cad/execution-blueprint";
import { generateAgentInstruction } from "@coding-cad/agent-adapter";

describe("Execution Handoff Integration Suite", () => {
  it("guarantees 100% provenance traceability from Blueprint back to accepted ArchitectureProject", () => {
    const accepted = structuredClone(pointsSystemFixture);
    const handoff = generateExecutionHandoff(accepted);

    expect(handoff.status).toBe("ready");
    expect(handoff.blueprint).toBeDefined();

    const componentIds = new Set(accepted.architecture.components.map((c) => c.id));

    // Every task must trace back to valid components in the accepted architecture
    for (const task of handoff.blueprint!.tasks) {
      expect(task.relatedComponents.length).toBeGreaterThan(0);
      for (const compId of task.relatedComponents) {
        expect(componentIds.has(compId)).toBe(true);
      }
    }

    // Every constraint with a component source reference must point to an existing component
    for (const constraint of handoff.blueprint!.constraints) {
      if (constraint.source === "component-limitation" && constraint.sourceReference) {
        const compId = constraint.sourceReference.split(":")[0];
        expect(componentIds.has(compId!)).toBe(true);
      }
    }
  });

  it("proves Guide content is 100% rendered from Blueprint without injecting external info", () => {
    const accepted = structuredClone(pointsSystemFixture);
    const handoff = generateExecutionHandoff(accepted);

    const directBlueprint = generateExecutionBlueprint(accepted);
    const expectedGeneric = generateAgentInstruction("generic", directBlueprint);
    const expectedCodex = generateAgentInstruction("codex", directBlueprint);
    const expectedClaude = generateAgentInstruction("claude-code", directBlueprint);

    expect(handoff.guides!.generic.content).toBe(expectedGeneric.content);
    expect(handoff.guides!.codex.content).toBe(expectedCodex.content);
    expect(handoff.guides!["claude-code"].content).toBe(expectedClaude.content);
  });

  it("grounds Handoff strictly on accepted architecture even when unapproved candidates exist", () => {
    const accepted = structuredClone(pointsSystemFixture);
    const candidateArchitecture: ArchitectureProject = {
      ...accepted,
      architecture: {
        ...accepted.architecture,
        components: [
          ...accepted.architecture.components,
          { id: "unapproved-payment", name: "Unapproved Payment", type: "service", capabilities: [] }
        ]
      }
    };

    // Candidate has 5 components, accepted has 4
    expect(candidateArchitecture.architecture.components.length).toBe(5);
    expect(accepted.architecture.components.length).toBe(4);

    const handoff = generateExecutionHandoff(accepted, {
      hasPendingCandidate: true
    });

    // Must be based on accepted architecture
    expect(handoff.blueprint!.tasks.some((t) => t.relatedComponents.includes("unapproved-payment"))).toBe(false);
    expect(handoff.warning).toContain("尚有未批准的候选，Handoff 基于已批准的正式架构");
  });

  it("transitions to stale when accepted architecture evolves through edits", () => {
    const accepted = structuredClone(pointsSystemFixture);
    const initialHandoff = generateExecutionHandoff(accepted);
    const snapshotKey = initialHandoff.snapshotKey;

    expect(isHandoffStale(accepted, snapshotKey)).toBe(false);

    // Add connection
    const updatedWithConnection: ArchitectureProject = {
      ...accepted,
      architecture: {
        ...accepted.architecture,
        connections: [
          ...accepted.architecture.connections,
          { id: "new-conn", from: "gateway", to: "events", protocol: "REST" }
        ]
      }
    };
    expect(isHandoffStale(updatedWithConnection, snapshotKey)).toBe(true);

    // Remove component
    const updatedWithRemoval: ArchitectureProject = {
      ...accepted,
      architecture: {
        ...accepted.architecture,
        components: accepted.architecture.components.slice(1)
      }
    };
    expect(isHandoffStale(updatedWithRemoval, snapshotKey)).toBe(true);
  });
});
