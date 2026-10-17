import type { ArchitectureProject, Component, Connection } from "@coding-cad/architecture-ir";
import { ArchitectureValidator, type ValidationResult } from "@coding-cad/architecture-validator";
import {
  generateExecutionBlueprint,
  type ExecutionBlueprint,
  type ImplementationConstraint,
  type ImplementationTask
} from "@coding-cad/execution-blueprint";
import {
  generateAgentInstruction,
  type AgentInstruction,
  type SupportedAgentAdapter
} from "@coding-cad/agent-adapter";
import {
  decodeComponentEvidence,
  decodeConnectionEvidence
} from "@coding-cad/implementation-analyzer/codec";

export type HandoffStatus = "idle" | "ready" | "stale" | "error";

export interface HandoffOptions {
  readonly hasPendingCandidate?: boolean;
  readonly validationResult?: ValidationResult;
  readonly timestamp?: () => Date;
}

export interface TaskProvenance {
  readonly taskId: string;
  readonly relatedComponents: readonly {
    readonly id: string;
    readonly name: string;
  }[];
}

export interface ConstraintProvenance {
  readonly constraintType: string;
  readonly source?: string | undefined;
  readonly sourceReference?: string | undefined;
  readonly targetComponentId?: string | undefined;
}

export interface HandoffViewModel {
  readonly status: HandoffStatus;
  readonly snapshotKey: string;
  readonly generatedAt: string;
  readonly architectureReference: string;
  readonly projectName: string;
  readonly blueprint?: ExecutionBlueprint | undefined;
  readonly guides?: Record<SupportedAgentAdapter, AgentInstruction> | undefined;
  readonly taskProvenances: readonly TaskProvenance[];
  readonly constraintProvenances: readonly ConstraintProvenance[];
  readonly warning?: string | undefined;
  readonly inferredNotice?: string | undefined;
  readonly error?: string | undefined;
}

export interface HandoffExportMetadata {
  readonly format: SupportedAgentAdapter | "blueprint";
  readonly architectureReference: string;
  readonly generatedAt: string;
}

/**
 * Deterministically constructs a snapshot key representing the approved architecture state.
 * Normalized and canonicalized:
 * - Sorts components, connections, constraints, and decisions.
 * - Extracts and serializes semantic properties (name, type, description, capabilities, constraints, decisions).
 * - Strictly ignores layout coordinates (x, y, width, height) and ephemeral view state.
 * - Insensitive to property ordering in input objects.
 * - Save -> Open JSON roundtrip yields the exact same key.
 */
export function createHandoffSnapshotKey(architecture: ArchitectureProject): string {
  if (!architecture || !architecture.intent) {
    return "empty@v0:0:0:0";
  }

  const name = architecture.intent.name || "unnamed";
  const version = architecture.version ?? "1";
  const purpose = (architecture.intent.purpose ?? []).slice().sort().join(";");

  const components = (architecture.architecture?.components ?? [])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
  const connections = (architecture.architecture?.connections ?? [])
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));
  const constraints = (architecture.constraints ?? [])
    .slice()
    .sort((a, b) => {
      const keyA = `${a.type}:${a.description}:${String(a.value ?? "")}`;
      const keyB = `${b.type}:${b.description}:${String(b.value ?? "")}`;
      return keyA.localeCompare(keyB);
    });
  const decisions = (architecture.decisions ?? [])
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title));

  const canonicalComponents = components.map((c) => {
    const caps = (c.capabilities ?? []).slice().sort().join(",");
    const limits = (c.limitations ?? []).slice().sort().join(",");
    const tags = (c.tags ?? []).slice().sort().join(",");
    return `${c.id}|${c.name}|${c.type}|${c.description ?? ""}|caps:${caps}|lims:${limits}|tags:${tags}`;
  });

  const canonicalConnections = connections.map((conn) => {
    const contract = conn.contractName ?? "";
    const desc = conn.description ?? "";
    return `${conn.id}|${conn.from}->${conn.to}|${conn.protocol}|${contract}|${desc}`;
  });

  const canonicalConstraints = constraints.map((c) => {
    return `${c.type}|${c.description}|${String(c.value ?? "")}`;
  });

  const canonicalDecisions = decisions.map((d) => {
    const alts = (d.alternatives ?? []).slice().sort().join(",");
    return `${d.title}|${d.context}|${d.decision}|${d.rationale}|alts:${alts}`;
  });

  return [
    `v:${version}`,
    `name:${name}`,
    `purpose:${purpose}`,
    `comps:[${canonicalComponents.join(";")}]`,
    `conns:[${canonicalConnections.join(";")}]`,
    `consts:[${canonicalConstraints.join(";")}]`,
    `decs:[${canonicalDecisions.join(";")}]`
  ].join("::");
}

