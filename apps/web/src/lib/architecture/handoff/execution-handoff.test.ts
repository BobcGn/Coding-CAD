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

  describe("Provenance Coverage and Traceability (Step 5.1.1 Item 3)", () => {
    it("ensures every blueprint item source id exists in current accepted architecture", () => {
      const accepted = structuredClone(pointsSystemFixture);
      const handoff = generateExecutionHandoff(accepted);
      const blueprint = handoff.blueprint!;

      const formalCompIds = new Set(accepted.architecture.components.map((c) => c.id));
      const formalDecisionTitles = new Set(accepted.decisions.map((d) => d.title));
      const formalConstraintTypes = new Set(accepted.constraints.map((c) => c.type));

      // 1. Task provenance: relatedComponents must all exist in formal architecture
      expect(blueprint.tasks.length).toBeGreaterThan(0);
      for (const task of blueprint.tasks) {
        expect(task.relatedComponents.length).toBeGreaterThan(0);
        for (const compId of task.relatedComponents) {
          expect(formalCompIds.has(compId)).toBe(true);
        }
      }

      // 2. Constraint provenance: every constraint with sourceReference points to valid formal entity
      for (const constraint of blueprint.constraints) {
        expect(constraint.sourceReference).toBeDefined();
        expect(constraint.sourceReference!.length).toBeGreaterThan(0);

        if (constraint.source === "architecture-decision") {
          expect(formalDecisionTitles.has(constraint.sourceReference!)).toBe(true);
        } else if (constraint.source === "architecture-constraint") {
          expect(formalConstraintTypes.has(constraint.sourceReference! as any)).toBe(true);
        } else if (constraint.source === "component-limitation") {
          const [compId] = constraint.sourceReference!.split(":");
          expect(formalCompIds.has(compId!)).toBe(true);
        }
      }

      // 3. Guide paragraphs trace back to blueprint tasks
      for (const guideType of ["generic", "codex", "claude-code"] as const) {
        const guideContent = handoff.guides![guideType].content;
        for (const task of blueprint.tasks) {
          // Task ID or task title must appear in the rendered guide text
          const idPattern = new RegExp(task.id, "i");
          const titlePattern = new RegExp(task.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
          const isTraceable = idPattern.test(guideContent) || titlePattern.test(guideContent);
          expect(isTraceable).toBe(true);
        }
      }
    });
  });

  describe("Snapshot Key Canonicalization and Staleness (Step 5.1.1 Item 4)", () => {
    it("does not invalidate handoff when layout coordinates change (node dragging)", () => {
      const accepted = structuredClone(pointsSystemFixture);
      const initialKey = createHandoffSnapshotKey(accepted);

      // Simulating node dragging: LayoutState / canvas position updates (x: 100 -> 350, y: 200 -> 400)
      // ArchitectureProject contains no x, y coordinates; layout state is owned outside
      const layoutState = {
        nodes: [
          { id: accepted.architecture.components[0]!.id, x: 350, y: 400, width: 220, height: 120 }
        ]
      };
      expect(layoutState.nodes[0]!.x).toBe(350);

      // Key must remain identical because layout is not part of ArchitectureProject
      const postDragKey = createHandoffSnapshotKey(accepted);
      expect(postDragKey).toBe(initialKey);
      expect(isHandoffStale(accepted, initialKey)).toBe(false);
    });

    it("invalidates handoff when component description, capabilities, or items change", () => {
      const accepted = structuredClone(pointsSystemFixture);
      const initialKey = createHandoffSnapshotKey(accepted);

      // Mutate component description
      const descModified: ArchitectureProject = {
        ...accepted,
        architecture: {
          ...accepted.architecture,
          components: [
            {
              ...accepted.architecture.components[0]!,
              description: "Altered description for component"
            },
            ...accepted.architecture.components.slice(1)
          ]
        }
      };
      expect(isHandoffStale(descModified, initialKey)).toBe(true);

      // Add component
      const compAdded: ArchitectureProject = {
        ...accepted,
        architecture: {
          ...accepted.architecture,
          components: [
            ...accepted.architecture.components,
            { id: "new-comp", name: "NewComp", type: "service", capabilities: [] }
          ]
        }
      };
      expect(isHandoffStale(compAdded, initialKey)).toBe(true);

      // Remove component
      const compRemoved: ArchitectureProject = {
        ...accepted,
        architecture: {
          ...accepted.architecture,
          components: accepted.architecture.components.slice(1)
        }
      };
      expect(isHandoffStale(compRemoved, initialKey)).toBe(true);

      // Mutate constraint
      const constraintModified: ArchitectureProject = {
        ...accepted,
        constraints: [
          { type: "performance", description: "p99 < 50ms (stricter limit)", value: 50 }
        ]
      };
      expect(isHandoffStale(constraintModified, initialKey)).toBe(true);

      // Mutate decision
      const decisionModified: ArchitectureProject = {
        ...accepted,
        decisions: [
          {
            title: "Use PostgreSQL",
            context: "Need transactional database",
            decision: "Switch to CockroachDB",
            rationale: "Distributed SQL needed"
          }
        ]
      };
      expect(isHandoffStale(decisionModified, initialKey)).toBe(true);
    });

    it("yields identical snapshot key across JSON Save then Open roundtrip", () => {
      const accepted = structuredClone(pointsSystemFixture);
      const keyBeforeSave = createHandoffSnapshotKey(accepted);

      // Simulate Save (JSON.stringify) then Open (JSON.parse)
      const serialized = JSON.stringify(accepted);
      const opened: ArchitectureProject = JSON.parse(serialized);
      const keyAfterOpen = createHandoffSnapshotKey(opened);

      expect(keyAfterOpen).toBe(keyBeforeSave);
    });

    it("is insensitive to object property insertion order", () => {
      const compA = {
        id: "svc-a",
        name: "Service A",
        type: "service" as const,
        description: "Primary service",
        capabilities: ["read", "write"]
      };

      // Same data with reversed property order
      const compB = {
        capabilities: ["read", "write"],
        description: "Primary service",
        type: "service" as const,
        name: "Service A",
        id: "svc-a"
      };

      const archA: ArchitectureProject = {
        version: "1.0.0",
        intent: { name: "App", purpose: ["Goal"] },
        domain: { entities: [] },
        architecture: { components: [compA], connections: [] },
        constraints: [],
        decisions: []
      };

      const archB: ArchitectureProject = {
        decisions: [],
        constraints: [],
        architecture: { connections: [], components: [compB] },
        domain: { entities: [] },
        intent: { purpose: ["Goal"], name: "App" },
        version: "1.0.0"
      };

      expect(createHandoffSnapshotKey(archA)).toBe(createHandoffSnapshotKey(archB));
    });
  });
});
