import { describe, expect, it } from "vitest";
import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import { pointsSystemFixture } from "../projection/points-system-fixture.js";
import {
  createHandoffSnapshotKey,
  formatHandoffExport,
  generateExecutionHandoff,
  getHandoffExportFilename,
  isHandoffStale
} from "./execution-handoff.js";
import { encodeComponentTags } from "@coding-cad/implementation-analyzer/codec";

describe("Execution Handoff Domain Logic", () => {
  it("rejects empty architecture with an explicit error without producing empty documents", () => {
    const empty = {} as ArchitectureProject;
    const result = generateExecutionHandoff(empty);

    expect(result.status).toBe("error");
    expect(result.error).toContain("架构为空或未定义");
    expect(result.blueprint).toBeUndefined();
    expect(result.guides).toBeUndefined();
  });

  it("rejects architecture with validation errors and specifies issues", () => {
    const invalid: ArchitectureProject = {
      version: "1.0.0",
      intent: { name: "InvalidApp", purpose: ["Testing"] },
      domain: { entities: [] },
      architecture: {
        components: [
          { id: "comp-1", name: "Comp 1", type: "service", capabilities: [] }
        ],
        // Connection points to nonexistent component
        connections: [
          { id: "conn-1", from: "comp-1", to: "nonexistent", protocol: "REST" }
        ]
      },
      constraints: [],
      decisions: []
    };

    const result = generateExecutionHandoff(invalid);
    expect(result.status).toBe("error");
    expect(result.error).toContain("架构校验未通过");
    expect(result.blueprint).toBeUndefined();
    expect(result.guides).toBeUndefined();
  });

  it("generates Blueprint and 3 Guides for a valid architecture with full provenance", () => {
    const accepted = structuredClone(pointsSystemFixture);
    const result = generateExecutionHandoff(accepted);

    expect(result.status).toBe("ready");
    expect(result.projectName).toBe(accepted.intent.name);
    expect(result.architectureReference).toBe(`${accepted.intent.name}@architecture-ir:${accepted.version}`);
    expect(result.blueprint).toBeDefined();
    expect(result.guides).toBeDefined();

    // Provenance check: every task in blueprint has relatedComponents that exist in accepted architecture
    const componentIds = new Set(accepted.architecture.components.map((c) => c.id));
    expect(result.blueprint!.tasks.length).toBeGreaterThan(0);

    for (const task of result.blueprint!.tasks) {
      expect(task.relatedComponents.length).toBeGreaterThan(0);
      for (const compId of task.relatedComponents) {
        expect(componentIds.has(compId)).toBe(true);
      }
    }

    // Task provenance list has human-readable names
    expect(result.taskProvenances.length).toBe(result.blueprint!.tasks.length);
    for (const prov of result.taskProvenances) {
      for (const comp of prov.relatedComponents) {
        expect(comp.name).toBeTruthy();
        expect(componentIds.has(comp.id)).toBe(true);
      }
    }

    // Guides: Generic, Codex, Claude Code all rendered
    expect(result.guides!.generic.format).toBe("markdown");
    expect(result.guides!.generic.content).toContain(accepted.intent.name);
    expect(result.guides!.codex.format).toBe("codex-prompt");
    expect(result.guides!.codex.content).toContain("You are an external Coding Agent");
    expect(result.guides!["claude-code"].format).toBe("claude-md");
    expect(result.guides!["claude-code"].content).toContain(`CLAUDE.md — ${accepted.intent.name}`);
  });

  it("displays explicit warning when an unapproved candidate exists while grounding Handoff on accepted architecture", () => {
    const accepted = structuredClone(pointsSystemFixture);
    const result = generateExecutionHandoff(accepted, { hasPendingCandidate: true });

    expect(result.status).toBe("ready");
    expect(result.warning).toContain("尚有未批准的候选，Handoff 基于已批准的正式架构");
    expect(result.projectName).toBe(accepted.intent.name);
  });

  it("binds snapshot key and correctly detects staleness when architecture changes", () => {
    const accepted = structuredClone(pointsSystemFixture);
    const initialHandoff = generateExecutionHandoff(accepted);
    const key = initialHandoff.snapshotKey;

    expect(isHandoffStale(accepted, key)).toBe(false);

    // Mutate architecture by adding a component
    const mutated: ArchitectureProject = {
      ...accepted,
      architecture: {
        ...accepted.architecture,
        components: [
          ...accepted.architecture.components,
          { id: "extra-service", name: "Extra Service", type: "service", capabilities: [] }
        ]
      }
    };

    expect(isHandoffStale(mutated, key)).toBe(true);

    // Mutate architecture by updating version
    const bumpedVersion: ArchitectureProject = {
      ...accepted,
      version: "2.0.0"
    };

    expect(isHandoffStale(bumpedVersion, key)).toBe(true);
  });

  it("detects brownfield inferred evidence via typed evidence-codec", () => {
    const accepted = structuredClone(pointsSystemFixture);

    // Base fixture has no inferred tags
    const cleanResult = generateExecutionHandoff(accepted);
    expect(cleanResult.inferredNotice).toBeUndefined();

    // Add inferred evidence tag encoded by evidence-codec
    const inferredTags = encodeComponentTags({
      source: "inferred",
      confidence: 0.65,
      path: "src/inferred-module",
      exports: []
    });

    const brownfieldWithInferred: ArchitectureProject = {
      ...accepted,
      architecture: {
        ...accepted.architecture,
        components: [
          {
            ...accepted.architecture.components[0]!,
            tags: inferredTags
          },
          ...accepted.architecture.components.slice(1)
        ]
      }
    };

    const brownfieldResult = generateExecutionHandoff(brownfieldWithInferred);
    expect(brownfieldResult.inferredNotice).toContain("含 inferred 证据");
  });

  it("formats export files with metadata header matching preview verbatim", () => {
    const accepted = structuredClone(pointsSystemFixture);
    const handoff = generateExecutionHandoff(accepted);

    const genericGuide = handoff.guides!.generic.content;
    const exportedGeneric = formatHandoffExport(genericGuide, {
      format: "generic",
      architectureReference: handoff.architectureReference,
      generatedAt: handoff.generatedAt
    });

    expect(exportedGeneric).toContain("<!-- Coding CAD Execution Handoff Export -->");
    expect(exportedGeneric).toContain(`<!-- Architecture Reference: ${handoff.architectureReference} -->`);
    expect(exportedGeneric).toContain(genericGuide);

    // Blueprint JSON formatting
    const rawBlueprintJson = JSON.stringify(handoff.blueprint);
    const exportedBlueprint = formatHandoffExport(rawBlueprintJson, {
      format: "blueprint",
      architectureReference: handoff.architectureReference,
      generatedAt: handoff.generatedAt
    });

    const parsed = JSON.parse(exportedBlueprint);
    expect(parsed._handoffMetadata.format).toBe("execution-blueprint");
    expect(parsed.projectName).toBe(accepted.intent.name);
    expect(parsed.tasks.length).toBe(handoff.blueprint!.tasks.length);

    // Filenames
    expect(getHandoffExportFilename(accepted.intent.name, "blueprint")).toBe("points-platform-blueprint.json");
    expect(getHandoffExportFilename(accepted.intent.name, "generic")).toBe("points-platform-implementation-guide.md");
    expect(getHandoffExportFilename(accepted.intent.name, "codex")).toBe("points-platform-codex-prompt.md");
    expect(getHandoffExportFilename(accepted.intent.name, "claude-code")).toBe("CLAUDE.md");
  });
});