/**
 * Checks whether an existing Handoff snapshot is stale relative to current architecture.
 */
export function isHandoffStale(
  currentArchitecture: ArchitectureProject,
  handoffSnapshotKey: string
): boolean {
  return createHandoffSnapshotKey(currentArchitecture) !== handoffSnapshotKey;
}

/**
 * Detects whether an ArchitectureProject was reverse-engineered with inferred evidence,
 * using exclusively the official typed evidence-codec.
 */
export function checkHasInferredEvidence(architecture: ArchitectureProject): boolean {
  if (!architecture.architecture) return false;
  const components = architecture.architecture.components ?? [];
  for (const component of components) {
    const tags = component.tags ?? [];
    if (tags.includes("implementation-analyzer") || tags.some((t) => t.startsWith("source:"))) {
      const evidence = decodeComponentEvidence(component);
      if (evidence.source === "inferred") {
        return true;
      }
    }
  }
  const connections = architecture.architecture.connections ?? [];
  for (const connection of connections) {
    const constraints = connection.constraints ?? [];
    if (constraints.some((c) => c.startsWith("source:"))) {
      const evidence = decodeConnectionEvidence(connection);
      if (evidence.source === "inferred") {
        return true;
      }
    }
  }
  return false;
}

/**
 * Generates the complete Execution Handoff view model for an approved ArchitectureProject.
 *
 * Enforces all safety gates:
 * 1. Rejects empty or invalid architecture (never generates empty docs pretending success);
 * 2. Emits an unapproved-candidate warning when candidates remain pending;
 * 3. Builds provenance mappings linking every task and constraint back to IR elements;
 * 4. Renders Generic, Codex, and Claude guides purely from the blueprint.
 */
