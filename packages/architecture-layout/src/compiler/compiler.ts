import type { ArchitectureProject } from "@coding-cad/architecture-ir";
import type { LayoutDirection } from "../constraints/constraint.js";
import type { LayoutGraph } from "../ir/layout-graph.js";
import type { VisualGraph } from "../ir/visual-graph.js";
import type { SemanticClassification } from "../semantic/roles.js";
import { runAbstractionPass, type AbstractionResult } from "./passes/abstraction-pass.js";
import { runConstraintPass } from "./passes/constraint-pass.js";
import { runSemanticPass } from "./passes/semantic-pass.js";
import { runVisualIrPass } from "./passes/visual-ir-pass.js";

export interface CompileProjectionOptions {
  readonly direction?: LayoutDirection;
}

export interface ArchitectureLayoutProjection {
  readonly classifications: readonly SemanticClassification[];
  readonly abstraction: AbstractionResult;
  readonly visualGraph: VisualGraph;
  readonly layoutGraph: LayoutGraph;
}

/** Runs the coordinate-free part of the Architecture Layout compiler. */
export function compileArchitectureProjection(
  project: ArchitectureProject,
  options: CompileProjectionOptions = {}
): ArchitectureLayoutProjection {
  assertGraphIntegrity(project);
  const classifications = runSemanticPass(project);
  const abstraction = runAbstractionPass(project, classifications);
  const visualGraph = runVisualIrPass(project, classifications, abstraction);
  const layoutGraph = runConstraintPass(visualGraph, options.direction ?? "LR");
  return { classifications, abstraction, visualGraph, layoutGraph };
}

function assertGraphIntegrity(project: ArchitectureProject): void {
  const ids = new Set<string>();
  for (const component of project.architecture.components) {
    if (ids.has(component.id)) throw new Error(`Duplicate component id: ${component.id}`);
    ids.add(component.id);
  }
  const edgeIds = new Set<string>();
  for (const connection of project.architecture.connections) {
    if (edgeIds.has(connection.id)) throw new Error(`Duplicate connection id: ${connection.id}`);
    edgeIds.add(connection.id);
    if (!ids.has(connection.from)) throw new Error(`Unknown connection source: ${connection.from}`);
    if (!ids.has(connection.to)) throw new Error(`Unknown connection target: ${connection.to}`);
  }
}