export function generateExecutionHandoff(
  architecture: ArchitectureProject,
  options: HandoffOptions = {}
): HandoffViewModel {
  const now = options.timestamp ? options.timestamp() : new Date();
  const generatedAt = now.toISOString();

  // 1. Validate existence and non-emptiness
  if (
    !architecture ||
    !architecture.intent ||
    !architecture.architecture ||
    !Array.isArray(architecture.architecture.components) ||
    architecture.architecture.components.length === 0
  ) {
    return {
      status: "error",
      snapshotKey: "empty",
      generatedAt,
      architectureReference: "none",
      projectName: architecture?.intent?.name || "unnamed",
      taskProvenances: [],
      constraintProvenances: [],
      error: "架构为空或未定义，无法生成 Execution Handoff / Architecture is empty or undefined; cannot generate Execution Handoff."
    };
  }

  // 2. Validate architectural correctness
  const validator = new ArchitectureValidator();
  const validationResult = options.validationResult ?? validator.validate(architecture);
  if (!validationResult.valid) {
    return {
      status: "error",
      snapshotKey: createHandoffSnapshotKey(architecture),
      generatedAt,
      architectureReference: `${architecture.intent.name}@architecture-ir:${architecture.version}`,
      projectName: architecture.intent.name,
      taskProvenances: [],
      constraintProvenances: [],
      error: `架构校验未通过，存在 ${validationResult.issues.length} 个问题，无法生成 Execution Handoff / Architecture validation failed (${validationResult.issues.length} issue(s)); cannot generate Execution Handoff.`
    };
  }

  // 3. Generate Execution Blueprint
  const blueprint = generateExecutionBlueprint(architecture, { validationResult });
  const snapshotKey = createHandoffSnapshotKey(architecture);

  // 4. Render Guides using agent-adapter
  const guides: Record<SupportedAgentAdapter, AgentInstruction> = {
    generic: generateAgentInstruction("generic", blueprint),
    codex: generateAgentInstruction("codex", blueprint),
    "claude-code": generateAgentInstruction("claude-code", blueprint)
  };

  // 5. Establish Task Provenance
  const componentMap = new Map<string, Component>(
    architecture.architecture.components.map((c) => [c.id, c])
  );

  const taskProvenances: TaskProvenance[] = blueprint.tasks.map((task) => {
    const related = task.relatedComponents.map((compId) => {
      const found = componentMap.get(compId);
      return {
        id: compId,
        name: found?.name ?? compId
      };
    });
    return {
      taskId: task.id,
      relatedComponents: related
    };
  });

  // 6. Establish Constraint Provenance
  const constraintProvenances: ConstraintProvenance[] = blueprint.constraints.map((constraint) => {
    let targetComponentId: string | undefined = undefined;
    if (constraint.sourceReference) {
      const firstPart = constraint.sourceReference.split(":")[0];
      if (firstPart && componentMap.has(firstPart)) {
        targetComponentId = firstPart;
      }
    }
    return {
      constraintType: constraint.type,
      source: constraint.source,
      sourceReference: constraint.sourceReference,
      targetComponentId
    };
  });

  // 7. Contextual Warnings and Notices
  let warning: string | undefined = undefined;
  if (options.hasPendingCandidate) {
    warning = "尚有未批准的候选，Handoff 基于已批准的正式架构 / Unapproved candidates exist; Handoff is based on the accepted architecture.";
  }

  let inferredNotice: string | undefined = undefined;
  if (checkHasInferredEvidence(architecture)) {
    inferredNotice = "该架构由代码反演重建，含 inferred 证据 / Reconstructed from code reverse engineering, containing inferred evidence.";
  }

  return {
    status: "ready",
    snapshotKey,
    generatedAt,
    architectureReference: blueprint.architectureReference,
    projectName: blueprint.projectName,
    blueprint,
    guides,
    taskProvenances,
    constraintProvenances,
    warning,
    inferredNotice
  };
}

/**
 * Formats export content with required provenance headers and ISO timestamps.
 * Preserves verbatim agreement with the preview while identifying origin.
 */
export function formatHandoffExport(
  rawContent: string,
  metadata: HandoffExportMetadata
): string {
  if (metadata.format === "blueprint") {
    // For Blueprint JSON, ensure it is formatted and parseable
    try {
      const parsed = JSON.parse(rawContent);
      return JSON.stringify(
        {
          _handoffMetadata: {
            format: "execution-blueprint",
            architectureReference: metadata.architectureReference,
            exportedAt: metadata.generatedAt
          },
          ...parsed
        },
        null,
        2
      );
    } catch {
      return rawContent;
    }
  }

  const header = [
    `<!-- Coding CAD Execution Handoff Export -->`,
    `<!-- Architecture Reference: ${metadata.architectureReference} -->`,
    `<!-- Export Format: ${metadata.format} -->`,
    `<!-- Generated At: ${metadata.generatedAt} -->`,
    ``
  ].join("\n");

  return `${header}\n${rawContent}`;
}

/**
 * Computes standard export filename for a given handoff target.
 */
export function getHandoffExportFilename(
  projectName: string,
  format: SupportedAgentAdapter | "blueprint"
): string {
  const safeName = (projectName || "architecture").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  switch (format) {
    case "blueprint":
      return `${safeName}-blueprint.json`;
    case "generic":
      return `${safeName}-implementation-guide.md`;
    case "codex":
      return `${safeName}-codex-prompt.md`;
    case "claude-code":
      return `CLAUDE.md`;
  }
}
